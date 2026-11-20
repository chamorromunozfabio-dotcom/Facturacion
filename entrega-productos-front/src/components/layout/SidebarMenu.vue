<script setup>
import { computed } from 'vue'
import { X } from '@lucide/vue'
import { useModalA11y } from '../../composables/useModalA11y'

/** Menú lateral: en escritorio queda fijo y en celular se abre como drawer. */
const props = defineProps({
  abierto: { type: Boolean, default: false },
  menu: { type: Array, default: () => [] },
  logoUrl: { type: String, default: '' },
})
const emit = defineEmits(['cerrar'])

const { panelRef } = useModalA11y(
  computed(() => props.abierto),
  () => emit('cerrar'),
)
</script>

<template>
  <Transition name="backdrop">
    <div
      v-if="abierto"
      data-test="sidebar-backdrop"
      class="sidebar-backdrop"
      @click="emit('cerrar')"
    ></div>
  </Transition>

  <aside
    ref="panelRef"
    class="sidebar"
    :class="{ 'sidebar--abierto': abierto }"
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
        @click="emit('cerrar')"
      >
        <X :size="18" aria-hidden="true" />
      </button>
    </div>

    <nav id="menu-principal" class="menu" aria-label="Opciones del menú">
      <RouterLink
        v-for="item in menu"
        :key="item.to"
        :to="item.to"
        class="menu__item"
        @click="emit('cerrar')"
      >
        <component :is="item.icon" :size="18" aria-hidden="true" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </aside>
</template>

<style scoped>
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

.sidebar__close {
  position: absolute;
  top: 4px;
  right: 0;
  display: none;
  align-items: center;
  justify-content: center;
  border: 1px solid #374151;
  background: transparent;
  border-radius: 8px;
  color: #e5e7eb;
  padding: 6px;
  cursor: pointer;
}

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

/* Tablet y celular: el menú se guarda a la izquierda y se abre con el botón. */
@media (max-width: 1024px) {
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
}

@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .backdrop-enter-active,
  .backdrop-leave-active {
    transition: none;
  }
}
</style>
