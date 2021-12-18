const debug = require("debug")("bugcatch:controllers");
const NodeCache = require("node-cache");

const aggregators = require("../db/aggregators");
const database = require("../db/db");
const utils = require("../utils");

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

//
// API routes below
//

const getReport = (client, options) => {
    return async (req, res) => {
        try {
            // Resolve promise for client (only once)
            // eslint-disable-next-line no-undef
            if (client instanceof Promise) client = await client;
            const db = client.db(options.mongodb.database);

            const response = {
                users: {},
                events: {},
                incidents: {},
                vitals: {},
            };

            // Users
            //
            // Total users
            const users = await getCollection(db, "users");

            // Events
            const eventsInsights = await useCache(`report/events`, async () => {
                return await db
                    .collection("events")
                    .aggregate(aggregators.aggregateEvents)
                    .next();
            });

            // Incidents
            //
            // Most common event
            // Least common event
            const incidentsInsights = await useCache(
                `report/incidents`,
                async () => {
                    return await db
                        .collection("incidents")
                        .aggregate(aggregators.aggregateIncidents)
                        .next();
                }
            );

            const incidentsErrorsInsights = await useCache(
                `report/incidents/errors`,
                async () => {
                    return await db
                        .collection("incidents")
                        .aggregate(aggregators.aggregateModeEvent("error"))
                        .next();
                }
            );

            const incidentsEventsInsights = await useCache(
                `report/incidents/events`,
                async () => {
                    return await db
                        .collection("incidents")
                        .aggregate(aggregators.aggregateModeEvent("events"))
                        .next();
                }
            );

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

            response.users.total = users.length;
            response.events = eventsInsights;
            response.incidents = incidentsInsights;
            response.incidents.errors = incidentsErrorsInsights;
            response.incidents.events = incidentsEventsInsights;
            response.vitals = webVitalsInsights;

            res.send(response);
        } catch (err) {
            res.status(500).json({
                status: "500 Internal Server Error",
                msg: "server error, please try again later",
            });
        }
    };
};

const getIncidents = (client, options) => {
    return async (req, res) => {
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
    };
};

const getVitals = (client, options) => {
    return async (req, res) => {
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
    };
};

const catchEvent = (client, options) => {
    return async (req, res) => {
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
            debug("ERROR: /event: Failed to process incident");
        }
    };
};

const catchEventWebVitals = (client, options) => {
    return async (req, res) => {
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
            debug("ERROR: /vitals: Failed to process web-vitals data");
        }
    };
};

module.exports = {
    getReport,
    getIncidents,
    getVitals,
    catchEvent,
    catchEventWebVitals,
};
