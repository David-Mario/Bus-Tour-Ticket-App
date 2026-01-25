const { body, param } = require("express-validator");

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

function parseDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null;
  const [y, m, d] = dateStr.split("-").map(Number);
  const [h, min] = timeStr.split(":").map(Number);
  const d2 = new Date(y, m - 1, d, h, min);
  return isNaN(d2.getTime()) ? null : d2;
}

const tripCreate = [
  body("startCity")
    .trim()
    .notEmpty()
    .withMessage("Orașul de plecare este obligatoriu"),
  body("endCity")
    .trim()
    .notEmpty()
    .withMessage("Orașul de sosire este obligatoriu")
    .custom((val, { req }) => val !== req.body?.startCity?.trim())
    .withMessage("Orașul de sosire trebuie să fie diferit de cel de plecare"),
  body("startDate")
    .trim()
    .matches(DATE_REGEX)
    .withMessage("Data plecării trebuie să fie YYYY-MM-DD"),
  body("startTime")
    .trim()
    .matches(TIME_REGEX)
    .withMessage("Ora plecării trebuie să fie HH:MM"),
  body("endDate")
    .trim()
    .matches(DATE_REGEX)
    .withMessage("Data sosirii trebuie să fie YYYY-MM-DD"),
  body("endTime")
    .trim()
    .matches(TIME_REGEX)
    .withMessage("Ora sosirii trebuie să fie HH:MM")
    .custom((val, { req }) => {
      const start = parseDateTime(req.body?.startDate, req.body?.startTime);
      const end = parseDateTime(req.body?.endDate, val);
      if (!start || !end) return true;
      return end > start;
    })
    .withMessage("Data și ora sosirii trebuie să fie după plecare"),
  body("durationHours")
    .isInt({ min: 1, max: 72 })
    .withMessage("Durata trebuie să fie între 1 și 72 ore")
    .toInt(),
  body("price")
    .isInt({ min: 1 })
    .withMessage("Prețul trebuie să fie un număr pozitiv")
    .toInt(),
  body("availableSeats")
    .isInt({ min: 0 })
    .withMessage("Numărul de locuri disponibile trebuie să fie >= 0")
    .toInt(),
  body("stops")
    .isArray()
    .withMessage("Opririle trebuie să fie un array")
    .custom((stops) => {
      if (!Array.isArray(stops)) return true;
      return stops.every(
        (s) =>
          s &&
          typeof s.city === "string" &&
          s.city.trim().length > 0 &&
          typeof s.stopDurationMinutes === "number" &&
          s.stopDurationMinutes >= 0
      );
    })
    .withMessage("Fiecare oprire trebuie să aibă city (string) și stopDurationMinutes (număr >= 0)"),
  body("description")
    .optional()
    .trim()
    .isString()
    .withMessage("Descrierea trebuie să fie un string"),
];

const tripUpdate = [
  body("startCity").optional().trim().notEmpty().withMessage("Orașul de plecare nu poate fi gol"),
  body("endCity").optional().trim().notEmpty().withMessage("Orașul de sosire nu poate fi gol"),
  body("startDate").optional().trim().matches(DATE_REGEX).withMessage("Data plecării trebuie YYYY-MM-DD"),
  body("startTime").optional().trim().matches(TIME_REGEX).withMessage("Ora plecării trebuie HH:MM"),
  body("endDate").optional().trim().matches(DATE_REGEX).withMessage("Data sosirii trebuie YYYY-MM-DD"),
  body("endTime").optional().trim().matches(TIME_REGEX).withMessage("Ora sosirii trebuie HH:MM"),
  body("durationHours").optional().isInt({ min: 1, max: 72 }).withMessage("Durata 1–72 ore").toInt(),
  body("price").optional().isInt({ min: 1 }).withMessage("Preț > 0").toInt(),
  body("availableSeats")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Locuri disponibile >= 0")
    .toInt(),
  body("stops")
    .optional()
    .isArray()
    .custom((stops) => {
      if (!Array.isArray(stops)) return true;
      return stops.every(
        (s) =>
          s &&
          typeof s.city === "string" &&
          s.city.trim().length > 0 &&
          typeof s.stopDurationMinutes === "number" &&
          s.stopDurationMinutes >= 0
      );
    })
    .withMessage("Fiecare oprire: city (string), stopDurationMinutes (>= 0)"),
  body("description")
    .optional()
    .trim()
    .isString()
    .withMessage("Descrierea trebuie să fie un string"),
];

const tripIdParam = [
  param("id").trim().notEmpty().withMessage("ID-ul călătoriei este obligatoriu"),
];

module.exports = {
  tripCreate,
  tripUpdate,
  tripIdParam,
};
