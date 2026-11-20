<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import SidebarMenu from '../components/layout/SidebarMenu.vue'
import TopBar from '../components/layout/TopBar.vue'
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

async function logout() {
  cerrarMenu()
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="layout" :data-role="auth.role || 'invitado'">
    <SidebarMenu
      :abierto="menuAbierto"
      :menu="visibleMenu"
      :logo-url="logoUrl"
      @cerrar="cerrarMenu"
    />

    <div class="main">
      <TopBar
        :abierto="menuAbierto"
        :nombre="auth.userName"
        :rol="auth.role"
        @toggle="menuAbierto = true"
        @logout="logout"
      />

      <main class="content">
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  --accent: #2563eb;
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

/* Cada rol tiene un color de acento distinto, heredado por el dashboard. */
.layout[data-role='admin'] {
  --accent: #4f46e5;
}

.layout[data-role='bodeguero'] {
  --accent: #059669;
}

.layout[data-role='cliente'] {
  --accent: #d97706;
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

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

.content {
  padding: 24px;
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .content {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
