const express = require("express");
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

    // TODO: ROUTE: error
    // TODO: ROUTE: event

    return router;
}

module.exports = bugcatch;
