<script setup>
import { ref } from "vue";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "@/services/firebase";
import { useRouter } from "vue-router";
import { getAuth } from "firebase/auth";

const router = useRouter();

const email = ref("");
const password = ref("");

// reset modal
const showResetModal = ref(false);
const resetEmail = ref("");

const login = async () => {
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    
    const redirectPath = router.currentRoute.value.query.redirect || "/";
    router.push(redirectPath);

  } catch (error) {
    alert("Email sau parolă greșită");
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
  } catch (error) {
    alert(error.message);
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
  <div>
    <h2>Login</h2>

    <input
      v-model="email"
      type="email"
      placeholder="Email"
    />

    <input
      v-model="password"
      type="password"
      placeholder="Parolă"
    />

    <button @click="login">
      Login
    </button>

    <p style="margin-top: 8px">
      <a href="#" @click.prevent="openResetModal">
        Ai uitat parola?
      </a>
    </p>

    <p style="margin-top: 12px">
      Nu ai cont?
      <a href="#" @click.prevent="goToRegister">
        Înregistrează-te
      </a>
    </p>

    <!-- RESET PASSWORD MODAL -->
    <div v-if="showResetModal" class="modal-overlay">
      <div class="modal">
        <h3>Resetare parolă</h3>

        <input
          v-model="resetEmail"
          type="email"
          placeholder="Introdu email-ul"
        />

        <div class="actions">
          <button @click="resetPassword">
            Trimite email
          </button>

          <button @click="closeResetModal">
            Anulează
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  background: white;
  padding: 20px;
  width: 300px;
  border-radius: 6px;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
}
</style>
