import { describe, it, expect, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import LoginPage from '../../../src/pages/LoginPage.vue';
import { useAuthStore } from '../../../src/stores/authStore.js';
import { createPageSetup } from '../../helpers/createPageSetup.js';

describe('LoginPage', () => {
  const { ctx, mountPage } = createPageSetup(LoginPage, '/login', [
    { path: '/', component: { template: '<div>Dashboard</div>' } },
    { path: '/register', component: { template: '<div>Register</div>' } },
    { path: '/change-password', component: { template: '<div>ChangePassword</div>' } },
  ]);

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

  it('has a link to /change-password', () => {
    const wrapper = mountPage();
    expect(wrapper.find('a[href="/change-password"]').exists()).toBe(true);
  });

  it.each([
    ['registered',      'Registration completed successfully. You can now sign in.'],
    ['loggedOut',       'Logged out successfully'],
    ['passwordChanged', 'Password changed successfully. You can now sign in.'],
  ])('shows %s message on arrival', async (queryKey, message) => {
    const wrapper = await mountWithQuery(queryKey);
    expect(wrapper.text()).toContain(message);
  });

  it.each([
    ['registered',      'Registration completed successfully. You can now sign in.', 'Fechar mensagem de registro'],
    ['loggedOut',       'Logged out successfully',                                    'Fechar mensagem de logout'],
    ['passwordChanged', 'Password changed successfully. You can now sign in.',        'Fechar mensagem de senha alterada'],
  ])('%s message can be dismissed with close button', async (queryKey, message, ariaLabel) => {
    const wrapper = await mountWithQuery(queryKey);
    const closeBtn = wrapper.find(`button[aria-label="${ariaLabel}"]`);
    expect(closeBtn.exists()).toBe(true);
    await closeBtn.trigger('click');
    await flushPromises();
    expect(wrapper.text()).not.toContain(message);
  });

  it.each([
    ['registered',      'Registration completed successfully. You can now sign in.'],
    ['loggedOut',       'Logged out successfully'],
    ['passwordChanged', 'Password changed successfully. You can now sign in.'],
  ])('%s message is removed after timeout and query param cleared', async (queryKey, message) => {
    const wrapper = await mountWithQuery(queryKey);
    expect(wrapper.text()).toContain(message);
    vi.advanceTimersByTime(3000);
    await flushPromises();
    expect(wrapper.text()).not.toContain(message);
    expect(ctx.router.currentRoute.value.query[queryKey]).toBeUndefined();
  });
});
