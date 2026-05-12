import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import RegisterPage from '../../../src/pages/RegisterPage.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { createPageSetup } from '../../helpers/createPageSetup.js';
import { mountWithAuthSpy } from '../../helpers/mountWithAuthSpy.js';

describe('RegisterPage', () => {
  const { ctx, mountPage } = createPageSetup(RegisterPage, '/register', [
    { path: '/', component: { template: '<div>Dashboard</div>' } },
  ]);

  async function fillAndSubmit(wrapper, { username = 'testuser', password = ctx.pwd } = {}) {
    await wrapper.find('#username').setValue(username);
    await wrapper.find('#password').setValue(password);
    await wrapper.find('form').trigger('submit');
    await flushPromises();
  }

  it.each([
    ['username is too short',   { username: 'ab' },        'Username must be at least 3 characters'],
    ['password is too short',   { password: 'pass1' },     'Password must be at least 8 characters'],
    ['password has no numbers', { password: 'abcdefgh' },  'Password must contain letters and numbers'],
  ])('blocks submit when %s', async (_label, input, errorMsg) => {
    const { wrapper, authStore } = mountWithAuthSpy(mountPage, 'register');
    await fillAndSubmit(wrapper, input);
    expect(authStore.register).not.toHaveBeenCalled();
    expect(wrapper.find('.error').text()).toBe(errorMsg);
  });

  it('calls authStore.register() with correct values on valid submit', async () => {
    const { wrapper, authStore } = mountWithAuthSpy(mountPage, 'register');
    await fillAndSubmit(wrapper, { username: 'newuser' });
    expect(authStore.register).toHaveBeenCalledWith({
      username: 'newuser',
      password: ctx.pwd,
    });
  });

  it('displays error message when registration fails', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockRejectedValue(new Error('Username already exists'));
    await fillAndSubmit(wrapper, { username: 'existing' });
    expect(wrapper.find('.error').text()).toBe('Username already exists');
  });

  it('shows success feedback before redirecting to /login after successful registration', async () => {
    const { wrapper } = mountWithAuthSpy(mountPage, 'register');
    await fillAndSubmit(wrapper, { username: 'newuser' });

    expect(wrapper.find('.success').text()).toContain('Registration successful.');
    expect(wrapper.find('button').text()).toBe('Redirecting...');
    expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    expect(ctx.router.currentRoute.value.path).toBe('/register');

    vi.advanceTimersByTime(1400);
    await flushPromises();

    expect(ctx.router.currentRoute.value.path).toBe('/login');
    expect(ctx.router.currentRoute.value.query.registered).toBe('1');
  });

  it('clears the pending redirect timer when the page is unmounted', async () => {
    const { wrapper } = mountWithAuthSpy(mountPage, 'register');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    await fillAndSubmit(wrapper, { username: 'newuser' });
    wrapper.unmount();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('has a link to /login', () => {
    const wrapper = mountPage();
    expect(wrapper.find('a[href="/login"]').exists()).toBe(true);
  });
});
