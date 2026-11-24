<script setup>
import { computed } from 'vue'
import SignaturePad from '../../../shared/ui/SignaturePad.vue'
import ModalBase from '../../../shared/ui/ModalBase.vue'
import { useModalA11y } from '../../../shared/composables/useModalA11y'

/** Diálogo para aceptar una factura dibujando la firma. */
const props = defineProps({
  open: { type: Boolean, default: false },
  factura: { type: Object, default: null },
  firma: { type: String, default: '' },
  error: { type: String, default: '' },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'update:firma', 'confirm'])
useModalA11y(computed(() => props.open), () => emit('close'))
</script>

<template>
  <ModalBase
    :open="open"
    test-id="firma-modal"
    label="Aceptar con firma"
    small
    @close="emit('close')"
  >
    <header class="modal__header">
      <h2>Aceptar {{ factura?.numero }}</h2>
      <button type="button" class="modal__close" aria-label="Cerrar firma" @click="emit('close')">×</button>
    </header>
    <div class="modal__body">
      <p>Firma con el mouse o el dedo para aceptar la recepción.</p>
      <SignaturePad
        :model-value="firma"
        @update:model-value="emit('update:firma', $event)"
      />
      <p v-if="error" data-test="firma-error" class="error">{{ error }}</p>
      <footer class="modal__footer">
        <button type="button" class="btn" @click="emit('close')">Cancelar</button>
        <button
          data-test="firma-confirm"
          type="button"
          class="btn btn--primary"
          :disabled="saving"
          @click="emit('confirm')"
        >
          {{ saving ? 'Guardando...' : 'Aceptar con firma' }}
        </button>
      </footer>
    </div>
  </ModalBase>
</template>

<style scoped>
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
h2 { margin: 0; font-size: 1.1rem; }
.modal__close { border: 0; background: transparent; font-size: 1.6rem; cursor: pointer; color: #6b7280; }
.modal__body { padding: 20px; }
.modal__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 18px; }
p { margin: 4px 0 0; color: #6b7280; font-size: 0.9rem; }
.error { color: #b91c1c; background: #fef2f2; border-radius: 6px; padding: 8px 10px; font-size: 0.9rem; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
.btn--primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
