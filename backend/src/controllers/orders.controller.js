const { db } = require("../config/firebaseAdmin");
const { AppError } = require("../middlewares/errorHandler.middleware");
const { SEATS_MIN, SEATS_MAX } = require("../validators/order.validator");

const ORDERS_COLLECTION = "orders";
const TRIPS_COLLECTION = "trips";

/** Zile minim înainte de plecare pentru a permite anularea (regula 2.1) */
const MIN_DAYS_BEFORE_DEPARTURE_TO_CANCEL = 2;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDeparture(trip) {
  const [y, m, d] = trip.startDate.split("-").map(Number);
  const [h, min] = (trip.startTime || "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

function isDepartureInFuture(trip) {
  return parseDeparture(trip) > new Date();
}

function canCancelByDeparture(trip) {
  const departure = parseDeparture(trip);
  const cutoff = new Date(departure.getTime() - MIN_DAYS_BEFORE_DEPARTURE_TO_CANCEL * MS_PER_DAY);
  return new Date() <= cutoff;
}

function toOrderResponse(doc, trip = null) {
  const data = { orderId: doc.id, ...doc.data() };
  if (trip) data.trip = { tripId: trip.id, ...trip.data() };
  return data;
}

exports.createOrder = async (req, res, next) => {
  try {
    const { tripId, seatsCount = 1 } = req.body;
    const userId = req.user.uid;
    const userEmail = req.user.email || null;

    const tripRef = db.collection(TRIPS_COLLECTION).doc(tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      throw new AppError(404, "Călătoria nu a fost găsită");
    }

    const trip = { id: tripSnap.id, ...tripSnap.data() };

    if (!isDepartureInFuture(trip)) {
      throw new AppError(400, "Nu se poate rezerva un bilet pentru o călătorie care a plecat deja");
    }

    const seats = Math.max(SEATS_MIN, Math.min(SEATS_MAX, Number(seatsCount) || 1));
    const available = trip.availableSeats ?? 0;

    if (seats > available) {
      throw new AppError(
        400,
        `Locuri insuficiente. Disponibile: ${available}, solicitate: ${seats}`
      );
    }

    const totalPrice = (trip.price || 0) * seats;
    const order = {
      userId,
      userEmail,
      tripId,
      seatsCount: seats,
      totalPrice,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };

    const batch = db.batch();
    const orderRef = db.collection(ORDERS_COLLECTION).doc();
    batch.set(orderRef, order);
    batch.update(tripRef, {
      availableSeats: available - seats,
    });
    await batch.commit();

    const created = { orderId: orderRef.id, ...order };
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const snapshot = await db
      .collection(ORDERS_COLLECTION)
      .where("userId", "==", userId)
      .get();

    const sorted = [...snapshot.docs].sort((a, b) => {
      const t1 = a.data().createdAt || "";
      const t2 = b.data().createdAt || "";
      return t2.localeCompare(t1);
    });

    const orders = [];
    for (const doc of sorted) {
      const data = doc.data();
      let trip = null;
      if (data.tripId) {
        const tripSnap = await db.collection(TRIPS_COLLECTION).doc(data.tripId).get();
        if (tripSnap.exists) trip = tripSnap;
      }
      orders.push(toOrderResponse(doc, trip));
    }

    res.status(200).json({ success: true, data: orders });
  } catch (err) {
    next(err);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const doc = await db.collection(ORDERS_COLLECTION).doc(id).get();

    if (!doc.exists) {
      throw new AppError(404, "Comanda nu a fost găsită");
    }

    const data = doc.data();
    if (data.userId !== userId) {
      throw new AppError(403, "Nu ai permisiunea de a accesa această comandă");
    }

    let trip = null;
    if (data.tripId) {
      const tripSnap = await db.collection(TRIPS_COLLECTION).doc(data.tripId).get();
      if (tripSnap.exists) trip = tripSnap;
    }

    res.status(200).json({ success: true, data: toOrderResponse(doc, trip) });
  } catch (err) {
    next(err);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const orderRef = db.collection(ORDERS_COLLECTION).doc(id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new AppError(404, "Comanda nu a fost găsită");
    }

    const order = orderSnap.data();
    if (order.userId !== userId) {
      throw new AppError(403, "Doar posesorul rezervării poate anula");
    }

    if (order.status === "cancelled") {
      throw new AppError(400, "Comanda este deja anulată");
    }

    const tripRef = db.collection(TRIPS_COLLECTION).doc(order.tripId);
    const tripSnap = await tripRef.get();

    if (!tripSnap.exists) {
      throw new AppError(404, "Călătoria asociată nu a fost găsită");
    }

    const trip = { id: tripSnap.id, ...tripSnap.data() };

    if (!canCancelByDeparture(trip)) {
      throw new AppError(
        400,
        `Nu poți anula cu mai puțin de ${MIN_DAYS_BEFORE_DEPARTURE_TO_CANCEL} zile înainte de plecare`
      );
    }

    const batch = db.batch();
    batch.update(orderRef, { status: "cancelled" });
    batch.update(tripRef, {
      availableSeats: (trip.availableSeats ?? 0) + order.seatsCount,
    });
    await batch.commit();

    res.status(200).json({
      success: true,
      message: "Rezervarea a fost anulată",
      data: { orderId: id, status: "cancelled" },
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.uid;

    const orderRef = db.collection(ORDERS_COLLECTION).doc(id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new AppError(404, "Comanda nu a fost găsită");
    }

    const order = orderSnap.data();
    if (order.userId !== userId) {
      throw new AppError(403, "Doar posesorul rezervării poate șterge");
    }

    if (order.status !== "cancelled") {
      throw new AppError(400, "Doar comenzile anulate pot fi șterse");
    }

    await orderRef.delete();

    res.status(200).json({
      success: true,
      message: "Rezervarea anulată a fost ștearsă",
      data: { orderId: id },
    });
  } catch (err) {
    next(err);
  }
};
