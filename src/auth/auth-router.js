const express = require("express");
const AuthService = require("./auth-service");
const jwt = require("jsonwebtoken");
const authRouter = express.Router();
const jsonBodyParser = express.json();
const config = require("../config");
const CustomError = require("../helpers/custom-error-model");

// Login User Route
authRouter.post("/", jsonBodyParser, (req, res, next) => {
    const { email, password } = req.body;
    const loginUser = { email, password };

    // Checks for missing "email" or "body" keys
    // in the incoming body of a request
    for (const [key, value] of Object.entries(loginUser))
        if (value == null)
            return res.status(400).json({
                error: `Missing '${key}' in request body`
            });

    // Check if user entered email exists in the
    // database.
    AuthService.getUserWithEmail(req.app.get("db"), loginUser.email)
        .then((dbUser) => {
            if (!dbUser) {
                const error = new CustomError(
                    "That email address does not exist in our system, please signup instead.",
                    403
                );
                return next(error);
            }

            // if email exists in database,
            // checks whether user supplied password
            // matches the one stored in the database
            return AuthService.comparePasswords(
                loginUser.password,
                dbUser.password
            ).then((compareMatch) => {
                if (!compareMatch) {
                    const error = new CustomError(
                        "Invalid password, could not log you in.",
                        403
                    );
                    return next(error);
                }

                // If both user email & password pass
                // validation, generates the login token
                let token = jwt.sign(
                    {
                        userId: dbUser.id,
                        email: dbUser.email
                    },
                    config.JWT_SECRET,
                    { expiresIn: "1h" }
                );

                // Sends the login token, along with
                // user id and email as response back to the client
                res.send({
                    userId: dbUser.id,
                    email: dbUser.email,
                    token: token
                });
            });
        })
        .catch(next);
});

module.exports = authRouter;
