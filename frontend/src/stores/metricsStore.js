import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApi } from '../composables/useApi.js';

async function doFetchMetrics(metrics, loading, year) {
  loading.value = true;
  try {
    const { request } = useApi();
    const data = await request('GET', `/api/metrics?year=${year}`);
    metrics.value = data;
  } finally {
    loading.value = false;
  }
}

async function doSetGoal(metrics, loading, { goal, year }) {
  const { request } = useApi();
  await request('POST', '/api/metrics/goal', { goal, year });
  await doFetchMetrics(metrics, loading, year);
}

export const useMetricsStore = defineStore('metrics', () => {
  const metrics = ref(null);
  const loading = ref(false);

  const fetchMetrics = (year) => doFetchMetrics(metrics, loading, year);

  const setGoal = (payload) => doSetGoal(metrics, loading, payload);

  return {
    metrics,
    loading,
    fetchMetrics,
    setGoal,
  };
});
