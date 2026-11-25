<script setup>
import { computed } from 'vue'
import { Check, Pause, Play, ShieldX } from '@lucide/vue'
import ModalBase from '../../../shared/ui/ModalBase.vue'
import StatusBadge from '../../../shared/ui/StatusBadge.vue'
import { useModalA11y } from '../../../shared/composables/useModalA11y'

/** Ficha completa de una empresa para validarla antes de aprobar, rechazar o suspender. */
const props = defineProps({
  open: { type: Boolean, default: false },
  empresa: { type: Object, default: null },
})

const emit = defineEmits(['close', 'aprobar', 'rechazar', 'suspender', 'reactivar'])

useModalA11y(computed(() => props.open), () => emit('close'))

function formatearFecha(value) {
  if (!value) return '—'
  const fecha = new Date(value)
  if (Number.isNaN(fecha.getTime())) return String(value)
  return fecha.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit' })
}
</script>

<template>
  <ModalBase
    :open="open"
    test-id="empresa-detalle-modal"
    label="Detalle de empresa"
    max-width="580px"
    @close="emit('close')"
  >
    <header class="modal__header">
      <div class="modal__title-group">
        <h2>{{ empresa?.razon_social || 'Detalle de empresa' }}</h2>
        <StatusBadge v-if="empresa?.estado" :estado="empresa.estado" />
      </div>
      <button type="button" class="modal__close" aria-label="Cerrar detalle" @click="emit('close')">
        ×
      </button>
    </header>

    <div v-if="empresa" class="modal__body">
      <dl class="detalle-grid">
        <div>
          <dt>NIT</dt>
          <dd>{{ empresa.nit || '—' }}</dd>
        </div>
        <div>
          <dt>Representante legal</dt>
          <dd>{{ empresa.representante || '—' }}</dd>
        </div>
        <div>
          <dt>Correo</dt>
          <dd>{{ empresa.correo || '—' }}</dd>
        </div>
        <div>
          <dt>Teléfono</dt>
          <dd>{{ empresa.telefono || '—' }}</dd>
        </div>
        <div class="detalle-grid__full">
          <dt>Dirección</dt>
          <dd>{{ empresa.direccion || '—' }}</dd>
        </div>
        <div>
          <dt>Fecha de registro</dt>
          <dd>{{ formatearFecha(empresa.fecha_registro) }}</dd>
        </div>
        <div>
          <dt>Actividad</dt>
          <dd>
            {{ empresa.total_bodegueros ?? 0 }} bodegueros ·
            {{ empresa.total_bodegas ?? 0 }} bodegas ·
            {{ empresa.total_facturas ?? 0 }} facturas
          </dd>
        </div>
      </dl>

      <div v-if="empresa.motivo_rechazo" class="rechazo-box" data-test="detalle-motivo-rechazo">
        <strong>Motivo de rechazo:</strong>
        <p>{{ empresa.motivo_rechazo }}</p>
      </div>

      <footer class="modal__footer">
        <button type="button" class="btn" @click="emit('close')">Cerrar</button>
        <button
          v-if="empresa.estado === 'pendiente'"
          type="button"
          class="btn btn--primary"
          data-test="detalle-aprobar"
          @click="emit('aprobar', empresa)"
        >
          <Check :size="14" aria-hidden="true" /><span>Aprobar</span>
        </button>
        <button
          v-if="empresa.estado === 'pendiente'"
          type="button"
          class="btn btn--danger"
          data-test="detalle-rechazar"
          @click="emit('rechazar', empresa)"
        >
          <ShieldX :size="14" aria-hidden="true" /><span>Rechazar</span>
        </button>
        <button
          v-if="empresa.estado === 'activa'"
          type="button"
          class="btn"
          data-test="detalle-suspender"
          @click="emit('suspender', empresa)"
        >
          <Pause :size="14" aria-hidden="true" /><span>Suspender</span>
        </button>
        <button
          v-if="empresa.estado === 'suspendida' || empresa.estado === 'rechazada'"
          type="button"
          class="btn btn--primary"
          data-test="detalle-reactivar"
          @click="emit('reactivar', empresa)"
        >
          <Play :size="14" aria-hidden="true" /><span>Reactivar</span>
        </button>
      </footer>
    </div>
  </ModalBase>
</template>

<style scoped>
.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}
.modal__title-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
h2 {
  margin: 0;
  font-size: 1.1rem;
}
.modal__close {
  border: 0;
  background: transparent;
  font-size: 1.6rem;
  cursor: pointer;
  color: #6b7280;
}
.modal__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detalle-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;
  margin: 0;
}
.detalle-grid__full {
  grid-column: 1 / -1;
}
dt {
  font-size: 0.78rem;
  color: #6b7280;
  font-weight: 600;
}
dd {
  margin: 2px 0 0;
  font-size: 0.92rem;
  color: #111827;
  word-break: break-word;
}
.rechazo-box {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px 12px;
  color: #991b1b;
  font-size: 0.88rem;
}
.rechazo-box p {
  margin: 4px 0 0;
}
.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}
.btn--primary {
  background: #0f766e;
  border-color: #0f766e;
  color: #fff;
}
.btn--danger {
  color: #b91c1c;
  border-color: #fca5a5;
}
@media (max-width: 520px) {
  .detalle-grid {
    grid-template-columns: 1fr;
  }
}
</style>
