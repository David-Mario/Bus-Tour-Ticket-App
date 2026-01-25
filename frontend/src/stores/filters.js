import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useFiltersStore = defineStore("filters", () => {
  const startCity = ref("");
  const endCity = ref("");
  const departureDate = ref("");
  const ticketCount = ref(1);
  const ticketTypes = ref({
    adult: 1,
    student: 0,
    pensioner: 0,
  });

  const totalTickets = computed(() => {
    return ticketTypes.value.adult + ticketTypes.value.student + ticketTypes.value.pensioner;
  });

  const resetFilters = () => {
    startCity.value = "";
    endCity.value = "";
    departureDate.value = "";
    ticketCount.value = 1;
    ticketTypes.value = {
      adult: 1,
      student: 0,
      pensioner: 0,
    };
  };

  const updateTicketCount = () => {
    const total = totalTickets.value;
    if (total === 0) {
      ticketTypes.value.adult = 1;
    }
    ticketCount.value = total;
  };

  return {
    startCity,
    endCity,
    departureDate,
    ticketCount,
    ticketTypes,
    totalTickets,
    resetFilters,
    updateTicketCount,
  };
});
