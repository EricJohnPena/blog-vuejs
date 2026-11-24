<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Notyf } from "notyf";
import { useGlobalStore } from "../stores/user.js";

const store = useGlobalStore();
const router = useRouter();
const notyf = new Notyf();

const isNavOpen = ref(false);

const isAuthenticated = computed(() =>
  Boolean(store.user?.token || store.user?.email)
);

const userInitial = computed(() =>
  (store.user?.email || "U").charAt(0).toUpperCase()
);

function closeNav() {
  isNavOpen.value = false;
}

function handleLogout() {
  if (!window.confirm("Are you sure you want to logout?")) {
    return;
  }

  if (typeof store.clearUser === "function") {
    store.clearUser();
  } else {
    localStorage.removeItem("token");
    store.user.id = null;
    store.user.email = null;
    store.user.isAdmin = false;
    store.user.token = null;
  }

  closeNav();
  notyf.success("Logged out successfully.");
  router.push({ name: "Login" });
}
</script>

<template>
  <nav class="navbar navbar-expand-lg sticky-top navbar-glass border-bottom py-2">
    <div class="container" style="max-width: 1120px">
      <!-- Brand -->
      <router-link
        :to="{ name: 'Home' }"
        class="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark m-0"
        @click="closeNav"
      >
        <span
          class="d-inline-flex align-items-center justify-content-center rounded-3 bg-primary bg-opacity-10 text-primary"
          style="width: 36px; height: 36px"
        >
          <i class="bi bi-journal-richtext fs-5"></i>
        </span>
        <span class="fs-5 tracking-tight">
          pena<span class="text-primary">Blog</span>
        </span>
      </router-link>

      <!-- Mobile Toggle Button (Vue-controlled, no Bootstrap JS required) -->
      <button
        class="navbar-toggler border-0 shadow-none p-2 rounded-3 text-secondary"
        type="button"
        :aria-expanded="isNavOpen"
        aria-label="Toggle navigation"
        @click="isNavOpen = !isNavOpen"
      >
        <i class="bi fs-4" :class="isNavOpen ? 'bi-x-lg' : 'bi-list'"></i>
      </button>

      <!-- Collapsible Links -->
      <div
        class="collapse navbar-collapse"
        :class="{ show: isNavOpen }"
      >
        <div
          class="navbar-nav ms-auto align-items-lg-center gap-2 pt-3 pt-lg-0 mt-2 mt-lg-0 border-top border-lg-0"
        >
          <router-link
            :to="{ name: 'Home' }"
            class="nav-link px-3 rounded-pill fw-medium d-inline-flex align-items-center gap-1"
            active-class="text-primary bg-primary bg-opacity-10"
            @click="closeNav"
          >
            <i class="bi bi-house-door"></i>
            <span>Home</span>
          </router-link>

          <!-- Logged-out Actions -->
          <template v-if="!isAuthenticated">
            <router-link
              :to="{ name: 'Login' }"
              class="btn btn-light rounded-pill px-3 py-2 fw-medium text-secondary d-inline-flex align-items-center justify-content-center gap-2"
              @click="closeNav"
            >
              <i class="bi bi-box-arrow-in-right"></i>
              <span>Login</span>
            </router-link>

            <router-link
              :to="{ name: 'Register' }"
              class="btn btn-primary rounded-pill px-4 py-2 fw-medium shadow-sm d-inline-flex align-items-center justify-content-center gap-2"
              @click="closeNav"
            >
              <i class="bi bi-person-plus"></i>
              <span>Register</span>
            </router-link>
          </template>

          <!-- Logged-in User Pill & Logout -->
          <template v-else>
            <div
              class="d-flex align-items-center gap-2 bg-light rounded-pill px-3 py-1 my-1 my-lg-0"
            >
              <div
                class="rounded-circle bg-primary bg-opacity-10 text-primary fw-bold d-flex align-items-center justify-content-center flex-shrink-0"
                style="width: 28px; height: 28px; font-size: 0.78rem"
              >
                {{ userInitial }}
              </div>
              <span class="small fw-medium text-dark text-truncate" style="max-width: 180px">
                {{ store.user.email }}
              </span>
              <span
                v-if="store.user.isAdmin"
                class="badge rounded-pill bg-primary bg-opacity-10 text-primary fw-semibold"
                style="font-size: 0.7rem"
              >
                <i class="bi bi-shield-check me-1"></i>Admin
              </span>
            </div>

            <button
              type="button"
              class="btn btn-outline-danger btn-sm rounded-pill px-3 py-2 fw-medium d-inline-flex align-items-center justify-content-center gap-1"
              @click="handleLogout"
            >
              <i class="bi bi-box-arrow-right"></i>
              <span>Logout</span>
            </button>
          </template>
        </div>
      </div>
    </div>
  </nav>
</template>

