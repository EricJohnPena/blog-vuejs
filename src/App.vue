<script setup>
import { onBeforeMount } from "vue";
import NavBarComponent from "./components/NavBarComponent.vue";
import { useGlobalStore } from "./stores/user.js";

const { getUserDetails } = useGlobalStore();

onBeforeMount(() => {
  getUserDetails(localStorage.getItem("token"));
});
</script>

<template>
	<NavBarComponent />

	<router-view />
</template>