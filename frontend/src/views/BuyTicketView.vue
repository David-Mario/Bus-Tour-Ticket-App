<script setup>
import { ref, onMounted } from "vue";
import { auth } from "@/services/firebase";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const loading = ref(false);
const error = ref("");
const trip = ref(null);

const fetchTrip = async () => {
  try {
    const response = await fetch(`http://localhost:5000/api/trips/${route.params.tripId}`);
    const json = await response.json();
    if (json.success && json.data) {
      trip.value = json.data;
    }
  } catch (e) {
    console.error("Eroare la încărcarea călătoriei:", e);
  }
};

const buyTicket = async () => {
  error.value = "";
  const user = auth.currentUser;
  if (!user) {
    error.value = "Trebuie să fii autentificat.";
    router.push({ path: "/login", query: { redirect: route.fullPath } });
    return;
  }

  loading.value = true;
  try {
    const token = await user.getIdToken();
    const response = await fetch("http://localhost:5000/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tripId: route.params.tripId,
        seatsCount: 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const msg = data.message ?? "Eroare la inițierea plății";
      const details = data.errors?.length ? data.errors.map((e) => e.message).join(", ") : "";
      error.value = details ? `${msg}: ${details}` : msg;
      return;
    }

    if (data.success && data.data?.url) {
      window.location.href = data.data.url;
    } else {
      error.value = "Eroare: URL-ul de plată nu a fost primit";
    }
  } catch (e) {
    console.error(e);
    error.value = "Eroare la inițierea plății. Verifică conexiunea și încearcă din nou.";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchTrip();
});
</script>

<template>
  <div>
    <h2>Cumpără bilet</h2>

    <div v-if="trip">
      <p>
        <strong>{{ trip.startCity }}</strong> →
        <strong>{{ trip.endCity }}</strong>
      </p>
      <p>Plecare: {{ trip.startDate }} {{ trip.startTime }}</p>
      <p>Sosire: {{ trip.endDate }} {{ trip.endTime }}</p>
      <p>Preț: {{ trip.price }} RON</p>
    </div>

    <p v-if="error" style="color: red;">{{ error }}</p>

    <button :disabled="loading || !trip" @click="buyTicket">
      {{ loading ? "Se procesează..." : "Confirmă și plătește" }}
    </button>
  </div>
</template>
