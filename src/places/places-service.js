const xss = require("xss");

const PlacesService = {
    getAllPlaces(knex) {
        return knex.select("*").from("places");
    },
    getPlaceById(knex, id) {
        return knex
            .from("places")
            .select("*")
            .where("id", id)
            .first();
    },
    getPlaceByUserId(knex, uid) {
        return knex
            .from("places")
            .select(
                "places.id",
                "places.title",
                "places.description",
                "places.address",
                "places.location",
                "places.creator"
            )
            .innerJoin("users", "places.creator", "users.id")
            .where("places.creator", uid);
    },
    createPlace(knex, newPlace) {
        return knex
            .from("places")
            .select("*")
            .insert(newPlace)
            .returning("*")
            .then(([place]) => place)
            .then((place) => PlacesService.getPlaceById(knex, place.id));
    },
    updatePlace(knex, id, updatedFields) {
        return knex("places")
            .where({ id })
            .update(updatedFields)
            .returning("*")
            .then(([place]) => place)
            .then((place) => PlacesService.getPlaceById(knex, place.id));
    },
    deletePlace(knex, id) {
        return knex("places")
            .where({ id })
            .delete();
    },
    serializePlace(place) {
        return {
            id: place.id,
            title: xss(place.title),
            description: xss(place.description),
            address: xss(place.address),
            location: place.location,
            creator: place.creator
        };
    }
};

module.exports = PlacesService;
