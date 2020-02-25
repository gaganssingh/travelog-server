const axios = require("axios");
const CustomError = require("./custom-error-model");
const config = require("../config");

// Receives address extracted from a request body
// and returns location coordinates using the Google
// Geocode API
async function getCoordinates(address) {
    const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            address
        )}&key=${config.API_KEY}`
    );

    const data = response.data;

    if (!data || data.status === "ZERO_RESULTS") {
        const error = new CustomError(
            "Could not find a location for that address; please verify and try again!",
            422
        );
        throw error;
    }

    const coordinates = data.results[0].geometry.location;

    return coordinates;
}

module.exports = getCoordinates;
