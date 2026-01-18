const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const toursRoutes = require("./routes/tours.routes");
const ordersRoutes = require("./routes/orders.routes");
const tripsRoutes = require("./routes/trips.routes");


const app = express();

// Essential middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/tours", toursRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/trips", tripsRoutes);


// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

module.exports = app;
