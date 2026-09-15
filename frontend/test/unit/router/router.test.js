import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { createMemoryHistory } from 'vue-router';
import { useAuthStore } from '../../../src/stores/authStore.js';

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router');
  return {
    ...actual,
    createWebHistory: () => createMemoryHistory(),
  };
});

let router;

describe('Router navigation guards', () => {
  beforeEach(async () => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.resetModules();
    const mod = await import('../../../src/router/index.js');
    router = mod.default;
  });

  it('redirects to /login when accessing protected route without auth', async () => {
    await router.push('/');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it.each(['/login', '/register'])('allows access to %s when not authenticated', async (path) => {
    await router.push(path);
    expect(router.currentRoute.value.path).toBe(path);
  });

  it('redirects to /login when accessing /change-password without auth', async () => {
    await router.push('/change-password');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it.each(['/', '/change-password'])('allows access to %s when authenticated', async (path) => {
    const authStore = useAuthStore();
    authStore.token = 'valid-token';

    await router.push(path);
    expect(router.currentRoute.value.path).toBe(path);
  });

  it('redirects to / when accessing /login while authenticated', async () => {
    const authStore = useAuthStore();
    authStore.token = 'valid-token';

    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/');
  });
});
