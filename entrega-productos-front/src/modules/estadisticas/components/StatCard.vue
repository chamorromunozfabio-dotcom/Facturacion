<script setup>
import { AlertTriangle } from '@lucide/vue'
import { formatearValor } from '../utils/estadisticas'

defineProps({
  clave: { type: String, required: true },
  etiqueta: { type: String, required: true },
  valor: { type: [Number, String], default: 0 },
  sufijo: { type: String, default: '' },
  formato: { type: String, default: 'numero' },
  alerta: { type: Boolean, default: false },
})
</script>

<template>
  <article
    class="stat-card"
    :class="{ 'stat-card--alerta': alerta }"
    data-test="stat-card"
    :data-estadistica="clave"
  >
    <div class="stat-card__top">
      <strong class="stat-card__valor">{{ formatearValor(valor, sufijo, formato) }}</strong>
      <span v-if="alerta" class="stat-card__badge" data-test="stat-alerta" title="Requiere atención">
        <AlertTriangle :size="14" aria-hidden="true" />
        <span>Atención</span>
      </span>
    </div>
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

.stat-card--alerta {
  border-color: #f59e0b;
  background: #fffbeb;
}

.stat-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.stat-card__valor {
  font-size: 1.6rem;
  color: #1d4ed8;
}

.stat-card--alerta .stat-card__valor {
  color: #b45309;
}

.stat-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  font-size: 0.72rem;
  font-weight: 700;
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
