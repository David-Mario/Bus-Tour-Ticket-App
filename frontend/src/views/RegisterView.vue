<script setup>
import { ref } from "vue";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/services/firebase";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const router = useRouter();

const register = async () => {
  try {
    await createUserWithEmailAndPassword(auth, email.value, password.value);

    const redirectPath = router.currentRoute.value.query.redirect || "/";

    router.push(redirectPath);
  } catch (error) {
    alert(error.message);
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
  <div>
    <h2>Register</h2>

    <input v-model="email" type="email" placeholder="Email" />
    <input v-model="password" type="password" placeholder="Password" />

    <button @click="register">Create account</button>

    <p style="margin-top: 10px">
      Ai deja cont?
      <a href="#" @click.prevent="goToLogin">Login</a>
    </p>
  </div>
</template>
