import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const TOKEN_KEY = 'token';
const USERNAME_KEY = 'username';
const LAST_ACTIVITY_KEY = 'lastActivityAt';
const DEFAULT_INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000;

function readLastActivity() {
  const rawValue = localStorage.getItem(LAST_ACTIVITY_KEY);

  if (rawValue === null) {
    return null;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    return null;
  }

  return parsedValue;
}

function writeLastActivity(timestamp) {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp));
}

function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USERNAME_KEY);
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

function isSessionExpired(lastActivityAt, timeoutMs, now = Date.now()) {
  if (lastActivityAt == null) {
    return false;
  }

  return now - lastActivityAt >= timeoutMs;
}

function resolveTimeoutMs(value) {
  const timeoutMs = Number(value);

  if (Number.isFinite(timeoutMs) && timeoutMs > 0) {
    return timeoutMs;
  }

  return DEFAULT_INACTIVITY_TIMEOUT_MS;
}

function resolveBootstrapTimeoutMs() {
  return resolveTimeoutMs(import.meta.env.VITE_INACTIVITY_TIMEOUT_MS);
}

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
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USERNAME_KEY, username);
  writeLastActivity(Date.now());
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
  clearStoredSession();
}

export const useAuthStore = defineStore('auth', () => {
  const storedToken = localStorage.getItem(TOKEN_KEY);
  const lastActivityAt = readLastActivity();
  const timeoutMs = resolveBootstrapTimeoutMs();

  if (storedToken && isSessionExpired(lastActivityAt, timeoutMs)) {
    clearStoredSession();
  }

  const activeTokenAfterBootstrap = localStorage.getItem(TOKEN_KEY);
  const currentLastActivity = readLastActivity();

  if (activeTokenAfterBootstrap && currentLastActivity == null) {
    writeLastActivity(Date.now());
  }

  const token = ref(localStorage.getItem(TOKEN_KEY));
  const refreshedLastActivity = ref(readLastActivity());
  const savedUsername = localStorage.getItem(USERNAME_KEY);
  const user = ref(savedUsername ? { username: savedUsername } : null);

  const isAuthenticated = computed(() => !!token.value);

  const touchActivity = (timestamp = Date.now()) => {
    refreshedLastActivity.value = timestamp;
    writeLastActivity(timestamp);
  };

  const getIdleMs = (now = Date.now()) => {
    if (!refreshedLastActivity.value) {
      return 0;
    }

    return Math.max(now - refreshedLastActivity.value, 0);
  };

  const isInactiveSessionExpired = (timeout = timeoutMs, now = Date.now()) => {
    return isSessionExpired(refreshedLastActivity.value, resolveTimeoutMs(timeout), now);
  };

  const login = (credentials) => doLogin(token, user, credentials);
  const register = (credentials) => doRegister(credentials);
  const logout = () => doLogout(token, user);

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    touchActivity,
    getIdleMs,
    isInactiveSessionExpired,
    inactivityTimeoutMs: timeoutMs,
  };
});
