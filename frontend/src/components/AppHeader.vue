<template>
  <header class="app-header bg-gray-900 border-b border-gray-700 shadow-lg">
    <div class="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
      <span
        class="app-name bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent font-bold text-xl"
        >Workout Manager</span
      >
      <nav v-if="authStore.isAuthenticated" aria-label="User menu" class="flex items-center gap-4">
        <span class="username text-gray-300">{{ authStore.user?.username || 'User' }}</span>
        <button class="text-gray-400 hover:text-white transition" @click="handleLogout">
          Logout
        </button>
      </nav>
      <nav v-else aria-label="Authentication" class="flex items-center gap-4">
        <router-link to="/login" class="text-gray-300 hover:text-white transition"
          >Login</router-link
        >
        <router-link to="/register" class="text-gray-300 hover:text-white transition"
          >Register</router-link
        >
      </nav>
    </div>
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
