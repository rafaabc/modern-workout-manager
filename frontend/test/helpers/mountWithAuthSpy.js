import { vi } from 'vitest';
import { useAuthStore } from '../../src/stores/authStore.js';

export function mountWithAuthSpy(mountPage, method) {
  const wrapper = mountPage();
  const authStore = useAuthStore();
  vi.spyOn(authStore, method).mockResolvedValue();
  return { wrapper, authStore };
}
