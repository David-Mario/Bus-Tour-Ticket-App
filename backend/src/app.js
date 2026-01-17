const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const app = express();

// Essential middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

module.exports = app;
