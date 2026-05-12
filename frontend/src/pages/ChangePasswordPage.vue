<template>
  <div class="change-password-page min-h-screen bg-gray-950 flex items-center justify-center px-4">
    <div class="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8 w-full max-w-md">
      <h1 class="text-2xl font-bold text-white mb-6 text-center">{{ t('changePassword.title') }}</h1>
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
          <p>{{ successMessage }}</p>
        </div>
      </Transition>
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <FormField id="username" :label="t('fields.username')" v-model="username" required />
        <FormField id="new-password" :label="t('fields.newPassword')" type="password" v-model="newPassword" required />
        <FormField id="confirm-new-password" :label="t('fields.confirmNewPassword')" type="password" v-model="confirmNewPassword" required />
        <p v-if="error" class="error text-red-400 text-sm mt-3 text-center">{{ error }}</p>
        <button
          type="submit"
          :disabled="isSubmitting || Boolean(successMessage)"
          class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition shadow-lg"
          :class="{ 'cursor-not-allowed opacity-70': isSubmitting || successMessage }"
        >
          {{
            successMessage
              ? t('changePassword.redirecting')
              : isSubmitting
                ? t('changePassword.changingPassword')
                : t('changePassword.submit')
          }}
        </button>
      </form>
      <p class="mt-4 text-center text-gray-400 text-sm">
        <router-link to="/login" class="text-indigo-400 hover:text-indigo-300 transition">{{
          t('changePassword.backToLogin')
        }}</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore.js';
import { useI18n } from '../composables/useI18n.js';
import FormField from '../components/FormField.vue';

const username = ref('');
const newPassword = ref('');
const confirmNewPassword = ref('');
const error = ref('');
const successMessage = ref('');
const isSubmitting = ref(false);
const router = useRouter();
const authStore = useAuthStore();
const { localizeError, t } = useI18n();
let redirectTimer;

onBeforeUnmount(() => {
  clearTimeout(redirectTimer);
});

function validate() {
  if (newPassword.value.length < 8) {
    error.value = t('validation.secretMin');
    return false;
  }
  if (!/[a-zA-Z]/.test(newPassword.value) || !/\d/.test(newPassword.value)) {
    error.value = t('validation.secretLettersNumbers');
    return false;
  }
  if (newPassword.value !== confirmNewPassword.value) {
    error.value = t('validation.passwordsDoNotMatch');
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
    await authStore.changePassword({
      username: username.value,
      newPassword: newPassword.value,
    });
    successMessage.value = t('changePassword.successRedirect');
    redirectTimer = setTimeout(() => {
      router.push({ path: '/login', query: { passwordChanged: '1' } });
    }, 1400);
  } catch (err) {
    error.value = localizeError(err.message);
  } finally {
    isSubmitting.value = false;
  }
}
</script>
