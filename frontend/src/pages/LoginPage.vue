<template>
  <div class="login-page">
    <h1>Login</h1>
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="username">Username</label>
        <input id="username" v-model="username" type="text" required />
      </div>
      <div>
        <label for="password">Password</label>
        <input id="password" v-model="password" type="password" required />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit">Login</button>
    </form>
    <p>Don't have an account? <router-link to="/register">Register</router-link></p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();
const authStore = useAuthStore();

async function handleSubmit() {
  error.value = '';
  try {
    await authStore.login({ username: username.value, password: password.value });
    router.push('/');
  } catch (err) {
    error.value = err.message;
  }
}
</script>
