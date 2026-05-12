<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-300 mb-1">{{ label }}</label>
    <input
      :id="id"
      :type="type"
      :value="modelValue"
      :required="required"
      class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2.5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
      @input="$emit('update:modelValue', $event.target.value)"
    />
  </div>
</template>

<script setup>
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  modelValue: { type: String, default: '' },
  required: { type: Boolean, default: false },
});
defineEmits(['update:modelValue']);
</script>
