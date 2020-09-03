const express = require("express");
const bugcatch = require("../index");

const server = express();
server.use(express.json());

//  Applly bugcatch as middleware
server.use( "/", bugcatch({ test: "wow" }) );

server.listen(process.env.PORT || 8000);
