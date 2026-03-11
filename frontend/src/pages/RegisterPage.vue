<template>
  <div class="register-page">
    <h1>Register</h1>
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
      <button type="submit">Register</button>
    </form>
    <p>Already have an account? <router-link to="/login">Login</router-link></p>
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

function validate() {
  if (username.value.length < 3) {
    error.value = 'Username must be at least 3 characters';
    return false;
  }
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters';
    return false;
  }
  if (!/[a-zA-Z]/.test(password.value) || !/\d/.test(password.value)) {
    error.value = 'Password must contain letters and numbers';
    return false;
  }
  return true;
}

async function handleSubmit() {
  error.value = '';
  if (!validate()) return;
  try {
    await authStore.register({ username: username.value, password: password.value });
    router.push('/login');
  } catch (err) {
    error.value = err.message;
  }
}
</script>
