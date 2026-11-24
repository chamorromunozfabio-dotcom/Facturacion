<script setup>
import { Capacitor } from '@capacitor/core'
import { IonButton } from '@ionic/vue'

/** Botón HTML en navegador; IonButton dentro del WebView nativo. */
defineOptions({ inheritAttrs: false })
const esMovil = Capacitor.isNativePlatform()
</script>

<template>
  <IonButton v-if="esMovil" v-bind="$attrs">
    <slot />
  </IonButton>
  <button v-else v-bind="$attrs">
    <slot />
  </button>
</template>
