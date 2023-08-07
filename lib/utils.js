const WhichBrowser = require("which-browser");
const moment = require("moment");
const crypto = require("crypto");
const geoip = require("geoip-lite");

const database = require("./db/db");

/**
 * Creates required collections for bugcatch to operate
 */
async function createRequiredCollections(
    options,
    collections = ["events", "incidents", "users", "web-vitals"]
) {
    const client = await database.connect(options.mongodb.uri);
    const db = client.db(options.mongodb.database);

    // Create all required collections
    await database.createMultipleCollections(db, collections);

    // Setup collections - create indexes
    await db.collection("events").createIndex({ uid: 1 }, { unique: true });
    await db.collection("users").createIndex({ uid: 1 }, { unique: true });

    client.close();
}

/**
 * Returns browser object containing parsed useragent info
 */
function parseDeviceInfo(req) {
    const deviceDataInBody = req?.body?.device;
    const deviceDataInBodyExists = typeof deviceDataInBody === 'object' && deviceDataInBody !== null;

    const browserData = new WhichBrowser(req.headers) || {};
    const browserDataExists = typeof browserData === 'object' && browserData !== null && (browserData?.browser?.name || browserData?.os?.name);

    // Catch potentially missing data
    if (!browserData?.browser?.version) browserData.browser.version = {};
    if (!browserData?.os?.version) browserData.os.version = {};

    return {
        device: browserData?.device?.type ?? "unknown",
        ...(browserDataExists ? {
            os: {
                name: browserData?.os?.name,
                version: browserData?.os?.version?.value,
            },
            browser: {
                name: browserData?.browser?.name,
                version: browserData?.browser?.version?.value,
            }
        } : {}),
        // Check for device data in request,
        // use that to override guessing browser data.
        ...(deviceDataInBodyExists ? { ...deviceDataInBody } : {}),
    };
}

/**
 * Create hash from string
 */
function createHash(hash, string) {
    return crypto.createHash(hash).update(string).digest("hex");
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
function isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
function mergeDeep(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                mergeDeep(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return mergeDeep(target, ...sources);
}

/**
 * Returns user object: used to store in database
 */
function populateUserObject(req) {
    const ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    const ip_obfuscate = Buffer.from(ip).toString("base64");
    const geoip_lookup = geoip.lookup(ip) || {};

    const user = {
        uid: 0,
        ip_address: ip_obfuscate,
        geoip: {
            country: geoip_lookup.country,
            region: geoip_lookup.region,
            city: geoip_lookup.city,
        },
    };

    // Generate user id
    // hash of ip + location info
    user.uid = createHash("sha1", ip + JSON.stringify(user.geoip));

    return user;
}

/**
 * Returns event object: used to store in database
 */
function populateEventObject(req, type, data) {
    const userEvent = {
        uid: 0,
        type: type,
        data: data,
    };

    // Generate object id
    // hash of type + data
    userEvent.uid = createHash(
        "sha1",
        userEvent.type + JSON.stringify(userEvent.data)
    );

    return userEvent;
}

/**
 * Returns incident object: used to store in database
 */
function populateIncidentObject(req, obj) {
    const device = parseDeviceInfo(req);
    const incidentData = req?.body?.incidentData;

    return {
        user_uid: obj.user_uid,
        event_uid: obj.event_uid,
        event_type: obj.event_type,
        release: obj.release || "0.0.0",
        location: obj.location || "",
        device: device,
        incidentData,
        timestamp: Date.now(),
        timestamp_friendly: moment(Date.now()).format("YYYY MMMM Do, HH:mm"),
    };
}

/**
 * Returns web-vitals object: used to store in database
 */
function populateWebVitalsObject(req, obj) {
    const device = parseDeviceInfo(req);

    delete obj.data["hasSent"];

    return {
        user_uid: obj.user_uid,
        data: obj.data,
        release: obj.release || "0.0.0",
        device: device,
        timestamp: Date.now(),
        timestamp_friendly: moment(Date.now()).format("YYYY MMMM Do, HH:mm"),
    };
}

module.exports = {
    createRequiredCollections,
    parseDeviceInfo,
    createHash,
    mergeDeep,
    populateUserObject,
    populateEventObject,
    populateIncidentObject,
    populateWebVitalsObject,
};
