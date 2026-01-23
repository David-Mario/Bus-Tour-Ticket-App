<script setup>
import { auth } from "@/services/firebase";
import { useRoute } from "vue-router";

const route = useRoute();

const buyTicket = async () => {
  try {
    const token = await auth.currentUser.getIdToken();

    const response = await fetch("http://localhost:5000/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        tripId: route.params.tripId,
      }),
    });

    const data = await response.json();
    alert("Bilet cumpărat cu succes!");
  } catch (error) {
    alert("Eroare la cumpărare");
  }
};
</script>

<template>
  <div>
    <h2>Buy Ticket</h2>
    <p>Trip ID: {{ route.params.tripId }}</p>

    <button @click="buyTicket">
      Confirm purchase
    </button>
  </div>
</template>
