<template>
  <div class="login-page min-h-screen bg-gray-950 flex items-center justify-center px-4">
    <div class="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold text-white mb-6 text-center">{{ t('auth.login') }}</h1>
      <Transition
        enter-active-class="transition duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="showRegisteredMessage"
          class="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-200"
        >
          {{ t('login.registerSuccess') }}
        </div>
      </Transition>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-300 mb-1">{{
            t('fields.username')
          }}</label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          />
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-300 mb-1">{{
            t('fields.secret')
          }}</label>
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
          class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition shadow-lg"
        >
          {{ t('auth.login') }}
        </button>
      </form>
      <p class="mt-4 text-center text-gray-400 text-sm">
        {{ t('login.noAccount') }}
        <router-link to="/register" class="text-indigo-400 hover:text-indigo-300 transition">{{
          t('auth.register')
        }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { useI18n } from '../composables/useI18n.js';

const username = ref('');
const password = ref('');
const error = ref('');
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { localizeError, t } = useI18n();
const showRegisteredMessage = computed(() => route.query.registered === '1');

async function handleSubmit() {
  error.value = '';
  try {
    await authStore.login({ username: username.value, password: password.value });
    router.push('/');
  } catch (err) {
    error.value = localizeError(err.message);
  }
}
</script>
