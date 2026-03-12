import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import RegisterPage from '../../../src/pages/RegisterPage.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { testPassword } from '../../helpers/testCredentials.js';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: RegisterPage },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/', component: { template: '<div>Dashboard</div>' } },
    ],
  });
}

describe('RegisterPage', () => {
  let pinia;
  let router;
  let pwd;

  beforeEach(async () => {
    pwd = testPassword();
    pinia = createPinia();
    setActivePinia(pinia);
    router = createTestRouter();
    router.push('/register');
    await router.isReady();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  function mountRegisterPage() {
    return mount(RegisterPage, {
      global: {
        plugins: [pinia, router],
      },
    });
  }

  it('blocks submit when username is too short', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockResolvedValue();

    await wrapper.find('#username').setValue('ab');
    await wrapper.find('#password').setValue(pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.register).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe('Username must be at least 3 characters');
  });

  it('blocks submit when password is too short', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#password').setValue('pass1');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.register).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe('Password must be at least 8 characters');
  });

  it('blocks submit when password has no numbers', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#password').setValue('abcdefgh');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.register).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe('Password must contain letters and numbers');
  });

  it('calls authStore.register() with correct values on valid submit', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockResolvedValue({ id: 1, username: 'newuser' });

    await wrapper.find('#username').setValue('newuser');
    await wrapper.find('#password').setValue(pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.register).toHaveBeenCalledWith({
      username: 'newuser',
      password: pwd,
    });
  });

  it('displays error message when registration fails', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockRejectedValue(new Error('Username already exists'));

    await wrapper.find('#username').setValue('existing');
    await wrapper.find('#password').setValue(pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.error').text()).toBe('Username already exists');
  });

  it('shows success feedback before redirecting to /login after successful registration', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockResolvedValue({ id: 1, username: 'newuser' });

    await wrapper.find('#username').setValue('newuser');
    await wrapper.find('#password').setValue(pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.success').text()).toContain('Registration successful.');
    expect(wrapper.find('button').text()).toBe('Redirecting...');
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    expect(router.currentRoute.value.path).toBe('/register');

    vi.advanceTimersByTime(1400);
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.registered).toBe('1');
  });

  it('clears the pending redirect timer when the page is unmounted', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    vi.spyOn(authStore, 'register').mockResolvedValue({ id: 1, username: 'newuser' });

    await wrapper.find('#username').setValue('newuser');
    await wrapper.find('#password').setValue(pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    wrapper.unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('has a link to /login', () => {
    const wrapper = mountRegisterPage();
    const link = wrapper.find('a[href="/login"]');
    expect(link.exists()).toBe(true);
  });
});
