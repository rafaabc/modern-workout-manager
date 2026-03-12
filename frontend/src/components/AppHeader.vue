<template>
  <header class="app-header bg-gray-900 border-b border-gray-700 shadow-lg">
    <div class="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
      <span
        class="app-name bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent font-bold text-xl"
        >{{ t('appName') }}</span
      >
      <div class="flex items-center gap-4">
        <section
          class="language-picker flex items-center gap-1 rounded-lg border border-gray-700 bg-gray-800 p-1"
          :aria-label="t('language.selectorLabel')"
        >
          <button
            v-for="option in languageOptions"
            :key="option.code"
            type="button"
            class="locale-option rounded-md px-2 py-1 text-xs font-medium transition"
            :class="
              currentLocale === option.code
                ? 'bg-indigo-700 text-white ring-2 ring-indigo-300'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            "
            @click="setLocale(option.code)"
          >
            <template v-if="flagSrc(option.code)">
              <img
                :src="flagSrc(option.code)"
                alt=""
                class="mr-1 inline h-5 w-auto"
                aria-hidden="true"
              />
            </template>
            <template v-else>
              <span
                class="mr-1 text-base"
                aria-hidden="true"
                style="
                  font-family:
                    'Segoe UI Emoji', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Symbol',
                    sans-serif;
                "
              >
                {{ option.flag }}
              </span>
            </template>
            <span class="sr-only">{{ t(option.labelKey) }}</span>
          </button>
        </section>
        <nav
          v-if="authStore.isAuthenticated"
          :aria-label="t('aria.userMenu')"
          class="flex items-center gap-4"
        >
          <span class="username text-gray-300">{{
            authStore.user?.username || t('userFallback')
          }}</span>
          <button
            class="logout-button text-gray-400 hover:text-white transition"
            @click="handleLogout"
          >
            {{ t('auth.logout') }}
          </button>
        </nav>
        <nav v-else :aria-label="t('aria.authentication')" class="flex items-center gap-4">
          <router-link to="/login" class="text-gray-300 hover:text-white transition">{{
            t('auth.login')
          }}</router-link>
          <router-link to="/register" class="text-gray-300 hover:text-white transition">{{
            t('auth.register')
          }}</router-link>
        </nav>
      </div>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { languageOptions, useI18n } from '../composables/useI18n.js';
import brFlag from '../assets/flags/br.svg';
import gbFlag from '../assets/flags/gb.svg';

const authStore = useAuthStore();
const router = useRouter();
const { currentLocale, setLocale, t } = useI18n();

function flagSrc(code) {
  if (code === 'pt-BR') return brFlag;
  if (code === 'en-GB') return gbFlag;
  return null;
}

async function handleLogout() {
  await authStore.logout();
  router.push({ path: '/login', query: { loggedOut: '1' } });
}
</script>
