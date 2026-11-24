<script setup>
/** Selector de empresa para los listados del admin (multiempresa). */
defineProps({
  modelValue: { type: [String, Number], default: '' },
  empresas: { type: Array, default: () => [] },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <label class="filter">
    Empresa
    <select
      :value="modelValue"
      data-test="empresa-filter"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">Todas</option>
      <option v-for="empresa in empresas" :key="empresa.value" :value="empresa.value">
        {{ empresa.label }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.filter {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.filter select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}
</style>
