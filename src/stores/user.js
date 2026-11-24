import { defineStore } from "pinia";
import { reactive } from "vue";

function decodeJwt(token) {
  const base64Url = token.split(".")[1];
  if (!base64Url) throw new Error("Invalid JWT format");

  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const jsonPayload = decodeURIComponent(
    atob(padded)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );

  return JSON.parse(jsonPayload);
}

export const useGlobalStore = defineStore("user", () => {
  const user = reactive({
    token: localStorage.getItem("token"),
    id: null,
    email: null,
    isAdmin: false,
  });

  function clearUser() {
    user.token = null;
    user.id = null;
    user.email = null;
    user.isAdmin = false;
    localStorage.removeItem("token");
  }

  function getUserDetails(token = localStorage.getItem("token")) {
    if (!token || token === "undefined") {
      clearUser();
      return;
    }

    try {
      const payload = decodeJwt(token);

      // Automatically clear if the JWT has an expiry and is expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        clearUser();
        return;
      }

      user.token = token;
      user.id = payload.id || payload._id || null;
      user.email = payload.email || null;
      user.isAdmin = Boolean(payload.isAdmin);
    } catch (error) {
      console.error("Failed to decode token:", error);
      clearUser();
    }
  }

  return {
    user,
    getUserDetails,
    clearUser,
  };
});