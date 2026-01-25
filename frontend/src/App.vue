<template>
  <div id="app">
    <AppNavbar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import AppNavbar from "./components/AppNavbar.vue";
import { useAuthStore } from "./stores/auth";
import { useTripsStore } from "./stores/trips";

const authStore = useAuthStore();
const tripsStore = useTripsStore();

onMounted(() => {
  authStore.init();
  tripsStore.fetchTrips();
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background: #f5f5f5;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
}
</style>
