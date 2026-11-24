<script setup>
import { formatearValor } from '../utils/estadisticas'

defineProps({
  clave: { type: String, required: true },
  etiqueta: { type: String, required: true },
  valor: { type: [Number, String], default: 0 },
  sufijo: { type: String, default: '' },
})
</script>

<template>
  <article class="stat-card" data-test="stat-card" :data-estadistica="clave">
    <strong class="stat-card__valor">{{ formatearValor(valor, sufijo) }}</strong>
    <span class="stat-card__etiqueta">{{ etiqueta }}</span>
  </article>
</template>

<style scoped>
.stat-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  animation: stat-in 0.35s ease both;
}

.stat-card__valor {
  font-size: 1.6rem;
  color: #1d4ed8;
}

.stat-card__etiqueta {
  color: #6b7280;
  font-size: 0.85rem;
}

@keyframes stat-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .stat-card {
    animation: none;
  }
}
</style>
