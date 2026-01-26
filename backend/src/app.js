const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const ordersRoutes = require("./routes/orders.routes");
const tripsRoutes = require("./routes/trips.routes");
const stripeRoutes = require("./routes/stripe.routes");
const stripeController = require("./controllers/stripe.controller");
const errorHandler = require("./middlewares/errorHandler.middleware");
const { AppError } = require("./middlewares/errorHandler.middleware");

const app = express();

app.use(cors());
app.use(morgan("dev"));

app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeController.handleWebhook
);

app.use(express.json());


app.use("/api/orders", ordersRoutes);
app.use("/api/trips", tripsRoutes);
app.use("/api/stripe", stripeRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK" });
});

app.use((req, res, next) => {
  next(new AppError(404, "Ruta nu a fost găsită"));
});

app.use(errorHandler);

module.exports = app;
