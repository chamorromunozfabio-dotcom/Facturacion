<script setup>
import { computed } from 'vue'
import FacturaDetail from './FacturaDetail.vue'
import ModalBase from '../../../shared/ui/ModalBase.vue'
import { useModalA11y } from '../../../shared/composables/useModalA11y'

/** Diálogo de solo lectura con el detalle de una factura. */
const props = defineProps({
  open: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  factura: { type: Object, default: null },
})
const emit = defineEmits(['close'])
useModalA11y(computed(() => props.open), () => emit('close'))
</script>

<template>
  <ModalBase
    :open="open"
    test-id="detail-modal"
    label="Detalle de factura"
    @close="emit('close')"
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
  </ModalBase>
</template>

<style scoped>
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
h2 { margin: 0; font-size: 1.1rem; }
.modal__close { border: 0; background: transparent; font-size: 1.6rem; cursor: pointer; color: #6b7280; }
.modal__body { padding: 20px; }
p { margin: 4px 0 0; color: #6b7280; font-size: 0.9rem; }
</style>
