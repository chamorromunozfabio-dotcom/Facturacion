<script setup>
import { computed } from 'vue'

const props = defineProps({
  estado: { type: String, required: true },
})

/** Una sola definición de color para listado y detalle de facturas. */
const clases = computed(() => `status-badge status-badge--${props.estado}`)
</script>

<template>
  <span :class="clases">
    <span class="status-badge__dot" aria-hidden="true"></span>
    <span>{{ estado }}</span>
  </span>
</template>

<style scoped>
.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  background: #e5e7eb;
  color: #374151;
  white-space: nowrap;
}

.status-badge__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.status-badge--creada {
  background: #f3f4f6;
  color: #4b5563;
}

.status-badge--entregada {
  background: #fef3c7;
  color: #92400e;
}

.status-badge--aceptada {
  background: #dcfce7;
  color: #166534;
}

.status-badge--rechazada {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge--cerrada {
  background: #dbeafe;
  color: #1e40af;
}
</style>
