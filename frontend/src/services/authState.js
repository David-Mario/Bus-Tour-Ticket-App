import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

let isAuthResolved = false;

export function waitForAuth() {
  return new Promise((resolve) => {
    if (isAuthResolved) {
      resolve(auth.currentUser);
      return;
    }

    onAuthStateChanged(auth, (user) => {
      isAuthResolved = true;
      resolve(user);
    });
  });
}
