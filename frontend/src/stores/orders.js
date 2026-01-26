import { defineStore } from "pinia";
import { ref } from "vue";
import { auth } from "@/services/firebase";

export const useOrdersStore = defineStore("orders", () => {
  const orders = ref([]);
  const loading = ref(false);
  const error = ref("");

  const fetchMyOrders = async () => {
    const user = auth.currentUser;
    if (!user) {
      orders.value = [];
      return;
    }

    loading.value = true;
    error.value = "";
    try {
      const token = await user.getIdToken();
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
      orders.value = [];
    } finally {
      loading.value = false;
    }
  };

  const cancelOrder = async (orderId) => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const token = await user.getIdToken();
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
        await fetchMyOrders();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const deleteOrder = async (orderId) => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`http://localhost:5000/api/orders/${orderId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await response.json();
      if (json.success) {
        await fetchMyOrders();
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return {
    orders,
    loading,
    error,
    fetchMyOrders,
    cancelOrder,
    deleteOrder,
  };
});
