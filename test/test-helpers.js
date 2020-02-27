const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../src/config");

function makeUsersArray() {
    return [
        {
            id: 1,
            name: "test",
            email: "test@test.com",
            password: "password"
        },
        {
            id: 2,
            name: "test2",
            email: "test2@test.com",
            password: "password"
        },
        {
            id: 3,
            name: "test3",
            email: "test3@test.com",
            password: "password"
        },
        {
            id: 4,
            name: "test4",
            email: "test4@test.com",
            password: "password"
        }
    ];
}

function makePlacesArray() {
    return [
        {
            id: 1,
            title: "CN Tower",
            description: "Tallest structure",
            address: "123 St, Toronto",
            location: {
                lat: 40.11,
                lng: -29.11
            },
            creator: 1
        },
        {
            id: 2,
            title: "Whistler",
            description: "Tallest structure",
            address: "123 Lane, Whistler",
            location: {
                lat: 30.11,
                lng: -19.11
            },
            creator: 2
        },
        {
            id: 3,
            title: "Rainbow Bridge",
            description: "Bridge connecting Canada and USA",
            address: "456 Ave, Niagara Falls",
            location: {
                lat: 45.23,
                lng: -37.98
            },
            creator: 3
        }
    ];
}

function makePlacesFixtures() {
    const testUsers = makeUsersArray();
    const testPlaces = makePlacesArray();
    return { testUsers, testPlaces };
}

function seedUsers(db, users) {
    const preppedUsers = users.map((user) => ({
        ...user,
        password: bcrypt.hashSync(user.password, 1)
    }));
    return db
        .into("users")
        .insert(preppedUsers)
        .then(() =>
            // update the auto sequence to stay in sync
            db.raw(`SELECT setval('users_id_seq', ?)`, [
                users[users.length - 1].id
            ])
        );
}

function seedPlacesTables(db, users, places) {
    // use a transaction to group the queries and auto rollback on any failure
    return db.transaction(async (trx) => {
        await seedUsers(trx, users);
        await trx.into("places").insert(places);
        // update the auto sequence to match the forced id values
        await trx.raw(`SELECT setval('places_id_seq', ?)`, [
            places[places.length - 1].id
        ]);
    });
}

// function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
//     const token = jwt.verify(token, process.env.JWT_SECRET);
//     return `Bearer ${token}`;
// }
function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
    const token = jwt.sign({ user_id: user.id }, secret, {
        subject: user.email,
        algorithm: "HS256"
    });
    return `Bearer ${token}`;
}

module.exports = {
    makeUsersArray,
    seedUsers,
    makeAuthHeader,
    makePlacesFixtures,
    seedPlacesTables
};
