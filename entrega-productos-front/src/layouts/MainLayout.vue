<script setup>
import { computed, ref } from 'vue'
import { Menu, X } from '@lucide/vue'
import { useRouter } from 'vue-router'
import { useModalA11y } from '../composables/useModalA11y'
import { visibleMenuFor } from '../config/navigation'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const logoUrl = `${import.meta.env.BASE_URL}logo.png`

const visibleMenu = computed(() => visibleMenuFor(auth.role, auth.permisos))

// En celular/tableta el menú es un panel lateral; en escritorio queda fijo.
const menuAbierto = ref(false)
const { panelRef: sidebarRef } = useModalA11y(
  computed(() => menuAbierto.value),
  () => {
    menuAbierto.value = false
  },
)

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
    <Transition name="backdrop">
      <div
        v-if="menuAbierto"
        data-test="sidebar-backdrop"
        class="sidebar-backdrop"
        @click="cerrarMenu"
      ></div>
    </Transition>

    <aside
      ref="sidebarRef"
      class="sidebar"
      :class="{ 'sidebar--abierto': menuAbierto }"
      data-test="sidebar"
      tabindex="-1"
      aria-label="Menú principal"
    >
      <div class="brand">
        <img :src="logoUrl" alt="Logo de Entrega de Productos" class="brand__logo" />
        <div>
          <strong>Entrega de Productos</strong>
          <small>Panel principal</small>
        </div>
        <button
          type="button"
          class="sidebar__close"
          data-test="cerrar-menu"
          aria-label="Cerrar menú"
          @click="cerrarMenu"
        >
          <X :size="18" aria-hidden="true" />
        </button>
      </div>

      <nav id="menu-principal" class="menu" aria-label="Opciones del menú">
        <RouterLink
          v-for="item in visibleMenu"
          :key="item.to"
          :to="item.to"
          class="menu__item"
          @click="cerrarMenu"
        >
          <component :is="item.icon" :size="18" aria-hidden="true" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="main">
      <header class="topbar">
        <button
          type="button"
          class="menu-toggle"
          data-test="menu-toggle"
          :aria-expanded="String(menuAbierto)"
          aria-controls="menu-principal"
          aria-label="Abrir menú"
          @click="menuAbierto = true"
        >
          <Menu :size="20" aria-hidden="true" />
          <span class="menu-toggle__texto">Menú</span>
        </button>

        <div class="user">
          <strong>{{ auth.userName || 'Usuario' }}</strong>
          <small v-if="auth.role">Rol: {{ auth.role }}</small>
        </div>
        <button type="button" class="logout" @click="logout">Cerrar sesión</button>
      </header>

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

.sidebar {
  position: sticky;
  top: 0;
  z-index: 20;
  height: 100vh;
  overflow-y: auto;
  background: #111827;
  color: #e5e7eb;
  padding: 20px 14px;
}

.sidebar:focus {
  outline: none;
}

.brand {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 20px;
  border-bottom: 1px solid #374151;
}

.brand__logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand strong,
.brand small {
  display: block;
}

.brand small {
  color: #9ca3af;
  font-size: 0.75rem;
}

.menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 18px;
}

.menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: #d1d5db;
  font-size: 0.95rem;
}

.menu__item:hover {
  background: #1f2937;
}

.menu__item.router-link-exact-active {
  background: var(--accent);
  color: #fff;
}

.menu__item svg {
  flex-shrink: 0;
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

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.user {
  min-width: 0;
  margin-left: auto;
}

.user strong,
.user small {
  display: block;
}

.user strong {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user small {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 600;
}

.logout {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  white-space: nowrap;
}

.logout:hover {
  background: #f9fafb;
}

.menu-toggle,
.sidebar__close {
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  display: none;
}

.sidebar__close {
  position: absolute;
  top: 4px;
  right: 0;
  color: #e5e7eb;
  background: transparent;
  border-color: #374151;
  padding: 6px;
}

.menu-toggle:focus-visible,
.logout:focus-visible,
.sidebar__close:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: rgb(17 24 39 / 55%);
}

.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.2s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}

.content {
  padding: 24px;
}

/* Tablet y celular: el menú se guarda a la izquierda y se abre con el botón. */
@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .menu-toggle,
  .sidebar__close {
    display: inline-flex;
  }

  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: 120;
    width: min(280px, 85vw);
    height: 100vh;
    transform: translateX(-100%);
    transition: transform 0.24s ease;
    box-shadow: 12px 0 30px rgb(0 0 0 / 30%);
  }

  .sidebar--abierto {
    transform: translateX(0);
  }

  .brand {
    padding-right: 40px;
  }

  .menu__item {
    white-space: normal;
  }
}

@media (max-width: 768px) {
  .sidebar {
    width: min(300px, 88vw);
  }

  .brand small {
    display: none;
  }

  .brand strong {
    font-size: 0.85rem;
  }

  .topbar {
    padding: 12px 16px;
    gap: 8px;
  }

  .menu-toggle__texto {
    display: none;
  }

  .content {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .backdrop-enter-active,
  .backdrop-leave-active,
  .fade-enter-active,
  .fade-leave-active {
    transition: none;
  }
}
</style>
