import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router/index.js';
import { useAuthStore } from './stores/authStore.js';
import { useSessionTimeout } from './composables/useSessionTimeout.js';
import './assets/main.css';

const pinia = createPinia();
const app = createApp(App);
app.use(pinia);
app.use(router);

const authStore = useAuthStore(pinia);
useSessionTimeout(authStore, router);

app.mount('#app');
