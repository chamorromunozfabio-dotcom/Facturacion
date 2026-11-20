<script setup>
import { computed } from 'vue'
import { useModalA11y } from '../../composables/useModalA11y'

/** Diálogo para rechazar una factura indicando el motivo. */
const props = defineProps({
  open: { type: Boolean, default: false },
  factura: { type: Object, default: null },
  motivo: { type: String, default: '' },
  error: { type: String, default: '' },
  saving: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'update:motivo', 'confirm'])
const { panelRef } = useModalA11y(computed(() => props.open), () => emit('close'))
</script>

<template>
  <Transition name="modal">
    <div v-if="open" data-test="rechazo-modal" class="modal">
      <div class="modal__backdrop" @click="emit('close')"></div>
      <div
        ref="panelRef"
        tabindex="-1"
        class="modal__panel modal__panel--small"
        role="dialog"
        aria-modal="true"
        aria-label="Rechazar factura"
      >
        <header class="modal__header">
          <h2>Rechazar {{ factura?.numero }}</h2>
          <button type="button" class="modal__close" aria-label="Cerrar rechazo" @click="emit('close')">×</button>
        </header>
        <div class="modal__body">
          <label>
            Motivo del rechazo
            <textarea
              :value="motivo"
              data-test="motivo"
              rows="3"
              @input="emit('update:motivo', $event.target.value)"
            ></textarea>
          </label>
          <p v-if="error" data-test="rechazo-error" class="error">{{ error }}</p>
          <footer class="modal__footer">
            <button type="button" class="btn" @click="emit('close')">Cancelar</button>
            <button
              data-test="rechazo-confirm"
              type="button"
              class="btn btn--danger"
              :disabled="saving"
              @click="emit('confirm')"
            >
              Rechazar
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
label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; font-weight: 600; color: #374151; }
textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; font: inherit; }
.error { color: #b91c1c; background: #fef2f2; border-radius: 6px; padding: 8px 10px; font-size: 0.9rem; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 8px; padding: 8px 12px; cursor: pointer; }
.btn--danger { color: #b91c1c; border-color: #fca5a5; }
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
