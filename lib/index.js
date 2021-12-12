const express = require("express");
const rateLimit = require("express-rate-limit");
const NodeCache = require("node-cache");
const pkg = require("../package.json");

const database = require("./db");
const utils = require("./utils");

const aggregators = require("./mongodb/aggregators");

function bugcatch(userOptions) {
    // Declare default options here, also apply user options over the top
    const options = {
        api: {
            token: "super-secret-password", // Token required for viewing the data
            rateLimit: {
                windowMs: 60 * 60 * 1000, // 60 minutes
                max: 15,
            },
        },
        mongodb: {
            uri: "",
            database: "bug-catch",
        },
    };

    // Merge userOptions with options without removing nested options
    utils.mergeDeep(options, userOptions);

    const router = express.Router();

    const apiLimiter = rateLimit({
        windowMs: options.api.rateLimit.windowMs,
        max: options.api.rateLimit.max,
    });

    // Check required options
    if (!options.mongodb || !options.mongodb.uri || !options.mongodb.database)
        throw "bug-catch: missing required options";

    // Create required collections
    utils.createRequiredCollections(options);

    // Connect to mongodb client
    // Keep the connection alive and re-used this client for all requests
    let client = database.connect(options.mongodb.uri);

    // Check integrity of post data
    const isPostData = () => {
        return (req, res, next) => {
            // Required keys => { data, type }
            if (req.body && req.body.data && req.body.type) {
                next();
            } else {
                res.status(400).json({ msg: "invalid or missing post data" });
            }
        };
    };

    // Verify token for GET routes
    const verifyToken = () => {
        return (req, res, next) => {
            let auth = false;

            // Token is in body
            if (
                req.body &&
                req.body.token &&
                (req.body.token === options.api.token ||
                    req.body.authorization === options.api.token)
            )
                auth = true;

            // Token is in header
            if (
                req.headers &&
                (req.headers["token"] === options.api.token ||
                    req.headers["authorization"] === options.api.token)
            )
                auth = true;

            if (auth) {
                next();
            } else {
                res.status(401).json({ msg: "unauthorized" });
            }
        };
    };

    // Init cache
    // Cache DB collections
    //
    // stdTTL = cache time-to-live in seconds (5*60 = 5 minutes)
    const Cache = new NodeCache({ stdTTL: 10 * 60 });

    // Stores the response from a callback in the cache
    // and uses the cached response for future calls using the same key
    const useCache = async (key, cb, ...cbArgs) => {
        // Attempt to use cached result
        // returns null if non-existent or key has expired
        let res = Cache.get(key);

        if (!res) {
            // Cache the response from the callback
            res = await cb(...cbArgs);
            Cache.set(key, res);
        }

        return res;
    };

    const getCollection = async (db, collection) => {
        return await useCache(
            `collection/${collection}`,
            async (db, collection) => {
                return await db.collection(collection).find().toArray();
            },
            db,
            collection
        );
    };

    router.get("/", (req, res) => {
        res.send({ "bug-catch": "Hello, World", version: pkg.version });
    });

    router.get("/report", verifyToken(), async (req, res) => {
        try {
            // Resolve promise for client (only once)
            // eslint-disable-next-line no-undef
            if (client instanceof Promise) client = await client;
            const db = client.db(options.mongodb.database);

            const response = {
                users: {},
                errors: {},
                events: {},
                vitals: {},
            };

            // Users
            //
            // Total users
            // response.users.total = users.length;

            // Errors
            //
            // Simmarize error data -> errors per user (min, max & avg), total errors
            // Most common error
            // Least common error

            // Events
            //
            // Most common event
            // Least common event

            // Vitals summary
            //
            // Summarize all data into min, max & average values
            const webVitalsInsights = await useCache(
                `report/web-vitals`,
                async () => {
                    return await db
                        .collection("web-vitals")
                        .aggregate(aggregators.aggregateWebVitals)
                        .next();
                }
            );

            response.vitals = webVitalsInsights;

            res.send(response);
        } catch (err) {
            res.status(500).json({
                status: "500 Internal Server Error",
                msg: "server error, please try again later",
            });
        }
    });

    router.get("/incidents", verifyToken(), async (req, res) => {
        try {
            // Resolve promise for client (only once)
            // eslint-disable-next-line no-undef
            if (client instanceof Promise) client = await client;
            const db = client.db(options.mongodb.database);

            // Search db
            const incidents = await getCollection(db, "incidents");
            const events = await getCollection(db, "events");
            const users = await getCollection(db, "users");

            const response = {
                incidents,
                events,
                users,
            };

            res.send(response);
        } catch (err) {
            res.status(500).json({
                status: "500 Internal Server Error",
                msg: "server error, please try again later",
            });
        }
    });

    router.get("/vitals", verifyToken(), async (req, res) => {
        try {
            // Resolve promise for client (only once)
            // eslint-disable-next-line no-undef
            if (client instanceof Promise) client = await client;
            const db = client.db(options.mongodb.database);

            // Search db
            const users = await getCollection(db, "users");
            const webVitals = await getCollection(db, "web-vitals");

            const response = {
                webVitals,
                users,
            };

            res.send(response);
        } catch (err) {
            res.status(500).json({
                status: "500 Internal Server Error",
                msg: "server error, please try again later",
            });
        }
    });

    router.post("/event", isPostData(), apiLimiter, async (req, res) => {
        res.send({ status: "200 OK" });

        try {
            // Resolve promise for client (only once)
            // eslint-disable-next-line no-undef
            if (client instanceof Promise) client = await client;
            const db = client.db(options.mongodb.database);

            // Get user and event object
            const user = utils.populateUserObject(req);
            const userEvent = utils.populateEventObject(
                req,
                req.body.type,
                req.body.data
            );

            // Save unique user and event objects to db
            await database.insertUnique(db, "users", user);
            await database.insertUnique(db, "events", userEvent);

            // Log incident to db
            database.insert(
                db,
                "incidents",
                utils.populateIncidentObject(req, {
                    user_uid: user.uid,
                    event_uid: userEvent.uid,
                    event_type: req.body.type,
                    release: req.body.release,
                    location: req.body.location,
                })
            );
        } catch (err) {
            console.log("ERROR: /event: Failed to process incident");
        }
    });

    router.post("/vitals", isPostData(), apiLimiter, async (req, res) => {
        res.send({ status: "200 OK" });

        try {
            // Resolve promise for client (only once)
            // eslint-disable-next-line no-undef
            if (client instanceof Promise) client = await client;
            const db = client.db(options.mongodb.database);

            // Get user object
            // Save unique user and event objects to db
            const user = utils.populateUserObject(req);
            await database.insertUnique(db, "users", user);

            // Log web-vital data to db
            database.insert(
                db,
                "web-vitals",
                utils.populateWebVitalsObject(req, {
                    user_uid: user.uid,
                    release: req.body.release,
                    data: req.body.data,
                })
            );
        } catch (err) {
            console.log("ERROR: /vitals: Failed to process web-vitals data");
        }
    });

    return router;
}

module.exports = bugcatch;
