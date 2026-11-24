<script setup>
import { watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import {
  IonButton,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonPage,
  IonToolbar,
  menuController,
} from '@ionic/vue'

/**
 * En navegador se mantiene el layout actual (grid + sidebar + topbar).
 * En Capacitor se usa el patrón Ionic: IonMenu + IonHeader + IonContent.
 */
const props = defineProps({
  abierto: { type: Boolean, default: false },
  menu: { type: Array, default: () => [] },
  logoUrl: { type: String, default: '' },
  role: { type: String, default: '' },
})
const emit = defineEmits(['toggle', 'cerrar', 'logout', 'navigate'])
const esMovil = Capacitor.isNativePlatform()

watch(
  () => props.abierto,
  (abierto) => {
    if (!esMovil) return
    if (abierto) menuController.open('menu-principal')
    else menuController.close('menu-principal')
  },
)
</script>

<template>
  <div v-if="!esMovil" class="layout" :data-role="role || 'invitado'">
    <slot name="sidebar" />
    <div class="main">
      <slot name="topbar" />
      <main class="content"><slot /></main>
    </div>
  </div>

  <template v-else>
    <IonMenu
      menu="menu-principal"
      content-id="contenido-principal"
      type="overlay"
      @ion-did-close="emit('cerrar')"
    >
      <IonContent>
        <div class="menu-movil">
          <div class="brand">
            <img :src="logoUrl" alt="Logo de Entrega de Productos" class="brand__logo" />
            <div>
              <strong>Entrega de Productos</strong>
              <small>Panel principal</small>
            </div>
          </div>

          <IonList>
            <IonItem
              v-for="item in menu"
              :key="item.to"
              button
              @click="emit('navigate', item.to)"
            >
              <template #start>
                <component :is="item.icon" :size="18" aria-hidden="true" />
              </template>
              <IonLabel>{{ item.label }}</IonLabel>
            </IonItem>
          </IonList>

          <IonButton fill="clear" class="menu-movil__logout" @click="emit('logout')">
            Cerrar sesión
          </IonButton>
        </div>
      </IonContent>
    </IonMenu>

    <IonPage id="contenido-principal">
      <IonHeader>
        <IonToolbar>
          <slot name="topbar" />
        </IonToolbar>
      </IonHeader>
      <IonContent class="content-movil"><slot /></IonContent>
    </IonPage>
  </template>
</template>

<style scoped>
.layout {
  --accent: #2563eb;
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.layout[data-role='admin'] { --accent: #4f46e5; }
.layout[data-role='bodeguero'] { --accent: #059669; }
.layout[data-role='cliente'] { --accent: #d97706; }

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content { padding: 24px; }

@media (max-width: 1024px) {
  .layout { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .content { padding: 16px; }
}

.menu-movil { padding: 16px; }

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.brand__logo { width: 40px; height: 40px; object-fit: contain; }

.brand strong,
.brand small { display: block; }

.brand small { color: #6b7280; font-size: 0.75rem; }

.menu-movil__logout { margin-top: 12px; }
</style>
