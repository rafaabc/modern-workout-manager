import { describe, it, expect } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createRouter, createMemoryHistory } from 'vue-router';
import App from '../../src/App.vue';

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: { template: '<div class="page-content">Login Page</div>' } },
      {
        path: '/register',
        component: { template: '<div class="page-content">Register Page</div>' },
      },
    ],
  });
}

describe('App', () => {
  it('renders routed pages through the global transition wrapper', async () => {
    const router = createTestRouter();
    await router.push('/login');
    await router.isReady();

    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          AppHeader: { template: '<header>Header</header>' },
        },
      },
    });

    expect(wrapper.text()).toContain('Login Page');

    await router.push('/register');
    await flushPromises();

    expect(wrapper.text()).toContain('Register Page');
    expect(wrapper.find('.page-content').exists()).toBe(true);
  });
});
