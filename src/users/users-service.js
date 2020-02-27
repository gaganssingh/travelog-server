const bcrypt = require("bcryptjs");
const xss = require("xss");

const UsersService = {
    getAllUsers(knex) {
        return knex.select("*").from("users");
    },
    hasUserWithEmail(knex, email) {
        return knex("users")
            .where({ email })
            .first()
            .then((email) => !!email);
    },
    insertUser(knex, newUser) {
        return knex
            .insert(newUser)
            .into("users")
            .returning("*")
            .then(([user]) => user);
    },
    validatePassword(password) {
        if (password.length < 6) {
            return "Password must be 6 or more characters";
        }
        if (password.length > 72) {
            return "Password must be less than 72 characters";
        }
        if (password.startsWith(" ") || password.endsWith(" ")) {
            return "Password must not start or end with empty spaces";
        }
        return null;
    },
    hashPassword(password) {
        return bcrypt.hash(password, 12);
    },
    serializeUser(user) {
        return {
            userId: user.id,
            name: xss(user.name),
            email: xss(user.email)
        };
    }
};

module.exports = UsersService;
