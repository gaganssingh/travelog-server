require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const UsersService = require("./users-service");
const usersRouter = express.Router();
const jsonBodyParser = express.json();
const config = require("../config");

// Generic get all users
usersRouter.get("/", (req, res, next) => {
    // /api/users/ Route
    const knexInstance = req.app.get("db");
    UsersService.getAllUsers(knexInstance)
        .then((users) => {
            res.json({ users });
        })
        .catch(next);
});

// /api/users/signup Route
usersRouter.post("/signup", jsonBodyParser, (req, res, next) => {
    // Signup User
    const knexInstance = req.app.get("db");
    const { name, email, password } = req.body;

    // Validating if all required keys are
    // present in the request body
    for (const field of ["name", "email", "password"])
        if (!req.body[field])
            return res.status(400).json({
                error: `Missing '${field}' in request body`
            });

    // Password validation
    const passwordError = UsersService.validatePassword(password);

    if (passwordError) {
        return res.status(400).json({ error: passwordError });
    }

    // Check if incoming email already used for signup
    UsersService.hasUserWithEmail(knexInstance, email)
        .then((hasUserWithEmail) => {
            if (hasUserWithEmail) {
                return res.status(400).json({
                    error: `Email already in use. Please signup instead.`
                });
            }

            // Hash password
            return UsersService.hashPassword(password).then(
                (hashedPassword) => {
                    // Construct the new user to
                    // be inserted into the database
                    const newUser = {
                        name,
                        email,
                        password: hashedPassword
                    };

                    // Insert the new user into the database
                    return UsersService.insertUser(
                        req.app.get("db"),
                        newUser
                    ).then((user) => {
                        // Generate jwt token
                        let token = jwt.sign(
                            {
                                userId: newUser.id,
                                email: newUser.email
                            },
                            config.JWT_SECRET,
                            { expiresIn: "1h" }
                        );
                        // Construct and send response to the client
                        res.send({
                            userId: newUser.id,
                            email: newUser.email,
                            token: token
                        });
                    });
                }
            );
        })
        .catch(next);
});

module.exports = usersRouter;
