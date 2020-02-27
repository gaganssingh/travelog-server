const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("/api/users Endpoints", function() {
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
    describe(`GET /api/users`, () => {
        context(`When no users are present in the db`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get("/api/users")
                    .expect(200, { users: [] });
            });
        });

        // End of `When no users are present in the database`

        context(`When there are users in the database`, () => {
            beforeEach(`Insert users`, () => {
                return db.into("users").insert(testUsers);
            });

            it(`responds with 200 and all users present in the db`, () => {
                return supertest(app)
                    .get("/api/users")
                    .expect(200, { users: testUsers });
            });
        });
        // End of `When there are users in the database`
    });

    // Tests
    describe(`POST /api/users/signup`, () => {
        context(`User Validation when signing up`, () => {
            beforeEach("insert users", () => helpers.seedUsers(db, testUsers));

            const requiredFields = ["name", "email", "password"];

            requiredFields.forEach((field) => {
                const registerAttemptBody = {
                    name: "test name",
                    email: "test email",
                    password: "test password"
                };

                it(`responds with 400 required error when '${field}' is missing`, () => {
                    delete registerAttemptBody[field];

                    return supertest(app)
                        .post("/api/users/signup")
                        .send(registerAttemptBody)
                        .expect(400, {
                            error: `Missing '${field}' in request body`
                        });
                });
            });

            it(`responds 400 'Password must be 6 or more characters' when password less than 6`, () => {
                const userShortPassword = {
                    name: "test name",
                    email: "test email",
                    password: "123"
                };
                return supertest(app)
                    .post("/api/users/signup")
                    .send(userShortPassword)
                    .expect(400, {
                        error: `Password must be 6 or more characters`
                    });
            });

            it(`responds 400 'Password be less than 72 characters' when long password`, () => {
                const userLongPassword = {
                    name: "test name",
                    password: "*".repeat(73),
                    email: "test email"
                };
                return supertest(app)
                    .post("/api/users/signup")
                    .send(userLongPassword)
                    .expect(400, {
                        error: `Password must be less than 72 characters`
                    });
            });

            it(`responds 400 error when password starts with spaces`, () => {
                const userPasswordStartsSpaces = {
                    name: "test name",
                    password: " 1Aa!2Bb@",
                    email: "test email"
                };
                return supertest(app)
                    .post("/api/users/signup")
                    .send(userPasswordStartsSpaces)
                    .expect(400, {
                        error: `Password must not start or end with empty spaces`
                    });
            });

            it(`responds 400 error when password ends with spaces`, () => {
                const userPasswordEndsSpaces = {
                    name: "test name",
                    password: "1Aa!2Bb@ ",
                    email: "test email"
                };
                return supertest(app)
                    .post("/api/users/signup")
                    .send(userPasswordEndsSpaces)
                    .expect(400, {
                        error: `Password must not start or end with empty spaces`
                    });
            });

            it(`responds 403 'That email address has already been used, please login instead.' when email isn't unique`, () => {
                const duplicateUser = {
                    name: "test name",
                    password: "11AAaa!!",
                    email: testUser.email
                };
                return supertest(app)
                    .post("/api/users/signup")
                    .send(duplicateUser)
                    .expect(403, {
                        message: `That email address has already been used, please login instead.`
                    });
            });
            // End of User Validation context
        });

        context(`Happy Path when signing up`, () => {
            it(`responds with userId, email, token`, () => {
                const newUser = {
                    name: "test name",
                    email: "test email",
                    password: "11AAaa!!"
                };
                return supertest(app)
                    .post("/api/users/signup")
                    .send(newUser)
                    .expect((res) => {
                        expect(res.body).to.have.property("userId");
                        expect(res.body).to.have.property("email");
                        expect(res.body).to.have.property("token");
                    });
            });

            // End of happy path
        });
    });
});
