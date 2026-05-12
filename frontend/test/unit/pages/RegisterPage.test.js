import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import RegisterPage from '../../../src/pages/RegisterPage.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { createPageSetup } from '../../helpers/createPageSetup.js';

describe('RegisterPage', () => {
  const { ctx, setup, teardown, mountPage } = createPageSetup(RegisterPage, '/register', [
    { path: '/', component: { template: '<div>Dashboard</div>' } },
  ]);

  beforeEach(async () => {
    await setup();
  });

  afterEach(teardown);

  function mountRegisterPage() {
    return mountPage();
  }

  it('blocks submit when username is too short', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockResolvedValue();

    await wrapper.find('#username').setValue('ab');
    await wrapper.find('#password').setValue(ctx.pwd);
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
    await wrapper.find('#password').setValue(ctx.pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.register).toHaveBeenCalledWith({
      username: 'newuser',
      password: ctx.pwd,
    });
  });

  it('displays error message when registration fails', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockRejectedValue(new Error('Username already exists'));

    await wrapper.find('#username').setValue('existing');
    await wrapper.find('#password').setValue(ctx.pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.error').text()).toBe('Username already exists');
  });

  it('shows success feedback before redirecting to /login after successful registration', async () => {
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'register').mockResolvedValue({ id: 1, username: 'newuser' });

    await wrapper.find('#username').setValue('newuser');
    await wrapper.find('#password').setValue(ctx.pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

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
    const wrapper = mountRegisterPage();
    const authStore = useAuthStore();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    vi.spyOn(authStore, 'register').mockResolvedValue({ id: 1, username: 'newuser' });

    await wrapper.find('#username').setValue('newuser');
    await wrapper.find('#password').setValue(ctx.pwd);
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
