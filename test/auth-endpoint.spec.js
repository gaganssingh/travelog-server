const knex = require("knex");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe(`Auth endpoints`, () => {
    let db;

    const { testUsers } = helpers.makePlacesFixtures();
    const testUser = testUsers[0];

    before("make knex instance", () => {
        db = knex({
            client: "pg",
            connection: process.env.TEST_DB_URL
        });
        app.set("db", db);
    });

    // DB disconnection and cleanup
    after("disconnect from db", () => db.destroy());

    before("Clear the table", () =>
        db.raw("TRUNCATE users, places RESTART IDENTITY CASCADE")
    );
    afterEach("Cleanup", () =>
        db.raw("TRUNCATE users, places RESTART IDENTITY CASCADE")
    );

    // Tests
    describe(`POST /api/users/login endpoint`, () => {
        beforeEach("Insert users", () => helpers.seedUsers(db, testUsers));

        const requiredFields = ["email", "password"];

        requiredFields.forEach((field) => {
            const loginAttemptBody = {
                email: testUser.email,
                password: testUser.password
            };

            it(`Responds with 400 required error when '${field}' is missing`, () => {
                delete loginAttemptBody[field];

                return supertest(app)
                    .post("/api/users/login")
                    .send(loginAttemptBody)
                    .expect(400, {
                        error: `Missing '${field}' in request body`
                    });
            });
        });
        // `responds with 400 required error when '${field}' is missing`

        it(`Responds 403 'That email address does not exist in our system, please signup instead.`, () => {
            const userInvalidUser = {
                email: "non-existing@email.com",
                password: "existy"
            };
            return supertest(app)
                .post("/api/users/login")
                .send(userInvalidUser)
                .expect(403, {
                    message: `That email address does not exist in our system, please signup instead.`
                });
        });
        // `responds 403 'That email address does not exist in our system, please signup instead.`

        it(`Responds 403 "Invalid password, could not log you in." when invalid password`, () => {
            const userInvalidPass = {
                email: testUser.email,
                password: "incorrect"
            };
            return supertest(app)
                .post("/api/users/login")
                .send(userInvalidPass)
                .expect(403, {
                    message: "Invalid password, could not log you in."
                });
        });
        // `Responds 403 "Invalid password, could not log you in." when invalid password`

        it(`Responds 200, userId, email and JWT auth token using secret when valid credentials`, () => {
            const userValidCreds = {
                email: testUser.email,
                password: testUser.password
            };
            const expectedToken = jwt.sign(
                { userId: testUser.id, email: testUser.email },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
            return supertest(app)
                .post("/api/users/login")
                .send(userValidCreds)
                .expect(200, {
                    userId: testUser.id,
                    email: testUser.email,
                    token: expectedToken
                });
        });
        // `Responds 200, userId, email and JWT auth token using secret when valid credentials`
    });
    // End of POST /api/users/login endpoint
});
