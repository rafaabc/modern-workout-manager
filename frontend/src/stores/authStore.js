import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

async function doLogin(token, user, { username, password }) {
  const response = await fetch('/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Login failed');
  }

  const data = await response.json();
  token.value = data.token;
  user.value = { username };
  localStorage.setItem('token', data.token);
  localStorage.setItem('username', username);
}

async function doRegister({ username, password }) {
  const response = await fetch('/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Registration failed');
  }

  return response.json();
}

async function doLogout(token, user) {
  await fetch('/api/users/logout', { method: 'POST' }).catch(() => {});
  token.value = null;
  user.value = null;
  localStorage.removeItem('token');
  localStorage.removeItem('username');
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'));
  const savedUsername = localStorage.getItem('username');
  const user = ref(savedUsername ? { username: savedUsername } : null);

  const isAuthenticated = computed(() => !!token.value);

  const login = (credentials) => doLogin(token, user, credentials);
  const register = (credentials) => doRegister(credentials);
  const logout = () => doLogout(token, user);

  return { token, user, isAuthenticated, login, register, logout };
});
