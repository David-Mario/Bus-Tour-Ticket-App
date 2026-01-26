const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const stripeController = require("../controllers/stripe.controller");
const { orderCreate } = require("../validators/order.validator");
const validate = require("../middlewares/validate.middleware");

router.post(
  "/create-checkout-session",
  authMiddleware,
  orderCreate,
  validate,
  stripeController.createCheckoutSession
);

router.get(
  "/verify-session/:sessionId",
  authMiddleware,
  stripeController.verifySession
);

module.exports = router;
