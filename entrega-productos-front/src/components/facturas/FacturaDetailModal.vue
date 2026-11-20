<script setup>
import { computed } from 'vue'
import FacturaDetail from './FacturaDetail.vue'
import { useModalA11y } from '../../composables/useModalA11y'

/** Diálogo de solo lectura con el detalle de una factura. */
const props = defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  factura: { type: Object, default: null },
})
const emit = defineEmits(['close'])
const { panelRef } = useModalA11y(computed(() => props.open), () => emit('close'))
</script>

<template>
  <Transition name="modal">
    <div v-if="open" data-test="detail-modal" class="modal">
      <div class="modal__backdrop" @click="emit('close')"></div>
      <div
        ref="panelRef"
        tabindex="-1"
        class="modal__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle de factura"
      >
        <header class="modal__header">
          <h2>Detalle de factura</h2>
          <button
            data-test="detail-close"
            type="button"
            class="modal__close"
            aria-label="Cerrar detalle"
            @click="emit('close')"
          >×</button>
        </header>
        <div class="modal__body">
          <p v-if="loading">Cargando detalle...</p>
          <FacturaDetail v-else-if="factura" :factura="factura" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; }
.modal__backdrop { position: absolute; inset: 0; background: rgb(17 24 39 / 50%); }
.modal__panel { position: relative; width: 100%; max-width: 860px; max-height: 92vh; overflow-y: auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgb(0 0 0 / 20%); }
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
h2 { margin: 0; font-size: 1.1rem; }
.modal__close { border: 0; background: transparent; font-size: 1.6rem; cursor: pointer; color: #6b7280; }
.modal__body { padding: 20px; }
p { margin: 4px 0 0; color: #6b7280; font-size: 0.9rem; }

.modal-enter-active,
.modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active { transition: none; }
}
</style>
