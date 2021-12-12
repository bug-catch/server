const router = require("./routes/router");
const utils = require("./utils");

function bugcatch(userOptions) {
    // Declare default options here, also apply user options over the top
    const options = {
        api: {
            token: "super-secret-password", // Token required for viewing the data
            rateLimit: {
                windowMs: 60 * 60 * 1000, // 60 minutes
                max: 15,
            },
        },
        mongodb: {
            uri: "",
            database: "bug-catch",
        },
    };

    // Merge userOptions with options without removing nested options
    utils.mergeDeep(options, userOptions);

    // Check required options
    if (!options.mongodb.uri || !options.mongodb.database)
        throw "bug-catch: missing required options";

    // Create required collections
    utils.createRequiredCollections(options);

    return router(options);
}

module.exports = bugcatch;
