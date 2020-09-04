const WhichBrowser = require("which-browser");
const crypto = require("crypto");
const geoip = require("geoip-lite");
const debug = require("debug")("bugcatch:utils");

const database = require("./db");

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

/*
 * Returns browser object containing parsed useragent info
 */
function parseBrowserInfo(req) {
    const result = new WhichBrowser(req.headers);
    return result;
}

/*
 * Create hash from string
 */
function createHash(hash, string) {
    return crypto.createHash(hash).update(string).digest("hex");
}

/*
 * Returns user object: used to store in database
 */
function getUserObject(req) {
    const ip = req.connection.remoteAddress;
    const geo_lookup = geoip.lookup(ip) || {};
    const browser = parseBrowserInfo(req);

    const geo = {
        country: geo_lookup.country,
        region: geo_lookup.region,
        city: geo_lookup.city
    }

    const system = {
        browser: {
            name: browser.browser.name,
            version: browser.browser.version.value,
            device: browser.device.type
        },
        os: {
            name: browser.os.name,
            version: browser.os.version.value
        }
    }

    const id = createHash("sha1", ip + JSON.stringify(system));

    const user = {
        id: id,
        ip_address: ip,
        geoip: geo,
        system: system
    }

    return user;
}

module.exports = {
    createRequiredCollections,
    parseBrowserInfo,
    createHash,
    getUserObject
};
