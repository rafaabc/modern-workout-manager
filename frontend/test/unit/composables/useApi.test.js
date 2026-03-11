import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useApi } from '../../../src/composables/useApi.js';
import { useAuthStore } from '../../../src/stores/authStore.js';

vi.mock('../../../src/router/index.js', () => ({
  default: { push: vi.fn() },
}));

describe('useApi', () => {
  let authStore;

  beforeEach(() => {
    setActivePinia(createPinia());
    authStore = useAuthStore();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('injects Authorization header when token is present', async () => {
    authStore.token = 'my-token';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'ok' }),
    });

    const { request } = useApi();
    await request('GET', '/api/test');

    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer my-token',
      },
    });
  });

  it('does not inject Authorization header when token is absent', async () => {
    authStore.token = null;
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: 'ok' }),
    });

    const { request } = useApi();
    await request('GET', '/api/test');

    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  it('calls authStore.logout() and redirects on 401 response', async () => {
    const router = (await import('../../../src/router/index.js')).default;
    authStore.token = 'expired-token';
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });
    vi.spyOn(authStore, 'logout');

    const { request } = useApi();
    await expect(request('GET', '/api/protected')).rejects.toThrow('Unauthorized');

    expect(authStore.logout).toHaveBeenCalled();
    expect(router.push).toHaveBeenCalledWith('/login');
  });

  it('throws error with API message on non-401 error response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Bad request data' }),
    });

    const { request } = useApi();
    await expect(request('POST', '/api/data', { foo: 'bar' })).rejects.toThrow('Bad request data');
  });

  it('sends body as JSON for POST requests', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 1 }),
    });

    const { request } = useApi();
    await request('POST', '/api/items', { name: 'test' });

    expect(fetch).toHaveBeenCalledWith('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test' }),
    });
  });
});
