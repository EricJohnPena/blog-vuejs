<script setup>
import { ref, computed, onBeforeMount } from "vue";
import { useRouter } from "vue-router";
import { Notyf } from "notyf";
import api from "../api.js";
import { useGlobalStore } from "../stores/user.js";

const router = useRouter();
const notyf = new Notyf();
const { getUserDetails, user } = useGlobalStore();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const isSubmitting = ref(false);

const isEnabled = computed(
  () => email.value.trim().length > 0 && password.value.length > 0
);

async function handleSubmit() {
  if (!isEnabled.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const res = await api.post("/users/login", {
      email: email.value.trim(),
      password: password.value,
    });

    const myToken =
      res.data?.access || res.data?.token || res.data?.accessToken;

    if (!myToken) {
      notyf.error("Login succeeded, but no token was returned.");
      return;
    }

    localStorage.setItem("token", myToken);
    await getUserDetails(myToken);

    notyf.success(res.data?.message || "Login Successful!");

    email.value = "";
    password.value = "";

    router.push({ path: "/" });
  } catch (e) {
    console.error("Login Error Details:", e);

    const status = e.response?.status;
    if (status && [400, 401, 404].includes(status)) {
      const errorMessage =
        e.response.data?.message ||
        e.response.data?.error ||
        "Invalid Credentials";
      notyf.error(errorMessage);
    } else {
      notyf.error("Login Failed. Please Contact Administrator.");
    }
  } finally {
    isSubmitting.value = false;
  }
}

onBeforeMount(() => {
  if (user.token) {
    router.push({ path: "/" });
  }
});
</script>

<template>
  <div class="bg-light min-vh-100 d-flex align-items-center py-5">
    <div class="container" style="max-width: 460px">
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-body p-4 p-md-5">
          <!-- Brand Header -->
          <div class="text-center mb-4">
            <div
              class="d-inline-flex align-items-center justify-content-center rounded-4 bg-primary bg-opacity-10 text-primary mb-3"
              style="width: 56px; height: 56px"
            >
              <i class="bi bi-journal-richtext fs-3"></i>
            </div>
            <h1 class="h3 fw-bold tracking-tight mb-1">Welcome back</h1>
            <p class="text-secondary small mb-0">
              Sign in to continue to pena<span class="text-primary fw-semibold">Blog</span>
            </p>
          </div>

          <form @submit.prevent="handleSubmit">
            <!-- Email -->
            <div class="mb-3">
              <label
                for="emailInput"
                class="form-label fw-medium small text-uppercase text-muted"
              >
                Email Address
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light border-0 rounded-start-3 text-muted ps-3">
                  <i class="bi bi-envelope"></i>
                </span>
                <input
                  type="email"
                  id="emailInput"
                  class="form-control bg-light border-0 rounded-end-3 py-2 shadow-none"
                  v-model="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                  required
                />
              </div>
            </div>

            <!-- Password -->
            <div class="mb-4">
              <label
                for="passwordInput"
                class="form-label fw-medium small text-uppercase text-muted"
              >
                Password
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light border-0 rounded-start-3 text-muted ps-3">
                  <i class="bi bi-lock"></i>
                </span>
                <input
                  :type="showPassword ? 'text' : 'password'"
                  id="passwordInput"
                  class="form-control bg-light border-0 py-2 shadow-none"
                  v-model="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  class="btn bg-light border-0 rounded-end-3 text-muted pe-3"
                  @click="showPassword = !showPassword"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <i class="bi" :class="showPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>
            </div>

            <!-- Submit -->
            <div class="d-grid mb-4">
              <button
                type="submit"
                class="btn btn-primary rounded-pill py-2 fw-medium shadow-sm"
                :disabled="!isEnabled || isSubmitting"
              >
                <span
                  v-if="isSubmitting"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                <i v-else class="bi bi-box-arrow-in-right me-2"></i>
                {{ isSubmitting ? "Signing in..." : "Sign In" }}
              </button>
            </div>
          </form>

          <!-- Footer Link -->
          <div class="text-center pt-3 border-top border-light-subtle">
            <p class="text-muted small mb-0">
              Don't have an account yet?
              <router-link
                :to="{ name: 'Register' }"
                class="link-primary fw-semibold text-decoration-none ms-1"
              >
                Create one
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
