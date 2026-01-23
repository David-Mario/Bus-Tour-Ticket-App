import { createRouter, createWebHistory } from "vue-router";
import { waitForAuth } from "../services/authState";

import ToursView from "../views/ToursView.vue";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import BuyTicketView from "../views/BuyTicketView.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: ToursView, // PUBLIC
  },
  {
    path: "/login",
    component: LoginView,
  },
  {
    path: "/register",
    component: RegisterView,
  },
  {
    path: "/buy/:tripId",
    component: BuyTicketView,
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  const user = await waitForAuth();

  if (to.meta.requiresAuth && !user) {
    next({
      path: "/login",
      query: { redirect: to.fullPath },
    });
  } else {
    next();
  }
});

export default router;
