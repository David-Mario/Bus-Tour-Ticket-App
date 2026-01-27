class AppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function errorHandler(err, req, res, next) {
  console.error("[Error]", err);

  const status = err.statusCode || 500;
  const message =
    status === 500 && process.env.NODE_ENV === "production"
      ? "Eroare internă a serverului"
      : err.message || "Eroare internă a serverului";

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production" && err.stack && { stack: err.stack }),
  });
}

module.exports = errorHandler;
module.exports.AppError = AppError;
