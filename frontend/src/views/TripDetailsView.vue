<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTripsStore } from "@/stores/trips";
import { useFiltersStore } from "@/stores/filters";
import { useAuthStore } from "@/stores/auth";

const route = useRoute();
const router = useRouter();
const tripsStore = useTripsStore();
const filtersStore = useFiltersStore();
const authStore = useAuthStore();

const trip = ref(null);
const loading = ref(true);
const error = ref("");

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const calculatePrice = computed(() => {
  if (!trip.value) return 0;
  const basePrice = trip.value.price;
  const adultCount = filtersStore.ticketTypes.adult;
  const studentCount = filtersStore.ticketTypes.student;
  const pensionerCount = filtersStore.ticketTypes.pensioner;

  const adultTotal = basePrice * adultCount;
  const studentTotal = basePrice * 0.85 * studentCount;
  const pensionerTotal = basePrice * 0.85 * pensionerCount;

  return Math.round(adultTotal + studentTotal + pensionerTotal);
});

const buyTicket = () => {
  if (!authStore.user) {
    router.push({
      path: "/login",
      query: { redirect: route.fullPath },
    });
    return;
  }
  router.push(`/buy/${trip.value.tripId}`);
};

const fetchTrip = async () => {
  loading.value = true;
  error.value = "";
  try {
    const tripId = route.params.tripId;
    const tripFromStore = tripsStore.getTripById(tripId);
    
    if (tripFromStore) {
      trip.value = tripFromStore;
      loading.value = false;
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trips/${tripId}`);
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || "Călătoria nu a fost găsită");
    }

    const data = await response.json();
    trip.value = data.data;
    loading.value = false;
  } catch (err) {
    error.value = err.message || "Eroare la încărcarea călătoriei";
    loading.value = false;
  }
};

onMounted(() => {
  fetchTrip();
});
</script>

<template>
  <div class="trip-details-view">
    <button class="back-btn" @click="router.push('/')">← Înapoi la călătorii</button>

    <div v-if="loading" class="loading">
      <p>Se încarcă detaliile călătoriei...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="fetchTrip">Încearcă din nou</button>
    </div>

    <div v-else-if="trip" class="trip-details-card">
      <div class="trip-header">
        <div class="route">
          <div class="city-section">
            <span class="city-name">{{ trip.startCity }}</span>
            <span class="time">{{ trip.startTime }}</span>
            <span class="date">{{ formatDate(trip.startDate) }}</span>
          </div>
          <div class="arrow">→</div>
          <div class="city-section">
            <span class="city-name">{{ trip.endCity }}</span>
            <span class="time">{{ trip.endTime }}</span>
            <span class="date">{{ formatDate(trip.endDate) }}</span>
          </div>
        </div>
      </div>

      <div class="trip-info-grid">
        <div class="info-section">
          <h3>Detalii călătorie</h3>
          <div class="info-item">
            <span class="label">Durată:</span>
            <span class="value">{{ trip.durationHours }} ore</span>
          </div>
          <div class="info-item">
            <span class="label">Locuri disponibile:</span>
            <span class="value" :class="{ low: trip.availableSeats < 10 }">
              {{ trip.availableSeats }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Preț bilet:</span>
            <span class="value price">{{ trip.price }} RON</span>
          </div>
        </div>

        <div v-if="trip.stops && trip.stops.length > 0" class="info-section">
          <h3>Opriri</h3>
          <div class="stops-list">
            <div v-for="(stop, index) in trip.stops" :key="index" class="stop-item">
              <span class="stop-city">{{ stop.city }}</span>
              <span class="stop-duration">{{ stop.stopDurationMinutes }} min</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="trip.description" class="description-section">
        <h3>Despre această călătorie</h3>
        <p class="description-text">{{ trip.description }}</p>
      </div>

      <div v-else class="description-section">
        <h3>Despre această călătorie</h3>
        <p class="description-text placeholder">
          Călătorie confortabilă de la {{ trip.startCity }} la {{ trip.endCity }}.
          Autobuzul este dotat cu toate facilitățile necesare pentru o călătorie plăcută.
        </p>
      </div>

      <div class="trip-footer">
        <div class="price-summary">
          <span class="price-label">Preț total</span>
          <span class="price-value">{{ calculatePrice }} RON</span>
          <span v-if="filtersStore.totalTickets > 1" class="price-note">
            ({{ filtersStore.totalTickets }} bilete)
          </span>
        </div>
        <button
          class="buy-btn"
          @click="buyTicket"
          :disabled="trip.availableSeats === 0"
        >
          {{ trip.availableSeats === 0 ? "Indisponibil" : "Cumpără bilet" }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.trip-details-view {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.back-btn {
  margin-bottom: 1.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: #1976d2;
  border: 1px solid #1976d2;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f5f5f5;
}

.loading,
.error {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error {
  color: #f44336;
}

.error button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.trip-details-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.trip-header {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #eee;
}

.route {
  display: flex;
  align-items: center;
  gap: 2rem;
  justify-content: center;
}

.city-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: center;
}

.city-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

.time {
  font-size: 1.25rem;
  color: #1976d2;
  font-weight: 600;
}

.date {
  font-size: 0.875rem;
  color: #666;
}

.arrow {
  font-size: 2rem;
  color: #1976d2;
  font-weight: bold;
}

.trip-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .trip-info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.info-section {
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.info-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #333;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item .label {
  color: #666;
  font-size: 0.9375rem;
}

.info-item .value {
  font-weight: 600;
  color: #333;
}

.info-item .value.price {
  color: #1976d2;
  font-size: 1.125rem;
}

.info-item .value.low {
  color: #f44336;
}

.stops-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stop-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
}

.stop-city {
  font-weight: 600;
  color: #333;
}

.stop-duration {
  color: #666;
  font-size: 0.875rem;
}

.description-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
}

.description-section h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  color: #333;
}

.description-text {
  line-height: 1.6;
  color: #555;
  margin: 0;
}

.description-text.placeholder {
  color: #999;
  font-style: italic;
}

.trip-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1.5rem;
  border-top: 2px solid #eee;
}

.price-summary {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.price-label {
  font-size: 0.875rem;
  color: #666;
}

.price-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1976d2;
}

.price-note {
  font-size: 0.875rem;
  color: #666;
}

.buy-btn {
  padding: 1rem 2.5rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1.125rem;
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
  .trip-details-card {
    padding: 1.5rem;
  }

  .route {
    flex-direction: column;
    gap: 1rem;
  }

  .arrow {
    transform: rotate(90deg);
  }

  .trip-footer {
    flex-direction: column;
    gap: 1.5rem;
    align-items: stretch;
  }

  .buy-btn {
    width: 100%;
  }
}
</style>
