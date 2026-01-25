const { validationResult } = require("express-validator");

/**
 * Middleware care verifică rezultatul express-validator.
 * Dacă există erori, răspunde cu 400 și { success, message, errors }.
 */
function validate(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  return res.status(400).json({
    success: false,
    message: "Date invalide",
    errors,
  });
}

module.exports = validate;
