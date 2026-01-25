<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useFiltersStore } from "@/stores/filters";

const props = defineProps({
  trip: {
    type: Object,
    required: true,
  },
});

const router = useRouter();
const filtersStore = useFiltersStore();

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const formatTime = (timeStr) => {
  return timeStr;
};

const calculatePrice = () => {
  const basePrice = props.trip.price;
  const adultCount = filtersStore.ticketTypes.adult;
  const studentCount = filtersStore.ticketTypes.student;
  const pensionerCount = filtersStore.ticketTypes.pensioner;

  const adultTotal = basePrice * adultCount;
  const studentTotal = basePrice * 0.85 * studentCount;
  const pensionerTotal = basePrice * 0.85 * pensionerCount;

  return Math.round(adultTotal + studentTotal + pensionerTotal);
};

const totalPrice = computed(() => calculatePrice());

const viewDetails = () => {
  router.push(`/trip/${props.trip.tripId}`);
};
</script>

<template>
  <div class="trip-card">
    <div class="trip-header">
      <div class="route">
        <div class="city">
          <span class="city-name">{{ trip.startCity }}</span>
          <span class="time">{{ formatTime(trip.startTime) }}</span>
        </div>
        <div class="arrow">→</div>
        <div class="city">
          <span class="city-name">{{ trip.endCity }}</span>
          <span class="time">{{ formatTime(trip.endTime) }}</span>
        </div>
      </div>
      <div class="date">{{ formatDate(trip.startDate) }}</div>
    </div>

    <div class="trip-details">
      <div class="detail-item">
        <span class="label">Durată:</span>
        <span class="value">{{ trip.durationHours }}h</span>
      </div>
      <div class="detail-item">
        <span class="label">Locuri disponibile:</span>
        <span class="value" :class="{ low: trip.availableSeats < 10 }">
          {{ trip.availableSeats }}
        </span>
      </div>
      <div v-if="trip.stops && trip.stops.length > 0" class="detail-item">
        <span class="label">Opriri:</span>
        <span class="value">{{ trip.stops.length }}</span>
      </div>
    </div>

    <div class="trip-footer">
      <div class="price">
        <span class="price-label">De la</span>
        <span class="price-value">{{ totalPrice }} RON</span>
        <span v-if="filtersStore.totalTickets > 1" class="price-note">
          ({{ filtersStore.totalTickets }} bilete)
        </span>
      </div>
      <button class="buy-btn" @click="viewDetails" :disabled="trip.availableSeats === 0">
        {{ trip.availableSeats === 0 ? "Indisponibil" : "Vezi detalii" }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.trip-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  margin-bottom: 1.5rem;
}

.trip-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.trip-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.route {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.city {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.city-name {
  font-size: 1.125rem;
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

.date {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.trip-details {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-item .label {
  font-size: 0.75rem;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-item .value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #333;
}

.detail-item .value.low {
  color: #f44336;
}

.trip-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid #eee;
}

.price {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.price-label {
  font-size: 0.75rem;
  color: #999;
}

.price-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1976d2;
}

.price-note {
  font-size: 0.75rem;
  color: #666;
}

.buy-btn {
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
  .trip-header {
    flex-direction: column;
    gap: 0.75rem;
  }

  .trip-footer {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .buy-btn {
    width: 100%;
  }
}
</style>
