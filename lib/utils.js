const database = require("./db");
const debug = require("debug")("bugcatch:utils");

/*
 * Creates required collections for bugcatch to operate
 */
async function createRequiredCollections(
    options,
    collections = ["events", "incidents", "users"]
) {
    const client = await database.connect(options.mongodb.uri);
    const db = client.db(options.mongodb.database);

    await database.createMultipleCollections(db, collections);

    client.close();
}

module.exports = {
    createRequiredCollections,
};
