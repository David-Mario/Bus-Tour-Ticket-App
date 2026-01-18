const db = require("../config/firebase");

exports.getAllTrips = async (req, res) => {
  try {
    const snapshot = await db.collection("trips").get();
    const trips = snapshot.docs.map(doc => doc.data());
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch trips" });
  }
};
