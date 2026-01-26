<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { useFiltersStore } from "@/stores/filters";
import { useTripsStore } from "@/stores/trips";

const router = useRouter();
const filtersStore = useFiltersStore();
const tripsStore = useTripsStore();

const cities = ref([]);
const showTicketTypes = ref(false);
const ticketDropdownRef = ref(null);
const showFiltersModal = ref(false);

const startCitySuggestions = ref([]);
const endCitySuggestions = ref([]);
const showStartSuggestions = ref(false);
const showEndSuggestions = ref(false);

const ticketTypeLabels = {
  adult: "Adult",
  student: "Student (-15%)",
  pensioner: "Pensionar (-15%)",
};

const extractCities = () => {
  const citySet = new Set();
  tripsStore.trips.forEach((trip) => {
    citySet.add(trip.startCity);
    citySet.add(trip.endCity);
  });
  cities.value = Array.from(citySet).sort();
};

watch(
  () => tripsStore.trips,
  () => {
    extractCities();
  },
  { immediate: true }
);

const filterStartCities = (query) => {
  if (!query) {
    startCitySuggestions.value = [];
    showStartSuggestions.value = false;
    return;
  }
  const lowerQuery = query.toLowerCase();
  startCitySuggestions.value = cities.value.filter((city) =>
    city.toLowerCase().includes(lowerQuery)
  );
  showStartSuggestions.value = startCitySuggestions.value.length > 0;
};

const filterEndCities = (query) => {
  if (!query) {
    endCitySuggestions.value = [];
    showEndSuggestions.value = false;
    return;
  }
  const lowerQuery = query.toLowerCase();
  endCitySuggestions.value = cities.value.filter((city) =>
    city.toLowerCase().includes(lowerQuery)
  );
  showEndSuggestions.value = endCitySuggestions.value.length > 0;
};

const selectStartCity = (city) => {
  filtersStore.startCity = city;
  showStartSuggestions.value = false;
};

const selectEndCity = (city) => {
  filtersStore.endCity = city;
  showEndSuggestions.value = false;
};

const searchTrips = () => {
  filtersStore.applyFilters();
  tripsStore.fetchTrips();
  showTicketTypes.value = false;
  showFiltersModal.value = false;
};

const applySort = (field, order) => {
  filtersStore.setSort(field, order);
  showFiltersModal.value = false;
};

const clearSort = () => {
  filtersStore.setSort("", "asc");
};

const goToMyTickets = () => {
  router.push("/my-tickets");
};

const incrementTicket = (type) => {
  filtersStore.ticketTypes[type]++;
  filtersStore.updateTicketCount();
};

const decrementTicket = (type) => {
  if (filtersStore.ticketTypes[type] > 0) {
    filtersStore.ticketTypes[type]--;
    filtersStore.updateTicketCount();
  }
};

const startCityRef = ref(null);
const endCityRef = ref(null);

const handleClickOutside = (event) => {
  if (ticketDropdownRef.value && !ticketDropdownRef.value.contains(event.target)) {
    showTicketTypes.value = false;
  }
  if (startCityRef.value && !startCityRef.value.contains(event.target)) {
    showStartSuggestions.value = false;
  }
  if (endCityRef.value && !endCityRef.value.contains(event.target)) {
    showEndSuggestions.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<template>
  <div class="search-bar">
    <div class="search-container">
      <div class="search-field" ref="startCityRef">
        <label>De la</label>
        <input
          type="text"
          v-model="filtersStore.startCity"
          placeholder="ex: Bucharest"
          @input="filterStartCities(filtersStore.startCity)"
          @focus="filterStartCities(filtersStore.startCity)"
          @click.stop
        />
        <div v-if="showStartSuggestions" class="suggestions-dropdown" @click.stop>
          <div
            v-for="city in startCitySuggestions"
            :key="city"
            class="suggestion-item"
            @click="selectStartCity(city)"
          >
            {{ city }}
          </div>
        </div>
      </div>

      <div class="search-field" ref="endCityRef">
        <label>La</label>
        <input
          type="text"
          v-model="filtersStore.endCity"
          placeholder="ex: Vienna"
          @input="filterEndCities(filtersStore.endCity)"
          @focus="filterEndCities(filtersStore.endCity)"
          @click.stop
        />
        <div v-if="showEndSuggestions" class="suggestions-dropdown" @click.stop>
          <div
            v-for="city in endCitySuggestions"
            :key="city"
            class="suggestion-item"
            @click="selectEndCity(city)"
          >
            {{ city }}
          </div>
        </div>
      </div>

      <div class="search-field">
        <label>Data plecării</label>
        <input
          type="date"
          v-model="filtersStore.departureDate"
          :min="new Date().toISOString().split('T')[0]"
        />
      </div>

      <div class="search-field" ref="ticketDropdownRef">
        <label>Bilete</label>
        <button
          type="button"
          class="ticket-selector"
          @click.stop="showTicketTypes = !showTicketTypes"
        >
          {{ filtersStore.totalTickets }}
          {{ filtersStore.totalTickets === 1 ? "bilet" : "bilete" }}
        </button>
        <div v-if="showTicketTypes" class="ticket-types-dropdown" @click.stop>
          <div
            v-for="(count, type) in filtersStore.ticketTypes"
            :key="type"
            class="ticket-type-row"
          >
            <span>{{ ticketTypeLabels[type] }}</span>
            <div class="ticket-counter">
              <button
                type="button"
                @click="decrementTicket(type)"
                :disabled="count === 0"
              >
                −
              </button>
              <span>{{ count }}</span>
              <button type="button" @click="incrementTicket(type)">+</button>
            </div>
          </div>
        </div>
      </div>

      <button class="search-btn" @click="searchTrips">Caută</button>
      <button class="filters-btn" @click="showFiltersModal = true">Filtre</button>
    </div>

    <!-- Filters Modal -->
    <div v-if="showFiltersModal" class="modal-overlay" @click="showFiltersModal = false">
      <div class="filters-modal" @click.stop>
        <h3>Filtrează și sortează</h3>
        
        <div class="sort-section">
          <h4>Sortează după:</h4>
          <div class="sort-options">
            <div class="sort-group">
              <label>Preț</label>
              <div class="sort-buttons">
                <button 
                  :class="{ active: filtersStore.sortBy === 'price' && filtersStore.sortOrder === 'asc' }"
                  @click="applySort('price', 'asc')"
                >
                  Crescător
                </button>
                <button 
                  :class="{ active: filtersStore.sortBy === 'price' && filtersStore.sortOrder === 'desc' }"
                  @click="applySort('price', 'desc')"
                >
                  Descrescător
                </button>
              </div>
            </div>
            
            <div class="sort-group">
              <label>Data plecării</label>
              <div class="sort-buttons">
                <button 
                  :class="{ active: filtersStore.sortBy === 'departureDate' && filtersStore.sortOrder === 'asc' }"
                  @click="applySort('departureDate', 'asc')"
                >
                  Crescător
                </button>
                <button 
                  :class="{ active: filtersStore.sortBy === 'departureDate' && filtersStore.sortOrder === 'desc' }"
                  @click="applySort('departureDate', 'desc')"
                >
                  Descrescător
                </button>
              </div>
            </div>
            
            <div class="sort-group">
              <label>Durată</label>
              <div class="sort-buttons">
                <button 
                  :class="{ active: filtersStore.sortBy === 'duration' && filtersStore.sortOrder === 'asc' }"
                  @click="applySort('duration', 'asc')"
                >
                  Crescător
                </button>
                <button 
                  :class="{ active: filtersStore.sortBy === 'duration' && filtersStore.sortOrder === 'desc' }"
                  @click="applySort('duration', 'desc')"
                >
                  Descrescător
                </button>
              </div>
            </div>
          </div>
          
          <button v-if="filtersStore.sortBy" class="clear-sort-btn" @click="clearSort">
            Șterge sortarea
          </button>
        </div>

        <div class="modal-actions">
          <button class="primary-btn" @click="showFiltersModal = false">Închide</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  border-radius: 0;
  width: 100%;
}

.search-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  align-items: end;
}

.search-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.search-field label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #333;
}

.search-field input[type="text"],
.search-field input[type="date"] {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
  width: 100%;
}

.search-field input[type="text"]:focus,
.search-field input[type="date"]:focus {
  outline: none;
  border-color: #1976d2;
}

.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-top: 0.25rem;
  z-index: 100;
  max-height: 200px;
  overflow-y: auto;
}

.suggestion-item {
  padding: 0.75rem;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.suggestion-item:first-child {
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
}

.suggestion-item:last-child {
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
}

.ticket-selector {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  text-align: left;
  font-size: 1rem;
  position: relative;
}

.ticket-types-dropdown {
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  margin-top: 0.25rem;
  z-index: 100;
  min-width: 250px;
}

.ticket-type-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #eee;
}

.ticket-type-row:last-child {
  border-bottom: none;
}

.ticket-counter {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ticket-counter button {
  width: 32px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ticket-counter button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ticket-counter button:hover:not(:disabled) {
  background: #f5f5f5;
}

.search-btn {
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

.search-btn:hover {
  background: #1565c0;
}

.filters-btn {
  padding: 0.75rem 2rem;
  background: #666;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.filters-btn:hover {
  background: #555;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.filters-modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  max-height: 90vh;
  overflow-y: auto;
}

.filters-modal h3 {
  margin: 0 0 1.5rem 0;
  color: #333;
  font-size: 1.5rem;
}

.sort-section {
  margin-bottom: 1.5rem;
}

.sort-section h4 {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 1rem;
  font-weight: 600;
}

.sort-options {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.sort-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sort-group label {
  font-weight: 600;
  color: #333;
  font-size: 0.9375rem;
}

.sort-buttons {
  display: flex;
  gap: 0.5rem;
}

.sort-buttons button {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  color: #333;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.sort-buttons button:hover {
  background: #f5f5f5;
}

.sort-buttons button.active {
  background: #1976d2;
  color: white;
  border-color: #1976d2;
}

.clear-sort-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: transparent;
  color: #f44336;
  border: 1px solid #f44336;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-sort-btn:hover {
  background: #ffebee;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #eee;
}

.modal-actions .primary-btn {
  padding: 0.75rem 1.5rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.modal-actions .primary-btn:hover {
  background: #1565c0;
}

@media (max-width: 768px) {
  .search-container {
    grid-template-columns: 1fr;
  }
  
  .search-btn,
  .filters-btn {
    width: 100%;
  }
}
</style>
