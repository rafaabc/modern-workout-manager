import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { createRouter, createMemoryHistory } from 'vue-router';
import ChangePasswordPage from '../../../src/pages/ChangePasswordPage.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { testPassword } from '../../helpers/testCredentials.js';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/change-password', component: ChangePasswordPage },
      { path: '/login', component: { template: '<div>Login</div>' } },
    ],
  });
}

describe('ChangePasswordPage', () => {
  let pinia;
  let router;
  let pwd;
  let newPwd;

  beforeEach(async () => {
    pwd = testPassword();
    newPwd = testPassword();
    pinia = createPinia();
    setActivePinia(pinia);
    router = createTestRouter();
    router.push('/change-password');
    await router.isReady();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  function mountPage() {
    return mount(ChangePasswordPage, {
      global: { plugins: [pinia, router] },
    });
  }

  it('renders all four fields and submit button', () => {
    const wrapper = mountPage();
    expect(wrapper.find('#username').exists()).toBe(true);
    expect(wrapper.find('#current-password').exists()).toBe(true);
    expect(wrapper.find('#new-password').exists()).toBe(true);
    expect(wrapper.find('#confirm-new-password').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it('blocks submit when passwords do not match', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue('Different1x9');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.changePassword).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe('Passwords do not match');
  });

  it('blocks submit when new password is too short', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue('Short1');
    await wrapper.find('#confirm-new-password').setValue('Short1');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.changePassword).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe('Password must be at least 8 characters');
  });

  it('blocks submit when new password has no numbers', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue('abcdefgh');
    await wrapper.find('#confirm-new-password').setValue('abcdefgh');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.changePassword).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe('Password must contain letters and numbers');
  });

  it('calls authStore.changePassword with correct values on valid submit', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.changePassword).toHaveBeenCalledWith({
      username: 'testuser',
      currentPassword: pwd,
      newPassword: newPwd,
    });
  });

  it('shows success feedback then redirects to /login?passwordChanged=1', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.success').exists()).toBe(true);
    expect(router.currentRoute.value.path).toBe('/change-password');

    vi.advanceTimersByTime(1400);
    await flushPromises();

    expect(router.currentRoute.value.path).toBe('/login');
    expect(router.currentRoute.value.query.passwordChanged).toBe('1');
  });

  it('shows localized error on API failure', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockRejectedValue(new Error('User not found'));

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.error').text()).toBe('User not found');
  });

  it('disables submit button while submitting', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    let resolveChange;
    vi.spyOn(authStore, 'changePassword').mockImplementation(
      () => new Promise((r) => { resolveChange = r; }),
    );

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();

    resolveChange();
    await flushPromises();
  });

  it('has a link to /login', () => {
    const wrapper = mountPage();
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true);
  });

  it('clears the pending redirect timer when unmounted', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    vi.spyOn(authStore, 'changePassword').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#current-password').setValue(pwd);
    await wrapper.find('#new-password').setValue(newPwd);
    await wrapper.find('#confirm-new-password').setValue(newPwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    wrapper.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
