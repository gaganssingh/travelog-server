const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe(`Protected endpoints`, () => {
    let db;

    const { testUsers, testPlaces } = helpers.makePlacesFixtures();
    const testUser = testUsers[3];

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

    // Seed db
    beforeEach("insert articles", () =>
        helpers.seedPlacesTables(db, testUsers, testPlaces)
    );

    // Define protected endpoints
    const protectedEndpoints = [
        // /api/places
        {
            name: "POST /api/places",
            path: "/api/places",
            method: supertest(app).post
        }
    ];

    // Tests
    protectedEndpoints.forEach((endpoint) => {
        describe(endpoint.name, () => {
            it(`Responds 403 "Authentication failed!" when no bearer token`, () => {
                return endpoint
                    .method(endpoint.path)
                    .expect(403, { message: `Authentication failed!` });
            });
            // End of `Responds 403 "Authentication failed!" when no bearer token`

            it(`Responds 403 "Authentication failed!" when invalid JWT secret`, () => {
                const validUser = testUsers[0];
                const invalidSecret = "bad-secret";
                return endpoint
                    .method(endpoint.path)
                    .set(
                        "Authorization",
                        helpers.makeAuthHeader(validUser, invalidSecret)
                    )
                    .expect(403, { message: `Authentication failed!` });
            });
            // `Responds 403 "Authentication failed!" when invalid JWT secret`
        });
        // End of tests
    });
});
