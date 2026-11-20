<script setup>
import { Check } from '@lucide/vue'

/** Barra de cambios preparados y resumen final de permisos. */
defineProps({
  cambios: { type: Number, default: 0 },
  guardando: { type: Boolean, default: false },
  usuarioNombre: { type: String, default: '' },
  activos: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  resumen: { type: String, default: '' },
  tieneCambios: { type: Boolean, default: false },
})

defineEmits(['descartar', 'confirmar'])
</script>

<template>
  <Transition name="panel">
    <div v-if="tieneCambios" class="confirmar" data-test="confirmar-bar">
      <span class="confirmar__icono"><Check :size="18" aria-hidden="true" /></span>
      <div class="confirmar__texto">
        <strong>
          {{ cambios }}
          {{ cambios === 1 ? 'cambio listo' : 'cambios listos' }}
        </strong>
        <small>Revisalos y confirmá para aplicarlos a {{ usuarioNombre }}.</small>
      </div>
      <button
        type="button"
        class="btn btn--suave"
        :disabled="guardando"
        data-test="descartar-permisos"
        @click="$emit('descartar')"
      >
        Descartar
      </button>
      <button
        type="button"
        class="btn btn--primario"
        :disabled="guardando"
        data-test="confirmar-permisos"
        @click="$emit('confirmar')"
      >
        <Check :size="16" aria-hidden="true" />
        {{ guardando ? 'Guardando...' : 'Confirmar cambios' }}
      </button>
    </div>
  </Transition>

  <footer class="detalle__pie" data-test="permisos-actuales">
    <span>
      <strong>{{ activos }} de {{ total }} permisos activos:</strong>
      {{ resumen }}
    </span>
    <small v-if="tieneCambios" class="detalle__pie--pendiente">Cambios sin guardar</small>
    <small v-else>Todo guardado</small>
  </footer>
</template>

<style scoped>
.confirmar {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 18px;
  padding: 14px 16px;
  border: 1px solid #a5b4fc;
  border-radius: 14px;
  background: linear-gradient(120deg, #eef2ff, #f5f3ff);
  box-shadow: 0 6px 18px rgb(79 70 229 / 10%);
}

.confirmar__icono {
  display: grid;
  place-items: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #4f46e5;
  color: #fff;
}

.confirmar__texto {
  display: flex;
  flex-direction: column;
  flex: 1 1 220px;
}

.confirmar__texto strong {
  color: #3730a3;
  font-size: 0.92rem;
}

.confirmar__texto small {
  color: #6b7280;
  font-size: 0.8rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn--suave {
  border: 1px solid #c7d2fe;
  background: #fff;
  color: #4338ca;
  font-weight: 600;
}

.btn--suave:hover {
  background: #eef2ff;
}

.btn--primario {
  border: 1px solid #4f46e5;
  background: #4f46e5;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 4px 10px rgb(79 70 229 / 25%);
}

.btn--primario:hover:not(:disabled) {
  background: #4338ca;
  border-color: #4338ca;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.detalle__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
  padding: 13px 15px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.84rem;
  line-height: 1.5;
}

.detalle__pie small {
  color: #10b981;
  font-weight: 600;
  white-space: nowrap;
}

.detalle__pie--pendiente {
  color: #d97706 !important;
}

.panel-enter-active,
.panel-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 640px) {
  .detalle__pie small {
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel-enter-active,
  .panel-leave-active {
    transition: none;
  }
}
</style>
