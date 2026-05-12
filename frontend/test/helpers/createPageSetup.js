import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import { mount } from '@vue/test-utils';
import { vi } from 'vitest';
import { testPassword } from './testCredentials.js';

export function createPageSetup(PageComponent, pagePath, extraRoutes = []) {
  const ctx = { pwd: null, pinia: null, router: null };

  async function setup() {
    ctx.pwd = testPassword();
    ctx.pinia = createPinia();
    setActivePinia(ctx.pinia);
    ctx.router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: pagePath, component: PageComponent },
        ...(pagePath !== '/login' ? [{ path: '/login', component: { template: '<div>Login</div>' } }] : []),
        ...extraRoutes,
      ],
    });
    ctx.router.push(pagePath);
    await ctx.router.isReady();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  }

  function teardown() {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  }

  function mountPage() {
    return mount(PageComponent, { global: { plugins: [ctx.pinia, ctx.router] } });
  }

  return { ctx, setup, teardown, mountPage };
}
