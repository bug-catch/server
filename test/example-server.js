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

if (!process.env.BUGCATCH_MONGO_URI || !process.env.BUGCATCH_MONGO_DATABASE) {
    console.log(`\nERROR: Required ENV vars are missing`);
    process.exit(1);
}

//  Applly bugcatch as middleware
server.use(
    "/",
    bugcatch({
        api: {
            token: "super-duper-secret-password",
        },
        mongodb: {
            uri: process.env.BUGCATCH_MONGO_URI,
            database: process.env.BUGCATCH_MONGO_DATABASE,
        },
    })
);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
    console.log(`\nBug-Catch API`);
    console.log(`-> Port ${PORT} : http://localhost:${PORT}`);
    console.log(`-> MongoDB   : ${process.env.BUGCATCH_MONGO_DATABASE}`);
    console.log(``);
});
