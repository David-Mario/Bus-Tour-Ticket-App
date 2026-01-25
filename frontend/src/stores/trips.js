import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useTripsStore = defineStore("trips", () => {
  const trips = ref([]);
  const loading = ref(false);
  const error = ref("");

  const fetchTrips = async () => {
    loading.value = true;
    error.value = "";
    try {
      const response = await fetch("http://localhost:5000/api/trips");
      const json = await response.json();
      if (json.success && json.data) {
        trips.value = json.data;
      } else {
        error.value = json.message || "Eroare la încărcarea călătoriilor";
      }
    } catch (e) {
      console.error("Eroare la încărcarea călătoriilor:", e);
      error.value = "Eroare la încărcarea călătoriilor";
      trips.value = [];
    } finally {
      loading.value = false;
    }
  };

  const getTripById = (tripId) => {
    return trips.value.find((t) => t.tripId === tripId);
  };

  return {
    trips,
    loading,
    error,
    fetchTrips,
    getTripById,
  };
});
