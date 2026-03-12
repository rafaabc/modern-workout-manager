import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import AppHeader from '../../../src/components/AppHeader.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Dashboard</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/register', component: { template: '<div>Register</div>' } },
    ],
  });
}

describe('AppHeader', () => {
  let pinia;
  let router;

  beforeEach(async () => {
    pinia = createPinia();
    setActivePinia(pinia);
    router = createTestRouter();
    router.push('/');
    await router.isReady();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  function mountAppHeader() {
    return mount(AppHeader, {
      global: {
        plugins: [pinia, router],
      },
    });
  }

  it('displays username when authenticated', () => {
    const authStore = useAuthStore();
    authStore.token = 'some-token';
    authStore.user = { username: 'testuser' };

    const wrapper = mountAppHeader();
    expect(wrapper.find('.username').text()).toBe('testuser');
  });

  it('displays login and register links when not authenticated', () => {
    const wrapper = mountAppHeader();
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true);
    expect(wrapper.find('a[href="/register"]').exists()).toBe(true);
  });

  it('does not display login/register links when authenticated', () => {
    const authStore = useAuthStore();
    authStore.token = 'some-token';

    const wrapper = mountAppHeader();
    expect(wrapper.find('a[href="/login"]').exists()).toBe(false);
    expect(wrapper.find('a[href="/register"]').exists()).toBe(false);
  });

  it('calls authStore.logout() when logout button is clicked', async () => {
    const authStore = useAuthStore();
    authStore.token = 'some-token';
    authStore.user = { username: 'testuser' };
    vi.spyOn(authStore, 'logout').mockResolvedValue();

    const wrapper = mountAppHeader();
    await wrapper.find('.logout-button').trigger('click');

    expect(authStore.logout).toHaveBeenCalled();
  });

  it('displays app name', () => {
    const wrapper = mountAppHeader();
    expect(wrapper.find('.app-name').text()).toBe('Workout Manager');
  });

  it('renders a global language picker with PT-BR and EN-GB options', () => {
    const wrapper = mountAppHeader();
    const options = wrapper.findAll('.locale-option');

    expect(options).toHaveLength(2);
    expect(options[0].text()).toContain('Portuguese (Brazil)');
    expect(options[1].text()).toContain('British English');
  });
});
