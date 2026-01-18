<template>
  <div class="card">
    <h3>{{ title }}</h3>
    <p>{{ duration }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  duration: String,
});
</script>

<style scoped>
.card {
  border: 1px solid #ddd;
  padding: 1rem;
  border-radius: 6px;
}
</style>
