import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import ChangePasswordPage from '../../../src/pages/ChangePasswordPage.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { testPassword } from '../../helpers/testCredentials.js';
import { createPageSetup } from '../../helpers/createPageSetup.js';
import { mountWithAuthSpy } from '../../helpers/mountWithAuthSpy.js';

describe('ChangePasswordPage', () => {
  const { ctx, mountPage } = createPageSetup(ChangePasswordPage, '/change-password');
  let newPwd;

  beforeEach(() => {
    newPwd = testPassword();
  });

  async function fillAndSubmit(wrapper, { newPassword = newPwd, confirmPassword = newPwd } = {}) {
    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#new-password').setValue(newPassword);
    await wrapper.find('#confirm-new-password').setValue(confirmPassword);
    await wrapper.find('form').trigger('submit');
    await flushPromises();
  }

  it('renders three fields and submit button', () => {
    const wrapper = mountPage();
    expect(wrapper.find('#username').exists()).toBe(true);
    expect(wrapper.find('#current-password').exists()).toBe(false);
    expect(wrapper.find('#new-password').exists()).toBe(true);
    expect(wrapper.find('#confirm-new-password').exists()).toBe(true);
    expect(wrapper.find('button[type="submit"]').exists()).toBe(true);
  });

  it.each([
    ['passwords do not match',      () => ({ confirmPassword: 'Different1x9' }),                      'Passwords do not match'],
    ['new password is too short',   () => ({ newPassword: 'Short1', confirmPassword: 'Short1' }),      'Password must be at least 8 characters'],
    ['new password has no numbers', () => ({ newPassword: 'abcdefgh', confirmPassword: 'abcdefgh' }), 'Password must contain letters and numbers'],
  ])('blocks submit when %s', async (_label, getInput, errorMsg) => {
    const { wrapper, authStore } = mountWithAuthSpy(mountPage, 'changePassword');
    await fillAndSubmit(wrapper, getInput());
    expect(authStore.changePassword).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe(errorMsg);
  });

  it('calls authStore.changePassword with correct values on valid submit', async () => {
    const { wrapper, authStore } = mountWithAuthSpy(mountPage, 'changePassword');
    await fillAndSubmit(wrapper);
    expect(authStore.changePassword).toHaveBeenCalledWith({
      username: 'testuser',
      newPassword: newPwd,
    });
  });

  it('shows success feedback then redirects to /login?passwordChanged=1', async () => {
    const { wrapper } = mountWithAuthSpy(mountPage, 'changePassword');
    await fillAndSubmit(wrapper);
    expect(wrapper.find('.success').exists()).toBe(true);
    expect(ctx.router.currentRoute.value.path).toBe('/change-password');
    vi.advanceTimersByTime(1400);
    await flushPromises();
    expect(ctx.router.currentRoute.value.path).toBe('/login');
    expect(ctx.router.currentRoute.value.query.passwordChanged).toBe('1');
  });

  it('shows localized error on API failure', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'changePassword').mockRejectedValue(new Error('User not found'));
    await fillAndSubmit(wrapper);
    expect(wrapper.find('.error').text()).toBe('User not found');
  });

  it('disables submit button while submitting', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    let resolveChange;
    vi.spyOn(authStore, 'changePassword').mockImplementation(
      () => new Promise((r) => { resolveChange = r; }),
    );
    await fillAndSubmit(wrapper);
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
    await fillAndSubmit(wrapper);
    wrapper.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
