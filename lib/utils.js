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
    const geoip_lookup = geoip.lookup(ip) || {};
    const browser = parseBrowserInfo(req);

    const user = {
        uid: 0,
        ip_address: ip,
        geoip: {
            country: geoip_lookup.country,
            region: geoip_lookup.region,
            city: geoip_lookup.city,
        },
        system: {
            browser: {
                name: browser.browser.name,
                version: browser.browser.version.value,
                device: browser.device.type,
            },
            os: {
                name: browser.os.name,
                version: browser.os.version.value,
            },
        },
    };

    // Generate user id
    // hash of ip + system info
    user.uid = createHash("sha1", user.ip + JSON.stringify(user.system));

    return user;
}

module.exports = {
    createRequiredCollections,
    parseBrowserInfo,
    createHash,
    getUserObject,
};
