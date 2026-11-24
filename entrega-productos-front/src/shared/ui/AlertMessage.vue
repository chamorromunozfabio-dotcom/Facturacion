<script setup>
import { onMounted, onUnmounted, watch } from 'vue'

/**
 * Mensaje de éxito o error. Se cierra solo y también avisa al cerrar a mano.
 * `duration: 0` deja el aviso fijo para los casos que lo necesiten.
 */
const props = defineProps({
  message: { type: String, required: true },
  type: { type: String, default: 'info' },
  dismissible: { type: Boolean, default: true },
  duration: { type: Number, default: 5000 },
})

const emit = defineEmits(['close'])

let closeTimer

function programarCierre() {
  clearTimeout(closeTimer)
  if (props.duration > 0) {
    closeTimer = setTimeout(() => emit('close'), props.duration)
  }
}

function cerrar() {
  clearTimeout(closeTimer)
  emit('close')
}

onMounted(programarCierre)
onUnmounted(() => clearTimeout(closeTimer))
watch(() => [props.message, props.duration], programarCierre)
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
      @click="cerrar"
    >
      ×
    </button>
  </div>
</template>

<style scoped>
.alert {
  position: fixed;
  top: 74px;
  right: 20px;
  z-index: 80;
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: min(440px, calc(100vw - 32px));
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 0.95rem;
  border: 1px solid transparent;
  box-shadow: 0 10px 28px rgb(15 23 42 / 18%);
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

@media (max-width: 640px) {
  .alert {
    top: 12px;
    right: 16px;
    left: 16px;
    width: auto;
    max-width: none;
  }
}
</style>
