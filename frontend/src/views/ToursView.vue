<script setup>
import { computed, onMounted, onActivated } from "vue";
import { useRouter } from "vue-router";
import { useTripsStore } from "@/stores/trips";
import { useFiltersStore } from "@/stores/filters";
import TripCard from "@/components/TripCard.vue";

const router = useRouter();
const tripsStore = useTripsStore();
const filtersStore = useFiltersStore();

const filteredTrips = computed(() => {
  let result = [...tripsStore.trips];

  if (filtersStore.appliedStartCity) {
    result = result.filter((t) =>
      t.startCity.toLowerCase().includes(filtersStore.appliedStartCity.toLowerCase())
    );
  }

  if (filtersStore.appliedEndCity) {
    result = result.filter((t) =>
      t.endCity.toLowerCase().includes(filtersStore.appliedEndCity.toLowerCase())
    );
  }

  if (filtersStore.appliedDepartureDate) {
    result = result.filter((t) => t.startDate === filtersStore.appliedDepartureDate);
  }

  result = result.filter((t) => t.availableSeats >= filtersStore.appliedTotalTickets);

  if (filtersStore.sortBy) {
    result.sort((a, b) => {
      let aVal, bVal;
      
      if (filtersStore.sortBy === "price") {
        aVal = a.price || 0;
        bVal = b.price || 0;
      } else if (filtersStore.sortBy === "departureDate") {
        aVal = new Date(a.startDate + " " + (a.startTime || "00:00"));
        bVal = new Date(b.startDate + " " + (b.startTime || "00:00"));
      } else if (filtersStore.sortBy === "duration") {
        aVal = a.durationHours || 0;
        bVal = b.durationHours || 0;
      } else {
        return 0;
      }

      if (filtersStore.sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  }

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

onActivated(() => {
  tripsStore.fetchTrips();
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
  max-width: 100%;
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
  width: 100%;
  max-width: 100%;
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
