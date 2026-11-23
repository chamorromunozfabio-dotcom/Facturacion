<script setup>
import { nextTick, ref, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import { IonModal } from '@ionic/vue'

/**
 * Envoltura común de los diálogos.
 * Ionic necesita IonApp para presentar IonModal; en navegador no hay IonApp
 * (bloqueaba el scroll), así que se mantiene el markup HTML de siempre.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  testId: { type: String, required: true },
  label: { type: String, required: true },
  small: { type: Boolean, default: false },
})
const emit = defineEmits(['close'])
const esMovil = Capacitor.isNativePlatform()

// El foco se maneja acá: el ref del panel vive en este componente.
const miPanel = ref(null)
watch(
  () => props.open,
  async (abierto) => {
    if (!abierto) return
    await nextTick()
    miPanel.value?.focus()
  },
  { immediate: true },
)
</script>

<template>
  <IonModal
    v-if="esMovil"
    :is-open="open"
    @ion-modal-dismiss="emit('close')"
  >
    <div
      ref="miPanel"
      :data-test="testId"
      tabindex="-1"
      class="modal__panel"
      :class="{ 'modal__panel--small': small }"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
    >
      <slot />
    </div>
  </IonModal>

  <Transition v-else name="modal">
    <div v-if="open" class="modal">
      <div class="modal__backdrop" @click="emit('close')"></div>
      <div
        :ref="panelRef"
        :data-test="testId"
        tabindex="-1"
        class="modal__panel"
        :class="{ 'modal__panel--small': small }"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
      >
        <slot />
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; }
.modal__backdrop { position: absolute; inset: 0; background: rgb(17 24 39 / 50%); }
.modal__panel { position: relative; width: 100%; max-width: 860px; max-height: 92vh; overflow-y: auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgb(0 0 0 / 20%); }
.modal__panel--small { max-width: 560px; }

.modal-enter-active,
.modal-leave-active { transition: opacity 0.18s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active,
  .modal-leave-active { transition: none; }
}
</style>
