import { useAuthStore } from '../stores/authStore.js';
import router from '../router/index.js';

async function request(method, path, body) {
  const authStore = useAuthStore();
  const headers = { 'Content-Type': 'application/json' };

  if (authStore.token) {
    headers['Authorization'] = `Bearer ${authStore.token}`;
  }

  const options = { method, headers };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(path, options);

  if (response.status === 401) {
    authStore.logout();
    router.push('/login');
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Request failed');
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function useApi() {
  return { request };
}
