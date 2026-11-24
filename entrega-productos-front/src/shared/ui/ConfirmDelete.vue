<script setup>
import { computed } from 'vue'
import ModalBase from './ModalBase.vue'
import BotonBase from './BotonBase.vue'
import { useModalA11y } from '../composables/useModalA11y'

/**
 * Confirmación antes de eliminar. Es solo visual: el padre decide qué borrar.
 * Escucha confirm y cancel.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar eliminación' },
  message: { type: String, default: '¿Estás seguro de eliminar este registro?' },
  itemLabel: { type: String, default: '' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
useModalA11y(computed(() => props.open), () => emit('cancel'))
</script>

<template>
  <ModalBase
    :open="open"
    test-id="confirm-delete"
    :label="title"
    role="alertdialog"
    max-width="400px"
    @close="emit('cancel')"
  >
    <div class="confirm__contenido">
      <div class="confirm__icon">!</div>

      <h2>{{ title }}</h2>
      <p class="confirm__message">{{ message }}</p>

      <p v-if="itemLabel" data-test="item" class="confirm__item">{{ itemLabel }}</p>

      <footer class="confirm__footer">
        <BotonBase data-test="cancel" type="button" class="btn" @click="emit('cancel')">
          Cancelar
        </BotonBase>
        <BotonBase
          data-test="confirm"
          type="button"
          class="btn btn--danger"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? 'Eliminando...' : 'Eliminar' }}
        </BotonBase>
      </footer>
    </div>
  </ModalBase>
</template>

<style scoped>
.confirm__contenido { padding: 24px; text-align: center; }

.confirm__icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 12px;
  border-radius: 50%;
  background: #fee2e2;
  color: #b91c1c;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
}

h2 {
  margin: 0 0 8px;
  font-size: 1.2rem;
}

.confirm__message {
  margin: 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.confirm__item {
  margin: 14px 0 0;
  padding: 10px;
  background: #f9fafb;
  border-radius: 8px;
  font-weight: 600;
  word-break: break-word;
}

.confirm__footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 22px;
}

.btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--danger {
  background: #dc2626;
  border-color: #dc2626;
  color: #fff;
}
</style>
