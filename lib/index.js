const express = require("express");

function bugcatch_server(options) {
    const router = express.Router();

    router.get("/", (req, res, next) => {
        res.send("hello, world. bugcatcher here!");
    });

    router.get("/o", (req, res, next) => {
        res.send(options);
    });

    return router;
}

module.exports = bugcatch_server;
