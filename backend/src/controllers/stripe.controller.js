const stripe = require("../config/stripe");
const { db } = require("../config/firebaseAdmin");
const { AppError } = require("../middlewares/errorHandler.middleware");
const { SEATS_MIN, SEATS_MAX } = require("../validators/order.validator");

const ORDERS_COLLECTION = "orders";
const TRIPS_COLLECTION = "trips";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

function parseDeparture(trip) {
  const [y, m, d] = trip.startDate.split("-").map(Number);
  const [h, min] = (trip.startTime || "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, h, min);
}

function isDepartureInFuture(trip) {
  return parseDeparture(trip) > new Date();
}

async function createOrderInFirestore(userId, userEmail, tripId, seatsCount, stripeSessionId) {
  const tripRef = db.collection(TRIPS_COLLECTION).doc(tripId);
  const tripSnap = await tripRef.get();

  if (!tripSnap.exists) {
    throw new AppError(404, "Călătoria nu a fost găsită");
  }

  const trip = { id: tripSnap.id, ...tripSnap.data() };
  const available = trip.availableSeats ?? 0;

  if (seatsCount > available) {
    throw new AppError(400, `Locuri insuficiente. Disponibile: ${available}`);
  }

  const totalPrice = (trip.price || 0) * seatsCount;
  const order = {
    userId,
    userEmail,
    tripId,
    seatsCount,
    totalPrice,
    status: "confirmed",
    stripeSessionId,
    createdAt: new Date().toISOString(),
  };

  const batch = db.batch();
  const orderRef = db.collection(ORDERS_COLLECTION).doc();
  batch.set(orderRef, order);
  batch.update(tripRef, {
    availableSeats: available - seatsCount,
  });
  await batch.commit();

  return { orderId: orderRef.id, ...order };
}

exports.createCheckoutSession = async (req, res, next) => {
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

    const totalPrice = trip.price * seats;
    const amountInCents = Math.round(totalPrice * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "ron",
            product_data: {
              name: `Bilet ${trip.startCity} → ${trip.endCity}`,
              description: `Plecare: ${trip.startDate} ${trip.startTime} | Sosire: ${trip.endDate} ${trip.endTime}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${FRONTEND_URL}/my-tickets?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/buy/${tripId}`,
      metadata: {
        userId,
        userEmail: userEmail || "",
        tripId,
        seatsCount: seats.toString(),
      },
      customer_email: userEmail || undefined,
    });

    res.status(200).json({ success: true, data: { url: session.url } });
  } catch (err) {
    next(err);
  }
};

exports.handleWebhook = async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET nu este setat");
    return res.status(500).json({ success: false, message: "Webhook secret lipsă" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    if (session.payment_status === "paid") {
      const { userId, userEmail, tripId, seatsCount } = session.metadata;

      if (!userId || !tripId) {
        console.error("Metadata lipsă în webhook:", session.metadata);
        return res.status(400).json({ success: false, message: "Metadata incompletă" });
      }

      const seats = parseInt(seatsCount || "1", 10);

      try {
        const existingOrder = await db
          .collection(ORDERS_COLLECTION)
          .where("stripeSessionId", "==", session.id)
          .limit(1)
          .get();

        if (!existingOrder.empty) {
          console.log(`Comanda pentru sesiunea ${session.id} există deja`);
          return res.status(200).json({ success: true, message: "Comanda există deja" });
        }

        await createOrderInFirestore(userId, userEmail || null, tripId, seats, session.id);
        console.log(`Comandă creată pentru sesiunea Stripe: ${session.id}`);
      } catch (err) {
        console.error("Eroare la crearea comenzii din webhook:", err);
        return res.status(500).json({ success: false, message: err.message });
      }
    }
  }

  res.status(200).json({ success: true, received: true });
};

exports.verifySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.uid;
    const userEmail = req.user.email || null;

    if (!sessionId) {
      throw new AppError(400, "Session ID lipsă");
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Check if session belongs to this user
    if (session.metadata?.userId !== userId) {
      throw new AppError(403, "Nu ai permisiunea de a accesa această sesiune");
    }

    // Check if payment was successful
    if (session.payment_status !== "paid") {
      return res.status(200).json({
        success: false,
        message: "Plata nu a fost finalizată",
        data: { paymentStatus: session.payment_status },
      });
    }

    // Check if order already exists
    const existingOrder = await db
      .collection(ORDERS_COLLECTION)
      .where("stripeSessionId", "==", sessionId)
      .limit(1)
      .get();

    if (!existingOrder.empty) {
      // Order already exists, return it
      const orderDoc = existingOrder.docs[0];
      const orderData = orderDoc.data();
      
      // Get trip data
      let trip = null;
      if (orderData.tripId) {
        const tripSnap = await db.collection(TRIPS_COLLECTION).doc(orderData.tripId).get();
        if (tripSnap.exists) trip = tripSnap;
      }

      return res.status(200).json({
        success: true,
        message: "Comanda există deja",
        data: { orderId: orderDoc.id, ...orderData, trip: trip ? { tripId: trip.id, ...trip.data() } : null },
      });
    }

    // Create order if payment is successful but order doesn't exist
    const { tripId, seatsCount } = session.metadata;
    if (!tripId) {
      throw new AppError(400, "Metadata incompletă în sesiunea Stripe");
    }

    const seats = parseInt(seatsCount || "1", 10);
    const order = await createOrderInFirestore(userId, userEmail, tripId, seats, sessionId);

    // Get trip data for response
    const tripSnap = await db.collection(TRIPS_COLLECTION).doc(tripId).get();
    const tripData = tripSnap.exists ? { tripId: tripSnap.id, ...tripSnap.data() } : null;

    res.status(200).json({
      success: true,
      message: "Comandă creată cu succes",
      data: { ...order, trip: tripData },
    });
  } catch (err) {
    next(err);
  }
};
