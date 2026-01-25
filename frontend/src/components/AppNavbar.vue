<script setup>
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useFiltersStore } from "@/stores/filters";
import SearchBar from "./SearchBar.vue";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const filtersStore = useFiltersStore();

const showSearchBar = computed(() => {
  return route.path === "/";
});

const handleLogout = async () => {
  await authStore.logout();
  router.push("/");
};

const goToMyTickets = () => {
  router.push("/my-tickets");
};

const goToLogin = () => {
  router.push("/login");
};
</script>

<template>
  <nav class="app-navbar">
    <div class="navbar-content">
      <div class="navbar-brand" @click="router.push('/')">
        <h1>🚌 BusTour</h1>
      </div>

      <div class="navbar-actions">
        <button
          v-if="authStore.user"
          class="nav-btn"
          @click="goToMyTickets"
        >
          Biletele mele
        </button>
        <button
          v-if="authStore.user"
          class="nav-btn secondary"
          @click="handleLogout"
        >
          Logout
        </button>
        <button
          v-else
          class="nav-btn"
          @click="goToLogin"
        >
          Login
        </button>
      </div>
    </div>

    <SearchBar v-if="showSearchBar" />
  </nav>
</template>

<style scoped>
.app-navbar {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
  margin-bottom: 0;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eee;
}

.navbar-brand {
  cursor: pointer;
}

.navbar-brand h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #1976d2;
  font-weight: 700;
}

.navbar-actions {
  display: flex;
  gap: 0.75rem;
}

.nav-btn {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: #1976d2;
  color: white;
}

.nav-btn:hover {
  background: #1565c0;
}

.nav-btn.secondary {
  background: transparent;
  color: #1976d2;
  border: 1px solid #1976d2;
}

.nav-btn.secondary:hover {
  background: #f5f5f5;
}

@media (max-width: 768px) {
  .navbar-content {
    flex-direction: column;
    gap: 1rem;
  }

  .navbar-actions {
    width: 100%;
    justify-content: center;
  }
}
</style>
