const express = require("express");
const PlacesService = require("./places-service");
const getCoordinates = require("../helpers/location");
const checkAuth = require("../middlewares/check-auth");
const placesRouter = express.Router();
const jsonBodyParser = express.json();

// HELPER FUNCTIONS
// Generic check place exists function
async function checkPlaceExists(req, res, next) {
    try {
        const place = await PlacesService.getPlaceById(
            req.app.get("db"),
            req.params.pid
        );

        if (!place)
            return res.status(404).json({
                error: `Place with id ${req.params.pid} doesn't exist.`
            });

        res.place = place;
        next();
    } catch (error) {
        next(error);
    }
}

async function getCoordinatesFromAddress(address) {
    try {
        const coordinates = await getCoordinates(address);
        return coordinates;
    } catch (error) {
        return next(error);
    }
}

// ROUTES REQUIRING NO AUTHORIZATION
// /api/places/ Route
placesRouter
    .route("/")
    // GET all places route
    // Not being used at the moment
    .get((req, res, next) => {
        const knexInstance = req.app.get("db");
        PlacesService.getAllPlaces(knexInstance)
            .then((places) => {
                res.json(places);
            })
            .catch(next);
    });

// /api/places/(place id) Route
placesRouter
    .route("/:pid")
    .all(checkPlaceExists)
    // Get place by a given id
    .get((req, res) => {
        const knexInstance = req.app.get("db");
        const placeId = req.params.pid;

        PlacesService.getPlaceById(knexInstance, placeId).then((place) => {
            res.json({ place });
        });
    });

// /api/places/users/(user id) Route
placesRouter.route("/user/:uid").get((req, res, next) => {
    // Get all places by userid
    const knexInstance = req.app.get("db");
    const userId = req.params.uid;
    PlacesService.getPlaceByUserId(knexInstance, userId)
        .then((places) => {
            res.json({ places });
        })
        .catch(next);
});

// ROUTES REQUIRING AUTHORIZATION
placesRouter.use(checkAuth);

placesRouter.route("/").post(
    jsonBodyParser,
    // Post a new place
    // createPlace "/"
    (req, res, next) => {
        const knexInstance = req.app.get("db");
        const { title, description, address, userId } = req.body;

        // Validating if all required keys are
        // present in the request body
        for (const [key, value] of Object.entries(req.body)) {
            if (value == null)
                return res.status(400).json({
                    error: { message: `Missing '${key}' in request body` }
                });
        }

        // Get coordinates by supplying address
        // to helper function. Try/Catch block as
        // the helper function makes fetch call to
        // an external api
        getCoordinatesFromAddress(address).then((coordinates) => {
            // Structure the new place so it's ready
            // to be inserted into the database
            // prettier-ignore
            const newPlace = {
                    title,
                    description,
                    address,
                    location: { "lat": coordinates.lat, "lng": coordinates.lng },
                    creator: userId
                };

            // Insert the new place into the database
            PlacesService.createPlace(knexInstance, newPlace)
                .then((place) => {
                    res.status(201).json({
                        place: PlacesService.serializePlace(place)
                    });
                })
                .catch(next);
        });
    }
);

placesRouter
    .route("/:pid")
    .all(checkPlaceExists)
    // Update an existing place
    .patch(jsonBodyParser, (req, res, next) => {
        const knexInstance = req.app.get("db");
        const placeId = req.params.pid;

        const { title, description } = req.body;
        const placeToUpdate = { title, description };

        // Validating if all required keys are
        // present in the request body
        const numberOfValues = Object.values(placeToUpdate).filter(Boolean)
            .length;
        if (numberOfValues === 0) {
            return res.status(400).json({
                error: {
                    message: `Request body must contain either 'title' or 'description'`
                }
            });
        }

        // Execute update of place
        PlacesService.updatePlace(knexInstance, placeId, placeToUpdate)
            .then((updatedPlace) => {
                res.status(200).json({ place: updatedPlace });
            })
            .catch(next);
    })
    // deletePlace /:pid DONE
    .delete((req, res, next) => {
        const knexInstance = req.app.get("db");
        const placeId = req.params.pid;

        PlacesService.deletePlace(knexInstance, placeId)
            .then(() => {
                res.status(200).json({
                    message: "That place has been deleted."
                });
            })
            .catch(next);
    });

module.exports = placesRouter;
