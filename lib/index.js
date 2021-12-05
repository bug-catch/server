const express = require("express");
const rateLimit = require("express-rate-limit");
const pkg = require("../package.json");

const database = require("./db");
const utils = require("./utils");

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
        ...userOptions,
    };

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

    /*
     * Check integrity of post data
     */
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

    router.get("/", (req, res) => {
        res.send({ "bug-catch": "Hello, World", version: pkg.version });
    });

    router.get("/incidents", async (req, res) => {
        try {
            // Resolve promise for client (only once)
            // eslint-disable-next-line no-undef
            if (client instanceof Promise) client = await client;
            const db = client.db(options.mongodb.database);

            // Search db
            const incidents = await db.collection("incidents").find().toArray();
            const events = await db.collection("events").find().toArray();
            const users = await db.collection("users").find().toArray();

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

    router.get("/vitals", async (req, res) => {
        try {
            // Resolve promise for client (only once)
            // eslint-disable-next-line no-undef
            if (client instanceof Promise) client = await client;
            const db = client.db(options.mongodb.database);

            // Search db
            const webVitals = await db
                .collection("web-vitals")
                .find()
                .toArray();
            const users = await db.collection("users").find().toArray();

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
                utils.populateIncidentObject({
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
                utils.populateWebVitalsObject({
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
