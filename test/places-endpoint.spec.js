const knex = require("knex");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe(`/api/places endpoint`, () => {
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

    // Tests
    describe(`GET places`, () => {
        context(`When no places are present in the db`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                    .get("/api/places")
                    .expect(200, []);
            });
        });
        //End of `When no places are present in the db`

        context(`When there are places in the db`, () => {
            beforeEach("insert articles", () =>
                helpers.seedPlacesTables(db, testUsers, testPlaces)
            );

            it(`responds with 200 and all places`, () => {
                return supertest(app)
                    .get("/api/places")
                    .expect(200, testPlaces);
            });
        });
        // End of `When there are places in the db`
    });
    // End of `GET places`

    describe(`POST places`, () => {
        beforeEach("insert articles", () =>
            helpers.seedPlacesTables(db, testUsers, testPlaces)
        );

        it(`Inserts a place, responding with 201 and the new place`, function() {
            const newPlace = {
                title: "Premium Outlet Mall",
                description: "An outlet mall located in Milton.",
                address: "Toronto Premium Outlet Mall, Milton, ON",
                userId: 1
            };

            return supertest(app)
                .post("/api/places")
                .set("Authorization", helpers.makeAuthHeader(testUsers[0]))
                .send(newPlace)
                .expect(201)
                .expect((res) => {
                    // console.log(res.body.place);
                    expect(res.body.place).to.have.property("id");
                    expect(res.body.place).to.have.property("location");
                    expect(res.body.place.title).to.eql(newPlace.title);
                    expect(res.body.place.description).to.eql(
                        newPlace.description
                    );
                    expect(res.body.place.address).to.eql(newPlace.address);
                    expect(res.body.place.creator).to.eql(newPlace.userId);
                });
        });
        // `Inserts a place, responding with 201 and the new place`
    });
    // End of `POST places`

    describe.only(`PATCH places`, () => {
        beforeEach("insert articles", () =>
            helpers.seedPlacesTables(db, testUsers, testPlaces)
        );

        const requiredFields = ["title", "description"];

        requiredFields.forEach((field) => {
            const registerAttemptBody = {
                title: "test title",
                description: "test description"
            };

            it(`responds with 400 required error when '${field}' is missing`, () => {
                delete registerAttemptBody[field];

                return supertest(app)
                    .post("/api/users/signup")
                    .send(registerAttemptBody)
                    .expect(400, {
                        message: `Request body must contain either 'title' or 'description'`
                    });
            });
        });
        // End of `responds with 400 required error when '${field}' is missing`
    });
    // End of `PATCH places`
});
