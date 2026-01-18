<template>
  <Navbar />
  <div class="container">
    <TourCard title="Italy Tour" duration="7 days" />
    <TourCard title="France Tour" duration="5 days" />
  </div>
</template>

<script setup>
import Navbar from "../components/Navbar.vue";
import TourCard from "../components/TourCard.vue";
</script>

<style scoped>
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  padding: 1rem;
}
</style>
