<script setup>
import { ref, onMounted } from "vue";
import { auth } from "@/services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "vue-router";

const router = useRouter();
const trips = ref([]);
const user = ref(null);

const fetchTrips = async () => {
  try {
    const response = await fetch("http://localhost:5000/api/trips");
    const json = await response.json();
    trips.value = json.data ?? [];
    if (!response.ok) {
      console.error("Eroare API:", json.message ?? response.statusText);
    }
  } catch (e) {
    console.error("Eroare la încărcarea călătoriilor:", e);
    trips.value = [];
  }
};


const logout = async () => {
  await signOut(auth);
};

const buyTicket = (tripId) => {
  router.push(`/buy/${tripId}`);
};

onMounted(() => {
   onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      console.log("FIREBASE TOKEN:", token);
    }
  });
  fetchTrips();
  onAuthStateChanged(auth, (u) => {
    user.value = u;
  });
});
</script>
<template>
  <div>
    <h1>Bus Trips</h1>

    <!-- Auth status -->
    <div v-if="user">
      <p>Logged in as {{ user.email }}</p>
      <button @click="logout">Logout</button>
    </div>

    <div v-else>
      <p>Not logged in</p>
    </div>

    <hr />

    <!-- Trips list -->
    <div v-if="!trips.length">
  <p>No trips available</p>
</div>

    <div v-for="trip in trips" :key="trip.tripId" style="margin-bottom: 20px">
      <p>
        <strong>{{ trip.startCity }}</strong> →
        <strong>{{ trip.endCity }}</strong>
      </p>

      <p>Price: {{ trip.price }} RON</p>

      <button @click="buyTicket(trip.tripId)">
        Buy ticket
      </button>
    </div>
  </div>
</template>
