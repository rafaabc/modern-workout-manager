import { watch } from 'vue';

const DEFAULT_ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

export function useSessionTimeout(authStore, router) {
  let inactivityTimerId;

  const stopTimer = () => {
    if (inactivityTimerId) {
      clearTimeout(inactivityTimerId);
      inactivityTimerId = undefined;
    }
  };

  const forceLogoutForInactivity = async () => {
    if (!authStore.isAuthenticated) {
      return;
    }

    await authStore.logout();

    if (router.currentRoute.value.name !== 'login') {
      await router.push({ name: 'login' });
    }
  };

  const scheduleInactivityTimer = () => {
    stopTimer();

    if (!authStore.isAuthenticated) {
      return;
    }

    const remainingMs = authStore.inactivityTimeoutMs - authStore.getIdleMs();

    if (remainingMs <= 0) {
      void forceLogoutForInactivity();
      return;
    }

    inactivityTimerId = setTimeout(() => {
      void forceLogoutForInactivity();
    }, remainingMs);
  };

  const handleActivity = () => {
    if (!authStore.isAuthenticated) {
      return;
    }

    authStore.touchActivity();
    scheduleInactivityTimer();
  };

  DEFAULT_ACTIVITY_EVENTS.forEach((eventName) => {
    globalThis.addEventListener(eventName, handleActivity, { passive: true });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible' || !authStore.isAuthenticated) {
      return;
    }

    if (authStore.isInactiveSessionExpired()) {
      void forceLogoutForInactivity();
      return;
    }

    handleActivity();
  });

  watch(
    () => authStore.isAuthenticated,
    (authenticated) => {
      if (!authenticated) {
        stopTimer();
        return;
      }

      if (authStore.isInactiveSessionExpired()) {
        void forceLogoutForInactivity();
        return;
      }

      authStore.touchActivity();
      scheduleInactivityTimer();
    },
    { immediate: true },
  );
}
