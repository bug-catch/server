const express = require("express");
const debug = require("debug")("bugcatch:main");

const database = require("./db");
const utils = require("./utils");

function bugcatch(options) {
    const router = express.Router();

    // TODO: check required options

    // Create required collections
    utils.createRequiredCollections(options);

    router.get("/", (req, res, next) => {
        res.send("hello, world. bugcatcher here!");
    });

    router.get("/test", async (req, res, next) => {
        const client = await database.connect(options.mongodb.uri);
        const db = client.db(options.mongodb.database);

        // Get user object
        const user = utils.getUserObject(req);

        // Search db if user object exists
        const userExists = await db
            .collection("users")
            .findOne({ uid: user.uid });

        // Add user to db (if user not found in db)
        if (!userExists) {
            debug("document added to users collection");
            db.collection("users").insertOne(user);
        }

        res.send(user);
    });

    // TODO: ROUTE: error
    // TODO: ROUTE: event
    // TODO: verify request integrity

    return router;
}

module.exports = bugcatch;
