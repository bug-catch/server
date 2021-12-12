// Check integrity of post data
const isPostData = () => {
    return (req, res, next) => {
        // Required keys => { data, type }
        if (req.body && req.body.data && req.body.type) {
            next();
        } else {
            res.status(400).json({ msg: "invalid or missing post data" });
        }
    };
};

// Verify token for GET routes
const verifyToken = (options) => {
    return (req, res, next) => {
        let auth = false;

        // Token is in body
        if (
            req.body &&
            req.body.token &&
            (req.body.token === options.api.token ||
                req.body.authorization === options.api.token)
        )
            auth = true;

        // Token is in header
        if (
            req.headers &&
            (req.headers["token"] === options.api.token ||
                req.headers["authorization"] === options.api.token)
        )
            auth = true;

        if (auth) {
            next();
        } else {
            res.status(401).json({ msg: "unauthorized" });
        }
    };
};

module.exports = {
    isPostData,
    verifyToken,
};
