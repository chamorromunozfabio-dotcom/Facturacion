<script setup>
import { Capacitor } from '@capacitor/core'
import { IonApp } from '@ionic/vue'

// IonApp le pone .ion-page al host (position:absolute + contain:size). En el
// navegador eso saca el contenido del flujo y bloquea el scroll en TODAS las
// pantallas. En el WebView nativo sí lo necesitamos. Separamos acá web y móvil.
const esMovil = Capacitor.isNativePlatform()
</script>

<template>
  <IonApp v-if="esMovil">
    <RouterView />
  </IonApp>
  <RouterView v-else />
</template>
