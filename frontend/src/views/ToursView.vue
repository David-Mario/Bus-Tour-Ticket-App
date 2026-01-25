<script setup>
import { computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useTripsStore } from "@/stores/trips";
import { useFiltersStore } from "@/stores/filters";
import TripCard from "@/components/TripCard.vue";

const router = useRouter();
const tripsStore = useTripsStore();
const filtersStore = useFiltersStore();

const filteredTrips = computed(() => {
  let result = [...tripsStore.trips];

  if (filtersStore.startCity) {
    result = result.filter((t) =>
      t.startCity.toLowerCase().includes(filtersStore.startCity.toLowerCase())
    );
  }

  if (filtersStore.endCity) {
    result = result.filter((t) =>
      t.endCity.toLowerCase().includes(filtersStore.endCity.toLowerCase())
    );
  }

  if (filtersStore.departureDate) {
    result = result.filter((t) => t.startDate === filtersStore.departureDate);
  }

  result = result.filter((t) => t.availableSeats >= filtersStore.totalTickets);

  return result;
});

const buyTicket = (tripId) => {
  router.push(`/buy/${tripId}`);
};

onMounted(() => {
  if (tripsStore.trips.length === 0) {
    tripsStore.fetchTrips();
  }
});
</script>

<template>
  <div class="tours-view">
    <div v-if="tripsStore.loading" class="loading">
      <p>Se încarcă călătoriile...</p>
    </div>

    <div v-else-if="tripsStore.error" class="error">
      <p>{{ tripsStore.error }}</p>
    </div>

    <div v-else-if="filteredTrips.length === 0" class="empty">
      <p>Nu s-au găsit călătorii care să corespundă criteriilor tale.</p>
      <button @click="filtersStore.resetFilters()">Resetează filtrele</button>
    </div>

    <div v-else class="trips-grid">
      <TripCard
        v-for="trip in filteredTrips"
        :key="trip.tripId"
        :trip="trip"
      />
    </div>
  </div>
</template>

<style scoped>
.tours-view {
  width: 100%;
  min-height: 60vh;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.error {
  color: #f44336;
}

.empty button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.trips-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  min-height: 400px;
}

@media (min-width: 768px) {
  .trips-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1200px) {
  .trips-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
