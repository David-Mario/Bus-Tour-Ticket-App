const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware, (req, res) => {
  res.status(201).json({
    message: "Order created",
    user: req.user,
  });
});

router.get("/my", authMiddleware, (req, res) => {
  res.json({
    message: "User orders",
    userId: req.user.uid,
  });
});

module.exports = router;

