<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SidebarMenu from '../components/layout/SidebarMenu.vue'
import TopBar from '../components/layout/TopBar.vue'
import LayoutBase from './LayoutBase.vue'
import { visibleMenuFor } from '../config/navigation'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const logoUrl = `${import.meta.env.BASE_URL}logo.png`

const visibleMenu = computed(() => visibleMenuFor(auth.role, auth.permisos))

// En celular/tableta el menú es un panel lateral; en escritorio queda fijo.
const menuAbierto = ref(false)

function cerrarMenu() {
  menuAbierto.value = false
}

async function navegar(to) {
  cerrarMenu()
  await router.push(to)
}

async function logout() {
  cerrarMenu()
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <LayoutBase
    :abierto="menuAbierto"
    :menu="visibleMenu"
    :logo-url="logoUrl"
    :role="auth.role"
    @cerrar="cerrarMenu"
    @toggle="menuAbierto = true"
    @logout="logout"
    @navigate="navegar"
  >
    <template #sidebar>
      <SidebarMenu
        :abierto="menuAbierto"
        :menu="visibleMenu"
        :logo-url="logoUrl"
        @cerrar="cerrarMenu"
      />
    </template>

    <template #topbar>
      <TopBar
        :abierto="menuAbierto"
        :nombre="auth.userName"
        :rol="auth.role"
        @toggle="menuAbierto = true"
        @logout="logout"
      />
    </template>

    <RouterView v-slot="{ Component }">
      <Transition name="fade" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </LayoutBase>
</template>

<style scoped>
/* Transición suave al cambiar de vista (Vue puro, sin librerías extra). */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
