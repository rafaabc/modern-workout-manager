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

  it('allows access to /login when not authenticated', async () => {
    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/login');
  });

  it('allows access to /register when not authenticated', async () => {
    await router.push('/register');
    expect(router.currentRoute.value.path).toBe('/register');
  });

  it('redirects to / when accessing public route while authenticated', async () => {
    const authStore = useAuthStore();
    authStore.token = 'valid-token';

    await router.push('/login');
    expect(router.currentRoute.value.path).toBe('/');
  });

  it('allows access to / when authenticated', async () => {
    const authStore = useAuthStore();
    authStore.token = 'valid-token';

    await router.push('/');
    expect(router.currentRoute.value.path).toBe('/');
  });
});
