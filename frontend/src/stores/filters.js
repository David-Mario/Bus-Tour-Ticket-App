import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useFiltersStore = defineStore("filters", () => {
  // Input fields (not applied until search button is clicked)
  const startCity = ref("");
  const endCity = ref("");
  const departureDate = ref("");
  const ticketCount = ref(1);
  const ticketTypes = ref({
    adult: 1,
    student: 0,
    pensioner: 0,
  });

  // Applied filters (used for actual filtering)
  const appliedStartCity = ref("");
  const appliedEndCity = ref("");
  const appliedDepartureDate = ref("");
  const appliedTotalTickets = ref(1);

  // Sort options
  const sortBy = ref(""); // "price", "departureDate", "duration"
  const sortOrder = ref("asc"); // "asc" or "desc"

  const totalTickets = computed(() => {
    return ticketTypes.value.adult + ticketTypes.value.student + ticketTypes.value.pensioner;
  });

  const applyFilters = () => {
    appliedStartCity.value = startCity.value;
    appliedEndCity.value = endCity.value;
    appliedDepartureDate.value = departureDate.value;
    appliedTotalTickets.value = totalTickets.value;
  };

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
    appliedStartCity.value = "";
    appliedEndCity.value = "";
    appliedDepartureDate.value = "";
    appliedTotalTickets.value = 1;
    sortBy.value = "";
    sortOrder.value = "asc";
  };

  const updateTicketCount = () => {
    const total = totalTickets.value;
    if (total === 0) {
      ticketTypes.value.adult = 1;
    }
    ticketCount.value = total;
  };

  const setSort = (field, order) => {
    sortBy.value = field;
    sortOrder.value = order;
  };

  return {
    startCity,
    endCity,
    departureDate,
    ticketCount,
    ticketTypes,
    totalTickets,
    appliedStartCity,
    appliedEndCity,
    appliedDepartureDate,
    appliedTotalTickets,
    sortBy,
    sortOrder,
    resetFilters,
    updateTicketCount,
    applyFilters,
    setSort,
  };
});
