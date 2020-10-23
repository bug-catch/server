const express = require("express");
require("dotenv").config();

const bugcatch = require("../index");

const server = express();
server.use(express.json());

server.use((req, res, next) => {
    res.append("Access-Control-Allow-Origin", ["*"]);
    res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
    res.append("Access-Control-Allow-Headers", "Content-Type");
    next();
});

//  Applly bugcatch as middleware
server.use(
    "/",
    bugcatch({
        mongodb: {
            uri: process.env.BUGCATCH_MONGO_URI,
            database: process.env.BUGCATCH_MONGO_DATABASE,
        },
    })
);

server.listen(process.env.PORT || 8000);
