<script setup>
import { ref } from "vue";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const confirmPassword = ref("");
const loading = ref(false);
const error = ref("");
const router = useRouter();

const register = async () => {
  error.value = "";

  if (!email.value || !password.value || !confirmPassword.value) {
    error.value = "Completează toate câmpurile";
    return;
  }

  if (password.value.length < 6) {
    error.value = "Parola trebuie să aibă cel puțin 6 caractere";
    return;
  }

  if (password.value !== confirmPassword.value) {
    error.value = "Parolele nu coincid";
    return;
  }

  loading.value = true;
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);
    const redirectPath = router.currentRoute.value.query.redirect || "/";
    router.push(redirectPath);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      error.value = "Acest email este deja înregistrat";
    } else if (err.code === "auth/invalid-email") {
      error.value = "Email invalid";
    } else {
      error.value = "Eroare la înregistrare. Încearcă din nou.";
    }
  } finally {
    loading.value = false;
  }
};

const goToLogin = () => {
  router.push({
    path: "/login",
    query: router.currentRoute.value.query,
  });
};
</script>

<template>
  <div class="auth-view">
    <div class="auth-card">
      <h2>Înregistrare</h2>

      <p v-if="error" class="error-message">{{ error }}</p>

      <div class="form-group">
        <label>Email</label>
        <input
          v-model="email"
          type="email"
          placeholder="exemplu@email.com"
          :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label>Parolă</label>
        <input
          v-model="password"
          type="password"
          placeholder="Minim 6 caractere"
          :disabled="loading"
        />
      </div>

      <div class="form-group">
        <label>Confirmă parola</label>
        <input
          v-model="confirmPassword"
          type="password"
          placeholder="Repetă parola"
          :disabled="loading"
          @keyup.enter="register"
        />
      </div>

      <button class="primary-btn" @click="register" :disabled="loading">
        {{ loading ? "Se înregistrează..." : "Creează cont" }}
      </button>

      <hr />

      <p class="link-text">
        Ai deja cont?
        <a href="#" @click.prevent="goToLogin">Conectează-te</a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.auth-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 400px;
}

h2 {
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.75rem;
  text-align: center;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9375rem;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #1976d2;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  background: #ffebee;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  font-size: 0.9375rem;
}

.primary-btn {
  width: 100%;
  padding: 0.75rem;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  margin-bottom: 1rem;
}

.primary-btn:hover:not(:disabled) {
  background: #1565c0;
}

.primary-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.link-text {
  text-align: center;
  color: #666;
  font-size: 0.9375rem;
}

.link-text a {
  color: #1976d2;
  text-decoration: none;
  font-weight: 600;
}

.link-text a:hover {
  text-decoration: underline;
}

hr {
  margin: 1.5rem 0;
  border: none;
  border-top: 1px solid #eee;
}
</style>
