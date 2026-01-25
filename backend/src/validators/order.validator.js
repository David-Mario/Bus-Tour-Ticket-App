const { body, param } = require("express-validator");

const SEATS_MIN = 1;
const SEATS_MAX = 10;

const orderCreate = [
  body("tripId").trim().notEmpty().withMessage("ID-ul călătoriei este obligatoriu"),
  body("seatsCount")
    .optional()
    .isInt({ min: SEATS_MIN, max: SEATS_MAX })
    .withMessage(`Numărul de locuri trebuie să fie între ${SEATS_MIN} și ${SEATS_MAX}`)
    .toInt(),
];

const orderCancel = [
  body("status")
    .equals("cancelled")
    .withMessage('Pentru anulare, trimite { "status": "cancelled" }'),
];

const orderIdParam = [
  param("id").trim().notEmpty().withMessage("ID-ul comenzii este obligatoriu"),
];

module.exports = {
  orderCreate,
  orderCancel,
  orderIdParam,
  SEATS_MIN,
  SEATS_MAX,
};
