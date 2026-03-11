import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { testPassword } from '../../helpers/testCredentials.js';

describe('authStore', () => {
  let pwd;

  beforeEach(() => {
    pwd = testPassword();
    setActivePinia(createPinia());
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('initializes with token from localStorage if present', () => {
      localStorage.setItem('token', 'stored-token');
      localStorage.setItem('username', 'storeduser');
      setActivePinia(createPinia());
      const store = useAuthStore();
      expect(store.token).toBe('stored-token');
      expect(store.user).toEqual({ username: 'storeduser' });
      expect(store.isAuthenticated).toBe(true);
    });

    it('initializes with null token when localStorage is empty', () => {
      const store = useAuthStore();
      expect(store.token).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when token is present', () => {
      const store = useAuthStore();
      store.token = 'some-token';
      expect(store.isAuthenticated).toBe(true);
    });

    it('returns false when token is null', () => {
      const store = useAuthStore();
      store.token = null;
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('login', () => {
    it('saves token in state and localStorage on success', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'jwt-token-123' }),
      });

      const store = useAuthStore();
      await store.login({ username: 'testuser', password: pwd });

      expect(store.token).toBe('jwt-token-123');
      expect(store.user).toEqual({ username: 'testuser' });
      expect(localStorage.getItem('token')).toBe('jwt-token-123');
      expect(localStorage.getItem('username')).toBe('testuser');
      expect(store.isAuthenticated).toBe(true);
      expect(fetch).toHaveBeenCalledWith('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: pwd }),
      });
    });

    it('throws error and does not change state on API error', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      });

      const store = useAuthStore();
      await expect(store.login({ username: 'bad', password: pwd })).rejects.toThrow(
        'Invalid credentials',
      );

      expect(store.token).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('calls register endpoint with correct data', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ id: 1, username: 'newuser' }),
      });

      const store = useAuthStore();
      const result = await store.register({ username: 'newuser', password: pwd });

      expect(result).toEqual({ id: 1, username: 'newuser' });
      expect(fetch).toHaveBeenCalledWith('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'newuser', password: pwd }),
      });
    });

    it('throws error on registration failure', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Username already exists' }),
      });

      const store = useAuthStore();
      await expect(store.register({ username: 'existing', password: pwd })).rejects.toThrow(
        'Username already exists',
      );
    });
  });

  describe('logout', () => {
    it('clears state and localStorage', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true });

      const store = useAuthStore();
      store.token = 'some-token';
      store.user = { username: 'testuser' };
      localStorage.setItem('token', 'some-token');
      localStorage.setItem('username', 'testuser');

      await store.logout();

      expect(store.token).toBeNull();
      expect(store.user).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('username')).toBeNull();
      expect(store.isAuthenticated).toBe(false);
    });
  });
});
