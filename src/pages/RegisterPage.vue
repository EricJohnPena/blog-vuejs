<script setup>
import { ref, computed, onBeforeMount } from "vue";
import { useRouter } from "vue-router";
import { Notyf } from "notyf";
import api from "../api.js";
import { useGlobalStore } from "../stores/user.js";

const router = useRouter();
const notyf = new Notyf();
const { user } = useGlobalStore();

const email = ref("");
const password = ref("");
const confirmPass = ref("");
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const isSubmitting = ref(false);

const passwordsMismatch = computed(
  () => confirmPass.value.length > 0 && password.value !== confirmPass.value
);

const passwordsMatch = computed(
  () => confirmPass.value.length > 0 && password.value === confirmPass.value
);

const isEnabled = computed(
  () =>
    email.value.trim().length > 0 &&
    password.value.length > 0 &&
    confirmPass.value.length > 0 &&
    password.value === confirmPass.value
);

async function handleSubmit() {
  if (!isEnabled.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const response = await api.post("/users/register", {
      email: email.value.trim(),
      password: password.value,
    });

    if (response.status === 201 || response.status === 200) {
      email.value = "";
      password.value = "";
      confirmPass.value = "";

      notyf.success(response.data?.message || "Account created! Please sign in.");
      router.push({ path: "/login" });
    } else {
      notyf.error("Registration Failed. Please Contact Administrator.");
    }
  } catch (e) {
    console.error("Register Error Details:", e);

    const status = e.response?.status;
    if (status && [400, 401, 404, 409].includes(status)) {
      notyf.error(
        e.response.data?.message ||
          e.response.data?.error ||
          "Registration Failed."
      );
    } else {
      notyf.error("Registration Failed. Please Contact Administrator.");
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
              <i class="bi bi-person-plus fs-3"></i>
            </div>
            <h1 class="h3 fw-bold tracking-tight mb-1">Create an account</h1>
            <p class="text-secondary small mb-0">
              Join pena<span class="text-primary fw-semibold">Blog</span> to write posts and join the discussion
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
            <div class="mb-3">
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
                  placeholder="Create a password"
                  autocomplete="new-password"
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

            <!-- Confirm Password -->
            <div class="mb-4">
              <label
                for="cpasswordInput"
                class="form-label fw-medium small text-uppercase text-muted"
              >
                Confirm Password
              </label>
              <div class="input-group">
                <span class="input-group-text bg-light border-0 rounded-start-3 text-muted ps-3">
                  <i class="bi bi-shield-lock"></i>
                </span>
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  id="cpasswordInput"
                  class="form-control bg-light border-0 py-2 shadow-none"
                  v-model="confirmPass"
                  placeholder="Re-enter your password"
                  autocomplete="new-password"
                  required
                />
                <button
                  type="button"
                  class="btn bg-light border-0 rounded-end-3 text-muted pe-3"
                  @click="showConfirmPassword = !showConfirmPassword"
                  :aria-label="showConfirmPassword ? 'Hide password' : 'Show password'"
                >
                  <i class="bi" :class="showConfirmPassword ? 'bi-eye-slash' : 'bi-eye'"></i>
                </button>
              </div>

              <!-- Live Match Indicator -->
              <div v-if="passwordsMismatch" class="text-danger small mt-2">
                <i class="bi bi-exclamation-circle me-1"></i>Passwords do not match.
              </div>
              <div v-else-if="passwordsMatch" class="text-success small mt-2">
                <i class="bi bi-check-circle me-1"></i>Passwords match.
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
                <i v-else class="bi bi-person-check me-2"></i>
                {{ isSubmitting ? "Creating account..." : "Create Account" }}
              </button>
            </div>
          </form>

          <!-- Footer Link -->
          <div class="text-center pt-3 border-top border-light-subtle">
            <p class="text-muted small mb-0">
              Already have an account?
              <router-link
                :to="{ name: 'Login' }"
                class="link-primary fw-semibold text-decoration-none ms-1"
              >
                Sign in
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
