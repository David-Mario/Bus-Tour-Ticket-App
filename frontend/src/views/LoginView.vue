<script setup>
import { ref } from "vue";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useRouter } from "vue-router";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

const showResetModal = ref(false);
const resetEmail = ref("");

const login = async () => {
  error.value = "";
  if (!email.value || !password.value) {
    error.value = "Completează toate câmpurile";
    return;
  }

  loading.value = true;
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    const redirectPath = router.currentRoute.value.query.redirect || "/";
    router.push(redirectPath);
  } catch (err) {
    error.value = "Email sau parolă greșită";
  } finally {
    loading.value = false;
  }
};

const openResetModal = () => {
  resetEmail.value = "";
  showResetModal.value = true;
};

const closeResetModal = () => {
  showResetModal.value = false;
};

const resetPassword = async () => {
  if (!resetEmail.value) {
    alert("Introdu adresa de email");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, resetEmail.value);
    alert("Email de resetare trimis. Verifică inbox-ul.");
    closeResetModal();
  } catch (err) {
    alert(err.message);
  }
};

const goToRegister = () => {
  router.push({
    path: "/register",
    query: router.currentRoute.value.query,
  });
};
</script>

<template>
  <div class="auth-view">
    <div class="auth-card">
      <h2>Autentificare</h2>

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
          placeholder="Parola ta"
          :disabled="loading"
          @keyup.enter="login"
        />
      </div>

      <button class="primary-btn" @click="login" :disabled="loading">
        {{ loading ? "Se conectează..." : "Conectează-te" }}
      </button>

      <p class="link-text">
        <a href="#" @click.prevent="openResetModal">Ai uitat parola?</a>
      </p>

      <hr />

      <p class="link-text">
        Nu ai cont?
        <a href="#" @click.prevent="goToRegister">Înregistrează-te</a>
      </p>
    </div>

    <!-- RESET PASSWORD MODAL -->
    <div v-if="showResetModal" class="modal-overlay" @click="closeResetModal">
      <div class="modal" @click.stop>
        <h3>Resetare parolă</h3>
        <p>Introdu adresa de email pentru a primi link-ul de resetare.</p>

        <div class="form-group">
          <input
            v-model="resetEmail"
            type="email"
            placeholder="Email"
            @keyup.enter="resetPassword"
          />
        </div>

        <div class="modal-actions">
          <button class="primary-btn" @click="resetPassword">Trimite email</button>
          <button class="secondary-btn" @click="closeResetModal">Anulează</button>
        </div>
      </div>
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.modal h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.modal p {
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 0.9375rem;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
}

.secondary-btn {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #1976d2;
  border: 1px solid #1976d2;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.secondary-btn:hover {
  background: #f5f5f5;
}
</style>
