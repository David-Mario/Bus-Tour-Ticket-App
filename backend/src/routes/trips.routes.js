const express = require("express");
const router = express.Router();
const tripsController = require("../controllers/trips.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const { tripCreate, tripUpdate, tripIdParam } = require("../validators/trip.validator");

router.get("/", tripsController.getAllTrips);
router.get("/:id", tripIdParam, validate, tripsController.getTripById);

router.post(
  "/",
  authMiddleware,
  tripCreate,
  validate,
  tripsController.createTrip
);

router.put(
  "/:id",
  authMiddleware,
  tripIdParam,
  tripUpdate,
  validate,
  tripsController.updateTrip
);

router.delete(
  "/:id",
  authMiddleware,
  tripIdParam,
  validate,
  tripsController.deleteTrip
);

module.exports = router;
