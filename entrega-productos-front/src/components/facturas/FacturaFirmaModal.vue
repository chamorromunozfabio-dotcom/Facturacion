<script setup>
import { computed } from 'vue'
import SignaturePad from '../ui/SignaturePad.vue'
import { useModalA11y } from '../../composables/useModalA11y'

/** Diálogo para aceptar una factura dibujando la firma. */
const props = defineProps({
  open: { type: Boolean, default: false },
  factura: { type: Object, default: null },
  firma: { type: String, default: '' },
  error: { type: String, default: '' },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'update:firma', 'confirm'])
const { panelRef } = useModalA11y(computed(() => props.open), () => emit('close'))
</script>

<template>
  <Transition name="modal">
    <div v-if="open" data-test="firma-modal" class="modal">
      <div class="modal__backdrop" @click="emit('close')"></div>
      <div
        ref="panelRef"
        tabindex="-1"
        class="modal__panel modal__panel--small"
        role="dialog"
        aria-modal="true"
        aria-label="Aceptar con firma"
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
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; }
.modal__backdrop { position: absolute; inset: 0; background: rgb(17 24 39 / 50%); }
.modal__panel { position: relative; width: 100%; max-width: 860px; max-height: 92vh; overflow-y: auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgb(0 0 0 / 20%); }
.modal__panel--small { max-width: 560px; }
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

.modal-enter-active,
.modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active { transition: none; }
}
</style>
