import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import LoginPage from '../../../src/pages/LoginPage.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { testPassword } from '../../helpers/testCredentials.js';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginPage },
      { path: '/', component: { template: '<div>Dashboard</div>' } },
      { path: '/register', component: { template: '<div>Register</div>' } },
    ],
  });
}

describe('LoginPage', () => {
  let pinia;
  let router;
  let pwd;

  beforeEach(async () => {
    pwd = testPassword();
    pinia = createPinia();
    setActivePinia(pinia);
    router = createTestRouter();
    router.push('/login');
    await router.isReady();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  function mountLoginPage() {
    return mount(LoginPage, {
      global: {
        plugins: [pinia, router],
      },
    });
  }

  it('renders username and password fields', () => {
    const wrapper = mountLoginPage();
    expect(wrapper.find('#username').exists()).toBe(true);
    expect(wrapper.find('#password').exists()).toBe(true);
  });

  it('calls authStore.login() with correct values on submit', async () => {
    const wrapper = mountLoginPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'login').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#password').setValue(pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: pwd,
    });
  });

  it('displays error message when login fails', async () => {
    const wrapper = mountLoginPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'login').mockRejectedValue(new Error('Invalid credentials'));

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#password').setValue('wrong');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.error').text()).toBe('Invalid credentials');
  });

  it('redirects to / after successful login', async () => {
    const wrapper = mountLoginPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'login').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#password').setValue(pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/');
  });

  it('has a link to /register', () => {
    const wrapper = mountLoginPage();
    const link = wrapper.find('a[href="/register"]');
    expect(link.exists()).toBe(true);
  });

  it('shows a success message when arriving from completed registration', async () => {
    await router.push({ path: '/login', query: { registered: '1' } });
    await router.isReady();

    const wrapper = mountLoginPage();

    expect(wrapper.text()).toContain('Registration completed successfully. You can now sign in.');
  });
});
