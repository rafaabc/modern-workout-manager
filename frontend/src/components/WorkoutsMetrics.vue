<template>
  <div class="workouts-metrics bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-6">
    <h2 class="text-lg font-bold text-white mb-6">{{ t('metrics.title') }}</h2>

    <div v-if="loading && !metrics" class="loading flex justify-center py-8">
      <svg
        class="animate-spin h-8 w-8 text-indigo-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="4"
        ></circle>
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        ></path>
      </svg>
    </div>

    <template v-else-if="metrics">
      <form class="goal-form border-b border-gray-700 mb-6 pb-4" @submit.prevent="handleSetGoal">
        <label for="goal-input" class="text-gray-300 text-sm font-medium mb-2 block">{{
          t('metrics.setAnnualGoal')
        }}</label>
        <div class="flex gap-2">
          <input
            id="goal-input"
            v-model.number="goalInput"
            type="number"
            min="1"
            class="goal-input flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :placeholder="t('metrics.annualGoalPlaceholder')"
          />
          <button
            type="submit"
            class="save-goal bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            {{ t('metrics.saveGoal') }}
          </button>
        </div>
        <span v-if="successMessage" class="success-message text-green-400 text-xs mt-2 block">{{
          successMessage
        }}</span>
        <span v-if="errorMessage" class="error-message text-red-400 text-xs mt-2 block">{{
          errorMessage
        }}</span>
      </form>

      <div class="total-year mb-4">
        <span class="text-gray-400 text-sm">{{ t('metrics.totalThisYear') }}</span>
        <div>
          <strong class="text-4xl font-bold text-white">{{ metrics.totalYear }}</strong>
        </div>
      </div>

      <div class="goal-section mb-4">
        <span v-if="metrics.goal !== null" class="text-gray-300 text-sm">{{
          t('metrics.annualGoal', { goal: metrics.goal })
        }}</span>
        <span v-else class="no-goal text-gray-400 text-sm">{{ t('metrics.noGoalSet') }}</span>
      </div>

      <div v-if="metrics.goalProgress !== null" class="annual-progress mb-6">
        <div class="progress-bar w-full bg-gray-700 rounded-full h-3 mb-1 relative overflow-hidden">
          <div
            class="progress-fill bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            :style="{ width: Math.min(metrics.goalProgress, 100) + '%' }"
          ></div>
          <div
            v-if="metrics.goalProgress > 100"
            class="overflow-fill absolute inset-0 bg-amber-400 h-3 rounded-full transition-all duration-500 opacity-70"
            :style="{ width: Math.min(metrics.goalProgress, 200) - 100 + '%' }"
          ></div>
        </div>
        <span
          class="progress-label text-sm font-medium"
          :class="metrics.goalProgress > 100 ? 'text-amber-400' : 'text-indigo-400'"
          >{{ metrics.goalProgress }}%</span
        >
      </div>

      <div class="months-list mb-4">
        <div
          v-for="entry in metrics.byMonth"
          :key="entry.month"
          class="month-entry flex items-center gap-3 py-2 border-b border-gray-700 last:border-0"
        >
          <span class="month-name text-gray-300 text-sm w-24">{{ monthName(entry.month) }}</span>
          <span class="month-count text-white font-medium text-sm w-6 text-right">{{
            entry.count
          }}</span>
          <div
            v-if="metrics.goal !== null"
            class="month-progress flex-1 bg-gray-700 rounded-full h-1.5 relative overflow-hidden"
          >
            <div
              class="progress-fill bg-indigo-400 h-1.5 rounded-full transition-all duration-300"
              :style="{ width: Math.min(monthProgress(entry.count), 100) + '%' }"
            ></div>
            <div
              v-if="monthProgress(entry.count) > 100"
              class="overflow-fill absolute inset-0 bg-amber-400 h-1.5 rounded-full transition-all duration-300 opacity-70"
              :style="{ width: Math.min(monthProgress(entry.count), 200) - 100 + '%' }"
            ></div>
          </div>
          <span
            v-if="metrics.goal !== null"
            class="progress-label text-xs w-10 text-right shrink-0"
            :class="
              monthProgress(entry.count) > 100 ? 'text-amber-400 font-medium' : 'text-gray-400'
            "
            >{{ monthProgress(entry.count) }}%</span
          >
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMetricsStore } from '../stores/metricsStore.js';
import { useI18n } from '../composables/useI18n.js';

const metricsStore = useMetricsStore();
const { metrics, loading } = storeToRefs(metricsStore);
const { localizeError, monthName, t } = useI18n();

const goalInput = ref(null);
const successMessage = ref('');
const errorMessage = ref('');

function monthProgress(count) {
  if (metrics.value?.goal == null) return 0;
  const monthlyTarget = metrics.value.goal / 12;
  if (monthlyTarget === 0) return 0;
  return Math.round((count / monthlyTarget) * 100);
}

async function handleSetGoal() {
  successMessage.value = '';
  errorMessage.value = '';
  try {
    const year = new Date().getFullYear();
    await metricsStore.setGoal({ goal: goalInput.value, year });
    successMessage.value = t('metrics.goalSaved');
    setTimeout(() => {
      successMessage.value = '';
    }, 3000);
  } catch (err) {
    errorMessage.value = localizeError(err.message) || t('metrics.goalSaveFailed');
    setTimeout(() => {
      errorMessage.value = '';
    }, 3000);
  }
}
</script>
