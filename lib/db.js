const { MongoClient } = require("mongodb");
const debug = require("debug")("bugcatch:mongodb");

/*
 * Connect to MongoDB instance
 */
async function connect(uri) {
    /**
     * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
     * See https://docs.mongodb.com/ecosystem/drivers/node/ for more details
     */
    // const uri = "mongodb+srv://<username>:<password>@<your-cluster-url>/test?retryWrites=true&w=majority";

    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    // Connect to the MongoDB cluster
    await client.connect().catch((err) => console.log(err));

    return client;
}

/*
 * Checks if MongoDB collection exists
 */
async function doesCollectionExist(db, collection) {
    const collections = await db.collections();
    if (!collections.map((c) => c.s.namespace.collection).includes(collection))
        return false;
    return true;
}

/*
 * Create MongoDB collection (if it does not already exist)
 */
async function createCollection(db, collection) {
    const collectionExists = await doesCollectionExist(db, collection);
    if (!collectionExists) {
        db.createCollection(collection, function (err, res) {
            if (err) throw err;
            debug(`collection created: ${collection}`);
        });
    }
}

/*
 * Create multiple collections
 */
async function createMultipleCollections(db, collections = []) {
    for (let c in collections) {
        await createCollection(db, collections[c]);
    }
}

/*
 * Add object to database
 *
 * @param {object} db database connection object
 * @param {string} collection name
 * @param {object} object to add into db
 */
async function insert(db, collection, obj) {
    debug(`document added to ${collection} collection`);
    await db.collection(collection).insertOne(obj);
}

/*
 * Add object to database if it does not already exist
 *
 * @param {object} db database connection object
 * @param {string} collection name
 * @param {object} object to add into db
 */
async function insertUnique(db, collection, obj) {
    // Search db if object exists
    const objExists = await db.collection(collection).findOne({ uid: obj.uid });

    // Add object to db (if object not found in db)
    if (!objExists) {
        await insert(db, collection, obj);
    }
}

module.exports = {
    connect,
    doesCollectionExist,
    createCollection,
    createMultipleCollections,
    insert,
    insertUnique,
};
