import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import LoginPage from '../../../src/pages/LoginPage.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { createPageSetup } from '../../helpers/createPageSetup.js';

describe('LoginPage', () => {
  const { ctx, setup, teardown, mountPage } = createPageSetup(LoginPage, '/login', [
    { path: '/', component: { template: '<div>Dashboard</div>' } },
    { path: '/register', component: { template: '<div>Register</div>' } },
    { path: '/change-password', component: { template: '<div>ChangePassword</div>' } },
  ]);

  beforeEach(async () => {
    await setup();
  });

  afterEach(teardown);

  async function mountWithQuery(queryKey) {
    await ctx.router.push({ path: '/login', query: { [queryKey]: '1' } });
    await ctx.router.isReady();
    return mountPage();
  }

  it('renders username and password fields', () => {
    const wrapper = mountPage();
    expect(wrapper.find('#username').exists()).toBe(true);
    expect(wrapper.find('#password').exists()).toBe(true);
  });

  it('calls authStore.login() with correct values on submit', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'login').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#password').setValue(ctx.pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(authStore.login).toHaveBeenCalledWith({
      username: 'testuser',
      password: ctx.pwd,
    });
  });

  it('displays error message when login fails', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'login').mockRejectedValue(new Error('Invalid credentials'));

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#password').setValue('wrong');
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(wrapper.find('.error').text()).toBe('Invalid credentials');
  });

  it('redirects to / after successful login', async () => {
    const wrapper = mountPage();
    const authStore = useAuthStore();
    vi.spyOn(authStore, 'login').mockResolvedValue();

    await wrapper.find('#username').setValue('testuser');
    await wrapper.find('#password').setValue(ctx.pwd);
    await wrapper.find('form').trigger('submit');
    await flushPromises();

    expect(ctx.router.currentRoute.value.path).toBe('/');
  });

  it('has a link to /register', () => {
    const wrapper = mountPage();
    expect(wrapper.find('a[href="/register"]').exists()).toBe(true);
  });

  it('shows a success message when arriving from completed registration', async () => {
    const wrapper = await mountWithQuery('registered');
    expect(wrapper.text()).toContain('Registration completed successfully. You can now sign in.');
  });

  it('shows a logout message when arriving from logout redirect', async () => {
    const wrapper = await mountWithQuery('loggedOut');
    expect(wrapper.text()).toContain('Logged out successfully');
  });

  it('registration message can be dismissed with close button', async () => {
    const wrapper = await mountWithQuery('registered');
    expect(wrapper.text()).toContain('Registration completed successfully. You can now sign in.');

    const closeBtn = wrapper.find('button[aria-label="Fechar mensagem de registro"]');
    expect(closeBtn.exists()).toBe(true);
    await closeBtn.trigger('click');
    await flushPromises();

    expect(wrapper.text()).not.toContain('Registration completed successfully. You can now sign in.');
  });

  it('registration message is removed after timeout and query param cleared', async () => {
    const wrapper = await mountWithQuery('registered');
    expect(wrapper.text()).toContain('Registration completed successfully. You can now sign in.');

    vi.advanceTimersByTime(3000);
    await flushPromises();

    expect(wrapper.text()).not.toContain('Registration completed successfully. You can now sign in.');
    expect(ctx.router.currentRoute.value.query.registered).toBeUndefined();
  });

  it('logout message can be dismissed with close button', async () => {
    const wrapper = await mountWithQuery('loggedOut');
    expect(wrapper.text()).toContain('Logged out successfully');

    const closeBtn = wrapper.find('button[aria-label="Fechar mensagem de logout"]');
    expect(closeBtn.exists()).toBe(true);
    await closeBtn.trigger('click');
    await flushPromises();

    expect(wrapper.text()).not.toContain('Logged out successfully');
  });

  it('logout message is removed after timeout and query param cleared', async () => {
    const wrapper = await mountWithQuery('loggedOut');
    expect(wrapper.text()).toContain('Logged out successfully');

    vi.advanceTimersByTime(3000);
    await flushPromises();

    expect(wrapper.text()).not.toContain('Logged out successfully');
    expect(ctx.router.currentRoute.value.query.loggedOut).toBeUndefined();
  });

  it('has a link to /change-password', () => {
    const wrapper = mountPage();
    expect(wrapper.find('a[href="/change-password"]').exists()).toBe(true);
  });

  it('shows password changed message when arriving with ?passwordChanged=1', async () => {
    const wrapper = await mountWithQuery('passwordChanged');
    expect(wrapper.text()).toContain('Password changed successfully. You can now sign in.');
  });

  it('password changed message can be dismissed with close button', async () => {
    const wrapper = await mountWithQuery('passwordChanged');
    const closeBtn = wrapper.find('button[aria-label="Fechar mensagem de senha alterada"]');
    expect(closeBtn.exists()).toBe(true);

    await closeBtn.trigger('click');
    await flushPromises();

    expect(wrapper.text()).not.toContain('Password changed successfully. You can now sign in.');
  });

  it('password changed message is removed after timeout and query param cleared', async () => {
    const wrapper = await mountWithQuery('passwordChanged');
    expect(wrapper.text()).toContain('Password changed successfully. You can now sign in.');

    vi.advanceTimersByTime(3000);
    await flushPromises();

    expect(wrapper.text()).not.toContain('Password changed successfully. You can now sign in.');
    expect(ctx.router.currentRoute.value.query.passwordChanged).toBeUndefined();
  });
});
