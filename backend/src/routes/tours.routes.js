const express = require("express");
const router = express.Router();

// GET /api/tours
router.get("/", (req, res) => {
  res.json({ message: "List of tours" });
});

// GET /api/tours/:id
router.get("/:id", (req, res) => {
  res.json({ message: `Tour details for ${req.params.id}` });
});

module.exports = router;
