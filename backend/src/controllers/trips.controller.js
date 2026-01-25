const { db } = require("../config/firebaseAdmin");
const { AppError } = require("../middlewares/errorHandler.middleware");

const COLLECTION = "trips";

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function generateTripId(startCity, endCity, startDate) {
  const prefix = `${startCity.slice(0, 3).toUpperCase()}-${endCity.slice(0, 3).toUpperCase()}-${startDate.replace(/-/g, "")}`;
  const suffix = Date.now().toString(36);
  return `${prefix}-${suffix}`;
}

function toTripResponse(doc) {
  return { tripId: doc.id, ...doc.data() };
}

exports.getAllTrips = async (req, res, next) => {
  try {
    const snapshot = await db.collection(COLLECTION).get();
    const trips = snapshot.docs.map((doc) => toTripResponse(doc));
    res.status(200).json({ success: true, data: trips });
  } catch (err) {
    next(err);
  }
};

exports.getTripById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await db.collection(COLLECTION).doc(id).get();

    if (!doc.exists) {
      throw new AppError(404, "Călătoria nu a fost găsită");
    }

    res.status(200).json({ success: true, data: toTripResponse(doc) });
  } catch (err) {
    next(err);
  }
};

exports.createTrip = async (req, res, next) => {
  try {
    const {
      startCity,
      endCity,
      startDate,
      startTime,
      endDate,
      endTime,
      durationHours,
      price,
      availableSeats,
      stops,
    } = req.body;

    const tripId = generateTripId(startCity.trim(), endCity.trim(), startDate);
    const createdAt = formatDate(new Date());

    const trip = {
      tripId,
      startCity: startCity.trim(),
      endCity: endCity.trim(),
      startDate,
      startTime,
      endDate,
      endTime,
      durationHours,
      price,
      availableSeats,
      stops: stops || [],
      createdAt,
    };

    const ref = db.collection(COLLECTION).doc(tripId);
    await ref.set(trip);

    res.status(201).json({ success: true, data: trip });
  } catch (err) {
    next(err);
  }
};

exports.updateTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(404, "Călătoria nu a fost găsită");
    }

    const ALLOWED = [
      "startCity", "endCity", "startDate", "startTime",
      "endDate", "endTime", "durationHours", "price",
      "availableSeats", "stops",
    ];
    const updates = {};
    for (const k of ALLOWED) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    if (Object.keys(updates).length === 0) {
      const current = toTripResponse(doc);
      return res.status(200).json({ success: true, data: current });
    }

    await docRef.update(updates);
    const updated = await docRef.get();

    res.status(200).json({ success: true, data: toTripResponse(updated) });
  } catch (err) {
    next(err);
  }
};

exports.deleteTrip = async (req, res, next) => {
  try {
    const { id } = req.params;
    const docRef = db.collection(COLLECTION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new AppError(404, "Călătoria nu a fost găsită");
    }

    const confirmedOrders = await db
      .collection("orders")
      .where("tripId", "==", id)
      .where("status", "==", "confirmed")
      .limit(1)
      .get();

    if (!confirmedOrders.empty) {
      throw new AppError(
        409,
        "Nu se poate șterge călătoria: există rezervări active. Anulează mai întâi rezervările."
      );
    }

    await docRef.delete();
    res.status(200).json({ success: true, message: "Călătoria a fost ștearsă" });
  } catch (err) {
    next(err);
  }
};
