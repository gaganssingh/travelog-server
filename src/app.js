require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { NODE_ENV } = require("./config");
const placesRouter = require("./places/places-router");
const usersRouter = require("./users/users-router");
const authRouter = require("./auth/auth-router");
const CustomError = require("./helpers/custom-error-model");
const cors = require("cors");

const app = express();

const morganOption = NODE_ENV === "production" ? "tiny" : "common";

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());

app.use(bodyParser.json());

app.use("/api/places", placesRouter);
app.use("/api/users", usersRouter);

// User Login path
app.use("/api/users/login", authRouter);

// Unknown route handler
app.use((req, res, next) => {
    const error = new CustomError("Cound not find this route.", 404);
    throw error;
});

// General handler
app.get("/", (req, res) => {
    res.send("Hello, world!");
});

// Generic error handler
app.use(function errorHandler(error, req, res, next) {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        });
    }
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || "An unknown error occurred!" });
});

module.exports = app;
