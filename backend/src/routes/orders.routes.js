const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");
const ordersController = require("../controllers/orders.controller");
const { orderCreate, orderCancel, orderIdParam } = require("../validators/order.validator");

router.post(
  "/",
  authMiddleware,
  orderCreate,
  validate,
  ordersController.createOrder
);

router.get("/my", authMiddleware, ordersController.getMyOrders);

router.get(
  "/:id",
  authMiddleware,
  orderIdParam,
  validate,
  ordersController.getOrderById
);

router.patch(
  "/:id/cancel",
  authMiddleware,
  orderIdParam,
  orderCancel,
  validate,
  ordersController.cancelOrder
);

router.delete(
  "/:id",
  authMiddleware,
  orderIdParam,
  validate,
  ordersController.deleteOrder
);

module.exports = router;
