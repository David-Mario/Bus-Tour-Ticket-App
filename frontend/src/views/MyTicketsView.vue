<script setup>
import { ref, onMounted } from "vue";
import { auth } from "@/services/firebase";
import { useRouter, useRoute } from "vue-router";
import { onAuthStateChanged, signOut } from "firebase/auth";

const router = useRouter();
const route = useRoute();
const orders = ref([]);
const user = ref(null);
const loading = ref(false);
const error = ref("");

const fetchOrders = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    router.push("/login");
    return;
  }

  loading.value = true;
  error.value = "";
  try {
    const token = await currentUser.getIdToken();
    const response = await fetch("http://localhost:5000/api/orders/my", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const json = await response.json();
    if (json.success && json.data) {
      orders.value = json.data;
    } else {
      error.value = json.message || "Eroare la încărcarea biletelor";
    }
  } catch (e) {
    console.error(e);
    error.value = "Eroare la încărcarea biletelor";
  } finally {
    loading.value = false;
  }
};

const cancelOrder = async (orderId, trip) => {
  if (!confirm("Ești sigur că vrei să anulezi această rezervare?")) {
    return;
  }

  const currentUser = auth.currentUser;
  if (!currentUser) return;

  try {
    const token = await currentUser.getIdToken();
    const response = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "cancelled" }),
    });

    const json = await response.json();
    if (json.success) {
      await fetchOrders();
      alert("Rezervarea a fost anulată");
    } else {
      alert(json.message || "Eroare la anulare");
    }
  } catch (e) {
    console.error(e);
    alert("Eroare la anulare");
  }
};

const logout = async () => {
  await signOut(auth);
  router.push("/");
};

onMounted(() => {
  onAuthStateChanged(auth, (u) => {
    user.value = u;
    if (u) {
      fetchOrders();
    } else {
      router.push("/login");
    }
  });

  if (route.query.session_id) {
    setTimeout(() => {
      alert("Plata a fost procesată cu succes! Biletul tău apare mai jos.");
    }, 500);
  }
});
</script>

<template>
  <div>
    <h1>Biletele mele</h1>

    <div v-if="user">
      <p>Logat ca: {{ user.email }}</p>
      <button @click="logout">Logout</button>
    </div>

    <hr />

    <div v-if="loading">Se încarcă...</div>
    <p v-if="error" style="color: red;">{{ error }}</p>

    <div v-if="!loading && orders.length === 0">
      <p>Nu ai bilete rezervate.</p>
      <button @click="router.push('/')">Vezi călătorii disponibile</button>
    </div>

    <div v-for="order in orders" :key="order.orderId" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 6px;">
      <div v-if="order.trip">
        <h3>
          {{ order.trip.startCity }} → {{ order.trip.endCity }}
        </h3>
        <p>Plecare: {{ order.trip.startDate }} {{ order.trip.startTime }}</p>
        <p>Sosire: {{ order.trip.endDate }} {{ order.trip.endTime }}</p>
        <p>Locuri: {{ order.seatsCount }}</p>
        <p>Preț total: {{ order.totalPrice }} RON</p>
        <p>
          Status:
          <strong :style="{ color: order.status === 'confirmed' ? 'green' : 'red' }">
            {{ order.status === 'confirmed' ? 'Confirmat' : 'Anulat' }}
          </strong>
        </p>
        <p v-if="order.createdAt">
          Rezervat pe: {{ new Date(order.createdAt).toLocaleString('ro-RO') }}
        </p>

        <button
          v-if="order.status === 'confirmed'"
          @click="cancelOrder(order.orderId, order.trip)"
          style="background: #dc3545; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;"
        >
          Anulează rezervarea
        </button>
      </div>
      <div v-else>
        <p>Comandă #{{ order.orderId }}</p>
        <p>Status: {{ order.status }}</p>
        <p>Eroare: Detaliile călătoriei nu sunt disponibile</p>
      </div>
    </div>
  </div>
</template>
