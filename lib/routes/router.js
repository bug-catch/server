const express = require("express");
const rateLimit = require("express-rate-limit");
const pkg = require("../../package.json");

const database = require("../db/db");
const middleware = require("./middleware");
const controllers = require("./controllers");

function getBugCatchRouter(options) {
    const router = express.Router();

    const apiLimiter = rateLimit({
        windowMs: options.api.rateLimit.windowMs,
        max: options.api.rateLimit.max,
    });

    // Connect to mongodb client
    // Keep the connection alive and re-used this client for all requests
    let client = database.connect(options.mongodb.uri);

    // Welcome route :)
    router.get("/", (req, res) => {
        res.send({ "bug-catch": "Hello, World", version: pkg.version });
    });

    // GET
    // Used for data retrieval (not user-facing in any way, requires a token to access)
    router.get(
        "/release/report",
        middleware.verifyToken(options),
        controllers.getReport(client, options)
    );
    router.get(
        "/release/vitals",
        middleware.verifyToken(options),
        controllers.getVitals(client, options)
    );
    router.get(
        "/release/incidents",
        middleware.verifyToken(options),
        controllers.getIncidents(client, options)
    );

    // POST
    // Catch events, such as errors, vitals and other custom events
    router.post(
        "/catch/event",
        middleware.isPostData(),
        apiLimiter,
        controllers.catchEvent(client, options)
    );
    router.post(
        "/catch/vitals",
        middleware.isPostData(),
        apiLimiter,
        controllers.catchEventWebVitals(client, options)
    );

    return router;
}

module.exports = getBugCatchRouter;
