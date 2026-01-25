<script setup>
import { ref, onMounted, computed } from "vue";
import { auth } from "@/services/firebase";
import { useRoute, useRouter } from "vue-router";
import { useFiltersStore } from "@/stores/filters";
import { useTripsStore } from "@/stores/trips";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const filtersStore = useFiltersStore();
const tripsStore = useTripsStore();
const authStore = useAuthStore();

const loading = ref(false);
const error = ref("");

const trip = computed(() => tripsStore.getTripById(route.params.tripId));

const calculatePrice = () => {
  if (!trip.value) return 0;
  const basePrice = trip.value.price;
  const adultCount = filtersStore.ticketTypes.adult;
  const studentCount = filtersStore.ticketTypes.student;
  const pensionerCount = filtersStore.ticketTypes.pensioner;

  const adultTotal = basePrice * adultCount;
  const studentTotal = basePrice * 0.85 * studentCount;
  const pensionerTotal = basePrice * 0.85 * pensionerCount;

  return Math.round(adultTotal + studentTotal + pensionerTotal);
};

const totalPrice = computed(() => calculatePrice());
const totalTickets = computed(() => filtersStore.totalTickets);

const buyTicket = async () => {
  error.value = "";
  if (!authStore.user) {
    error.value = "Trebuie să fii autentificat.";
    router.push({ path: "/login", query: { redirect: route.fullPath } });
    return;
  }

  if (totalTickets.value === 0) {
    error.value = "Selectează cel puțin un bilet.";
    return;
  }

  if (!trip.value) {
    error.value = "Călătoria nu a fost găsită.";
    return;
  }

  if (trip.value.availableSeats < totalTickets.value) {
    error.value = `Locuri insuficiente. Disponibile: ${trip.value.availableSeats}, solicitate: ${totalTickets.value}`;
    return;
  }

  loading.value = true;
  try {
    const token = await authStore.getIdToken();
    const response = await fetch("http://localhost:5000/api/stripe/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tripId: route.params.tripId,
        seatsCount: totalTickets.value,
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

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
};

onMounted(() => {
  if (!trip.value && tripsStore.trips.length === 0) {
    tripsStore.fetchTrips();
  }
});
</script>

<template>
  <div class="buy-ticket-view">
    <h2>Confirmă rezervarea</h2>

    <div v-if="!trip" class="loading">
      <p>Se încarcă detaliile călătoriei...</p>
    </div>

    <div v-else class="trip-summary">
      <div class="summary-card">
        <h3>Detalii călătorie</h3>
        <div class="route-info">
          <div class="city-block">
            <span class="city-name">{{ trip.startCity }}</span>
            <span class="time">{{ trip.startTime }}</span>
          </div>
          <div class="arrow">→</div>
          <div class="city-block">
            <span class="city-name">{{ trip.endCity }}</span>
            <span class="time">{{ trip.endTime }}</span>
          </div>
        </div>
        <div class="date-info">
          {{ formatDate(trip.startDate) }}
        </div>
        <div class="duration-info">
          Durată: {{ trip.durationHours }}h | Locuri disponibile: {{ trip.availableSeats }}
        </div>
      </div>

      <div class="summary-card">
        <h3>Bilete selectate</h3>
        <div class="tickets-breakdown">
          <div v-if="filtersStore.ticketTypes.adult > 0" class="ticket-row">
            <span>Adult × {{ filtersStore.ticketTypes.adult }}</span>
            <span>{{ (trip.price * filtersStore.ticketTypes.adult).toFixed(0) }} RON</span>
          </div>
          <div v-if="filtersStore.ticketTypes.student > 0" class="ticket-row">
            <span>Student (-15%) × {{ filtersStore.ticketTypes.student }}</span>
            <span>{{ (trip.price * 0.85 * filtersStore.ticketTypes.student).toFixed(0) }} RON</span>
          </div>
          <div v-if="filtersStore.ticketTypes.pensioner > 0" class="ticket-row">
            <span>Pensionar (-15%) × {{ filtersStore.ticketTypes.pensioner }}</span>
            <span>{{ (trip.price * 0.85 * filtersStore.ticketTypes.pensioner).toFixed(0) }} RON</span>
          </div>
          <div class="ticket-row total">
            <span>Total ({{ totalTickets }} {{ totalTickets === 1 ? 'bilet' : 'bilete' }})</span>
            <span class="total-price">{{ totalPrice }} RON</span>
          </div>
        </div>
      </div>

      <p v-if="error" class="error-message">{{ error }}</p>

      <div class="actions">
        <button class="back-btn" @click="router.push('/')">Înapoi</button>
        <button
          class="buy-btn"
          :disabled="loading || totalTickets === 0"
          @click="buyTicket"
        >
          {{ loading ? "Se procesează..." : `Plătește ${totalPrice} RON` }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.buy-ticket-view {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 2rem;
  color: #333;
  font-size: 2rem;
}

.loading {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.trip-summary {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.summary-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.25rem;
}

.route-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.city-block {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.city-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.time {
  font-size: 0.875rem;
  color: #666;
}

.arrow {
  font-size: 1.5rem;
  color: #1976d2;
  font-weight: bold;
}

.date-info {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.duration-info {
  font-size: 0.875rem;
  color: #999;
}

.tickets-breakdown {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.ticket-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.ticket-row:last-child {
  border-bottom: none;
}

.ticket-row.total {
  margin-top: 0.5rem;
  padding-top: 1rem;
  border-top: 2px solid #1976d2;
  font-weight: 600;
  font-size: 1.125rem;
}

.total-price {
  color: #1976d2;
  font-size: 1.25rem;
}

.error-message {
  color: #f44336;
  padding: 1rem;
  background: #ffebee;
  border-radius: 6px;
  margin: 1rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #1976d2;
  border: 1px solid #1976d2;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #f5f5f5;
}

.buy-btn {
  flex: 1;
  padding: 0.75rem 2rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.buy-btn:hover:not(:disabled) {
  background: #1565c0;
}

.buy-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .actions {
    flex-direction: column;
  }

  .buy-btn {
    width: 100%;
  }
}
</style>
