import { defineStore } from "pinia";
import { ref } from "vue";
import { auth } from "@/services/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const loading = ref(true);

  const init = () => {
    onAuthStateChanged(auth, (u) => {
      user.value = u;
      loading.value = false;
    });
  };

  const logout = async () => {
    await signOut(auth);
    user.value = null;
  };

  const getIdToken = async () => {
    if (!user.value) return null;
    return await user.value.getIdToken();
  };

  return {
    user,
    loading,
    init,
    logout,
    getIdToken,
  };
});
