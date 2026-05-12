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
        <div v-if="showRegisteredMessage || showLoggedOutMessage || showPasswordChangedMessage">
          <div
            v-if="showRegisteredMessage"
            class="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 relative"
          >
            <div class="text-center">{{ t('login.registerSuccess') }}</div>
            <button
              @click="closeRegistered"
              aria-label="Fechar mensagem de registro"
              class="absolute right-3 top-1.5 text-emerald-200 hover:text-white font-bold text-lg leading-none"
            >
              &times;
            </button>
          </div>
          <div
            v-if="showLoggedOutMessage"
            class="mb-4 rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-3 text-sm text-indigo-200 relative"
          >
            <div class="text-center">{{ t('auth.loggedOut') }}</div>
            <button
              @click="closeLoggedOut"
              aria-label="Fechar mensagem de logout"
              class="absolute right-3 top-1.5 text-indigo-200 hover:text-white font-bold text-lg leading-none"
            >
              &times;
            </button>
          </div>
          <div
            v-if="showPasswordChangedMessage"
            class="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 relative"
          >
            <div class="text-center">{{ t('login.passwordChanged') }}</div>
            <button
              @click="closePasswordChanged"
              aria-label="Fechar mensagem de senha alterada"
              class="absolute right-3 top-1.5 text-emerald-200 hover:text-white font-bold text-lg leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      </Transition>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <FormField id="username" :label="t('fields.username')" v-model="username" required />
        <FormField id="password" :label="t('fields.secret')" type="password" v-model="password" required />
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
      <p class="mt-2 text-center text-gray-400 text-sm">
        {{ t('login.forgotPassword') }}
        <router-link to="/change-password" class="text-indigo-400 hover:text-indigo-300 transition">{{
          t('login.changeIt')
        }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { useI18n } from '../composables/useI18n.js';
import { useQueryBanner } from '../composables/useQueryBanner.js';
import FormField from '../components/FormField.vue';

const username = ref('');
const password = ref('');
const error = ref('');
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const { localizeError, t } = useI18n();

const { show: showRegisteredMessage, dismiss: closeRegistered } = useQueryBanner(route, router, 'registered');
const { show: showLoggedOutMessage, dismiss: closeLoggedOut } = useQueryBanner(route, router, 'loggedOut');
const { show: showPasswordChangedMessage, dismiss: closePasswordChanged } = useQueryBanner(route, router, 'passwordChanged');

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
