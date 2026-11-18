<script setup>
/**
 * Mensaje de éxito o error. No decide nada: solo muestra y avisa al cerrar.
 */
defineProps({
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  dismissible: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])
</script>

<template>
  <div class="alert" :class="`alert--${type}`" role="alert">
    <span class="alert__icon" aria-hidden="true">
      {{ type === 'success' ? '✓' : type === 'error' ? '!' : 'i' }}
    </span>

    <span class="alert__text">{{ message }}</span>

    <button
      v-if="dismissible"
      data-test="close"
      type="button"
      class="alert__close"
      aria-label="Cerrar mensaje"
      @click="emit('close')"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  font-size: 0.95rem;
  border: 1px solid transparent;
}

.alert--success {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #065f46;
}

.alert--error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.alert--info {
  background: #eff6ff;
  border-color: #bfdbfe;
  color: #1e40af;
}

.alert--warning {
  background: #fffbeb;
  border-color: #fde68a;
  color: #92400e;
}

.alert__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid currentColor;
  font-weight: 700;
  flex-shrink: 0;
}

.alert__text {
  flex: 1;
}

.alert__close {
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  opacity: 0.7;
}

.alert__close:hover {
  opacity: 1;
}
</style>
