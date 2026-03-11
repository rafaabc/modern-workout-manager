<template>
  <header class="app-header">
    <span class="app-name">Workout Manager</span>
    <nav v-if="authStore.isAuthenticated" aria-label="User menu">
      <span class="username">{{ authStore.user?.username || 'User' }}</span>
      <button @click="handleLogout">Logout</button>
    </nav>
    <nav v-else aria-label="Authentication">
      <router-link to="/login">Login</router-link>
      <router-link to="/register">Register</router-link>
    </nav>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';

const authStore = useAuthStore();
const router = useRouter();

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}
</script>
