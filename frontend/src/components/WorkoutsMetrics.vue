<template>
  <div class="workouts-metrics">
    <h2>Métricas de Treinos</h2>

    <div v-if="loading" class="loading">Carregando...</div>

    <template v-else-if="metrics">
      <div class="total-year">
        <span>Total no ano: </span>
        <strong>{{ metrics.totalYear }}</strong>
      </div>

      <div class="goal-section">
        <span v-if="metrics.goal !== null">Meta anual: {{ metrics.goal }}</span>
        <span v-else class="no-goal">Nenhuma meta definida</span>
      </div>

      <div v-if="metrics.goalProgress !== null" class="progress-bar annual-progress">
        <div class="progress-fill" :style="{ width: metrics.goalProgress + '%' }"></div>
        <span class="progress-label">{{ metrics.goalProgress }}%</span>
      </div>

      <div class="months-list">
        <div v-for="entry in metrics.byMonth" :key="entry.month" class="month-entry">
          <span class="month-name">{{ monthNames[entry.month - 1] }}</span>
          <span class="month-count">{{ entry.count }}</span>
          <div v-if="metrics.goal !== null" class="progress-bar month-progress">
            <div class="progress-fill" :style="{ width: monthProgress(entry.count) + '%' }"></div>
            <span class="progress-label">{{ monthProgress(entry.count) }}%</span>
          </div>
        </div>
      </div>

      <form class="goal-form" @submit.prevent="handleSetGoal">
        <input
          v-model.number="goalInput"
          type="number"
          min="1"
          class="goal-input"
          placeholder="Meta anual"
        />
        <button type="submit" class="save-goal">Salvar meta</button>
        <span v-if="successMessage" class="success-message">{{ successMessage }}</span>
        <span v-if="errorMessage" class="error-message">{{ errorMessage }}</span>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useMetricsStore } from '../stores/metricsStore.js';

const metricsStore = useMetricsStore();
const { metrics, loading } = storeToRefs(metricsStore);

const goalInput = ref(null);
const successMessage = ref('');
const errorMessage = ref('');

const monthNames = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

function monthProgress(count) {
  if (metrics.value?.goal == null) return 0;
  return Math.min(Math.round((count / metrics.value.goal) * 100), 100);
}

async function handleSetGoal() {
  successMessage.value = '';
  errorMessage.value = '';
  try {
    const year = new Date().getFullYear();
    await metricsStore.setGoal({ goal: goalInput.value, year });
    successMessage.value = 'Meta salva com sucesso';
  } catch (err) {
    errorMessage.value = err.message || 'Erro ao salvar meta';
  }
}
</script>
