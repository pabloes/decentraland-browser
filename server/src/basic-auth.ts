import basicAuth from "express-basic-auth";

export const basicAuthMiddleware = basicAuth({
    // list of users and passwords
    users: {
        "admin": process.env.MONITOR_PASSWORD,
    },
    challenge: true
});