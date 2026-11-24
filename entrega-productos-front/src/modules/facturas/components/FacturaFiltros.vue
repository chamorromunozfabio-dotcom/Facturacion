<script setup>
/** Filtro por estado del listado de facturas. */
defineProps({
  modelValue: { type: String, default: '' },
  options: { type: Array, default: () => [] },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <label class="estado-filter">
    Estado
    <select
      :value="modelValue"
      data-test="estado-filter"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">Todos</option>
      <option v-for="estado in options" :key="estado" :value="estado">{{ estado }}</option>
    </select>
  </label>
</template>

<style scoped>
.estado-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.9rem;
}

.estado-filter select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}
</style>
