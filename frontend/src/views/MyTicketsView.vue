<script setup>
import { onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useOrdersStore } from "@/stores/orders";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const route = useRoute();
const ordersStore = useOrdersStore();
const authStore = useAuthStore();

const confirmedOrders = computed(() => {
  return ordersStore.orders.filter((o) => o.status === "confirmed");
});

const cancelledOrders = computed(() => {
  return ordersStore.orders.filter((o) => o.status === "cancelled");
});

const handleCancel = async (orderId) => {
  if (!confirm("Ești sigur că vrei să anulezi această rezervare?")) {
    return;
  }

  const success = await ordersStore.cancelOrder(orderId);
  if (success) {
    alert("Rezervarea a fost anulată cu succes!");
  } else {
    alert("Eroare la anulare. Verifică că ai cel puțin 2 zile înainte de plecare.");
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

onMounted(() => {
  if (!authStore.user) {
    router.push("/login");
    return;
  }

  ordersStore.fetchMyOrders();

  if (route.query.session_id) {
    setTimeout(() => {
      alert("Plata a fost procesată cu succes! Biletul tău apare mai jos.");
    }, 500);
  }
});
</script>

<template>
  <div class="my-tickets-view">
    <h1>Biletele mele</h1>

    <div v-if="ordersStore.loading" class="loading">
      <p>Se încarcă biletele...</p>
    </div>

    <div v-else-if="ordersStore.error" class="error">
      <p>{{ ordersStore.error }}</p>
    </div>

    <div v-else-if="ordersStore.orders.length === 0" class="empty">
      <p>Nu ai bilete rezervate.</p>
      <button @click="router.push('/')">Vezi călătorii disponibile</button>
    </div>

    <div v-else>
      <div v-if="confirmedOrders.length > 0" class="orders-section">
        <h2>Rezervări active ({{ confirmedOrders.length }})</h2>
        <div class="orders-list">
          <div
            v-for="order in confirmedOrders"
            :key="order.orderId"
            class="order-card"
          >
            <div v-if="order.trip" class="order-content">
              <div class="order-header">
                <h3>
                  {{ order.trip.startCity }} → {{ order.trip.endCity }}
                </h3>
                <span class="status-badge confirmed">Confirmat</span>
              </div>

              <div class="order-details">
                <div class="detail-row">
                  <span class="label">Plecare:</span>
                  <span class="value">
                    {{ order.trip.startDate }} {{ order.trip.startTime }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="label">Sosire:</span>
                  <span class="value">
                    {{ order.trip.endDate }} {{ order.trip.endTime }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="label">Locuri:</span>
                  <span class="value">{{ order.seatsCount }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Preț total:</span>
                  <span class="value price">{{ order.totalPrice }} RON</span>
                </div>
                <div class="detail-row">
                  <span class="label">Rezervat pe:</span>
                  <span class="value">{{ formatDate(order.createdAt) }}</span>
                </div>
              </div>

              <button class="cancel-btn" @click="handleCancel(order.orderId)">
                Anulează rezervarea
              </button>
            </div>
            <div v-else class="order-error">
              <p>Eroare: Detaliile călătoriei nu sunt disponibile</p>
            </div>
          </div>
        </div>
      </div>

      <div v-if="cancelledOrders.length > 0" class="orders-section">
        <h2>Rezervări anulate ({{ cancelledOrders.length }})</h2>
        <div class="orders-list">
          <div
            v-for="order in cancelledOrders"
            :key="order.orderId"
            class="order-card cancelled"
          >
            <div v-if="order.trip" class="order-content">
              <div class="order-header">
                <h3>
                  {{ order.trip.startCity }} → {{ order.trip.endCity }}
                </h3>
                <span class="status-badge cancelled-badge">Anulat</span>
              </div>
              <div class="order-details">
                <div class="detail-row">
                  <span class="label">Anulat pe:</span>
                  <span class="value">{{ formatDate(order.createdAt) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.my-tickets-view {
  width: 100%;
}

h1 {
  margin-bottom: 2rem;
  color: #333;
  font-size: 2rem;
}

h2 {
  margin: 2rem 0 1rem;
  color: #666;
  font-size: 1.25rem;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 3rem 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

.orders-section {
  margin-bottom: 3rem;
}

.orders-list {
  display: grid;
  gap: 1.5rem;
}

.order-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.order-card:hover {
  transform: translateY(-2px);
}

.order-card.cancelled {
  opacity: 0.7;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.order-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
}

.status-badge.confirmed {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.cancelled-badge {
  background: #ffebee;
  color: #c62828;
}

.order-details {
  display: grid;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-row .label {
  color: #666;
  font-size: 0.9375rem;
}

.detail-row .value {
  font-weight: 600;
  color: #333;
}

.detail-row .value.price {
  color: #1976d2;
  font-size: 1.125rem;
}

.cancel-btn {
  padding: 0.75rem 1.5rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  width: 100%;
  margin-top: 1rem;
}

.cancel-btn:hover {
  background: #d32f2f;
}

.order-error {
  color: #f44336;
  padding: 1rem;
  text-align: center;
}

@media (max-width: 768px) {
  h1 {
    font-size: 1.5rem;
  }

  .order-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
