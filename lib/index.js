const express = require("express");
const pkg = require("../package.json");
const debug = require("debug")("bugcatch:main");

const database = require("./db");
const utils = require("./utils");

function bugcatch(options) {
    const router = express.Router();

    // Check required options
    if (!options.mongodb || !options.mongodb.uri || !options.mongodb.database)
        throw "bugcatch: missing required options";

    // Create required collections
    utils.createRequiredCollections(options);

    router.get("/", (req, res) => {
        res.send({ bugcatcher: "hello, world", version: pkg.version });
    });

    router.get("/incidents", async (req, res) => {
        // Connect to mongodb client
        const client = await database.connect(options.mongodb.uri);
        const db = client.db(options.mongodb.database);

        // Search db
        const response = await db
            .collection("incidents")
            .aggregate([
                {
                    $lookup: {
                        from: "events",
                        localField: "event_uid",
                        foreignField: "uid",
                        as: "event",
                    },
                },
                {
                    $lookup: {
                        from: "users",
                        localField: "user_uid",
                        foreignField: "uid",
                        as: "user",
                    },
                },
                {
                    $unwind: {
                        path: "$event",
                        preserveNullAndEmptyArrays: true,
                    },
                },
                {
                    $unwind: {
                        path: "$user",
                        preserveNullAndEmptyArrays: true,
                    },
                },
            ])
            .toArray();

        res.send(response);
    });

    router.get("/error", async (req, res) => {
        res.send({ status: "200 OK" });

        // Connect to mongodb client
        const client = await database.connect(options.mongodb.uri);
        const db = client.db(options.mongodb.database);

        // Get user object
        const user = utils.populateUserObject(req);

        // Search db if user object exists
        const userExists = await db
            .collection("users")
            .findOne({ uid: user.uid });

        // Add user to db (if user not found in db)
        if (!userExists) {
            debug("document added to users collection");
            db.collection("users").insertOne(user);
        }

        // Get event object
        const userEvent = utils.populateEventObject(req, "error", {});

        // Search db if event object exists
        const userEventExists = await db
            .collection("events")
            .findOne({ uid: userEvent.uid });

        // Add event to db (if event not found in db)
        if (!userEventExists) {
            debug("document added to events collection");
            db.collection("events").insertOne(userEvent);
        }

        // Log incident to db
        db.collection("incidents").insertOne({
            user_uid: user.uid,
            event_uid: userEvent.uid,
            timestamp: Date.now(),
        });
    });

    // TODO: ROUTE: event
    // TODO: verify request integrity

    return router;
}

module.exports = bugcatch;
