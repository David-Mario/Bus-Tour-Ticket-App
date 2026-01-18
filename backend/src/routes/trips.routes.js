const express = require("express");
const router = express.Router();
const tripsController = require("../controllers/trips.controller");

router.get("/", tripsController.getAllTrips);

module.exports = router;
