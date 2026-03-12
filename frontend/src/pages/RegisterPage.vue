<template>
  <div class="register-page min-h-screen bg-gray-950 flex items-center justify-center px-4">
    <div class="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold text-white mb-6 text-center">Register</h1>
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="successMessage"
          class="success mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200"
        >
          <p class="font-semibold">Registration successful.</p>
          <p>{{ successMessage }}</p>
        </div>
      </Transition>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-300 mb-1"
            >Username</label
          >
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-1"
            >Password</label
          >
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <p v-if="error" class="error text-red-400 text-sm mt-3 text-center">{{ error }}</p>
        <button
          type="submit"
          :disabled="isSubmitting || Boolean(successMessage)"
          class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition shadow-lg"
          :class="{ 'cursor-not-allowed opacity-70': isSubmitting || successMessage }"
        >
          {{
            successMessage ? 'Redirecting...' : isSubmitting ? 'Creating account...' : 'Register'
          }}
        </button>
      </form>
      <p class="mt-4 text-center text-gray-400 text-sm">
        Already have an account?
        <router-link to="/login" class="text-indigo-400 hover:text-indigo-300 transition"
          >Login</router-link
        >
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';

const username = ref('');
const password = ref('');
const error = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);
const router = useRouter();
const authStore = useAuthStore();
let redirectTimer;

onBeforeUnmount(() => {
  clearTimeout(redirectTimer);
});

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
  successMessage.value = '';
  if (!validate()) return;

  isSubmitting.value = true;

  try {
    await authStore.register({ username: username.value, password: password.value });
    successMessage.value = 'Your account is ready. Redirecting to login...';
    redirectTimer = setTimeout(() => {
      router.push({ path: '/login', query: { registered: '1' } });
    }, 1400);
  } catch (err) {
    error.value = err.message;
  } finally {
    isSubmitting.value = false;
  }
}
</script>
