<script setup>
import { Capacitor } from '@capacitor/core'
import { IonInput } from '@ionic/vue'

/**
 * Campo de texto HTML en navegador; IonInput en el WebView nativo.
 * Mantiene v-model en ambas ramas y deja pasar data-test, type y placeholder.
 */
defineOptions({ inheritAttrs: false })
const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
})
const emit = defineEmits(['update:modelValue', 'input'])
const esMovil = Capacitor.isNativePlatform()

function alEscribir(evento) {
  const valor = evento.target?.value ?? ''
  emit('update:modelValue', valor)
  emit('input', evento)
}
</script>

<template>
  <IonInput
    v-if="esMovil"
    v-bind="$attrs"
    :model-value="props.modelValue"
    @ion-input="alEscribir"
  />
  <input
    v-else
    v-bind="$attrs"
    :value="props.modelValue"
    @input="alEscribir"
  />
</template>
