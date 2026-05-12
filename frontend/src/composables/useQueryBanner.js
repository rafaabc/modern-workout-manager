import { ref, onBeforeUnmount } from 'vue';

export function useQueryBanner(route, router, queryKey, duration = 3000) {
  const show = ref(route.query[queryKey] === '1');
  let timer = null;

  function dismiss() {
    clearTimeout(timer);
    show.value = false;
    const q = { ...route.query };
    delete q[queryKey];
    router.replace({ query: q }).catch(() => {});
  }

  if (show.value) {
    timer = setTimeout(dismiss, duration);
  }

  onBeforeUnmount(() => clearTimeout(timer));

  return { show, dismiss };
}
