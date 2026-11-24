<script setup>
import { Menu } from '@lucide/vue'

/** Barra superior: abre el menú en pantallas chicas y cierra la sesión. */
defineProps({
  abierto: { type: Boolean, default: false },
  nombre: { type: String, default: '' },
  rol: { type: String, default: '' },
  empresa: { type: String, default: '' },
})
defineEmits(['toggle', 'logout'])
</script>

<template>
  <header class="topbar">
    <button
      type="button"
      class="menu-toggle"
      data-test="menu-toggle"
      :aria-expanded="String(abierto)"
      aria-controls="menu-principal"
      aria-label="Abrir menú"
      @click="$emit('toggle')"
    >
      <Menu :size="20" aria-hidden="true" />
      <span class="menu-toggle__texto">Menú</span>
    </button>

    <div class="user">
      <strong>{{ nombre || 'Usuario' }}</strong>
      <small v-if="rol">Rol: {{ rol }}</small>
      <small v-if="empresa" class="user__empresa" data-test="empresa-topbar">{{ empresa }}</small>
    </div>
    <button type="button" class="logout" @click="$emit('logout')">Cerrar sesión</button>
  </header>
</template>

<style scoped>
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

.user__empresa {
  color: #6b7280;
  font-weight: 500;
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

.menu-toggle {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
}

.menu-toggle:focus-visible,
.logout:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (max-width: 1024px) {
  .menu-toggle {
    display: inline-flex;
  }
}

@media (max-width: 768px) {
  .topbar {
    padding: 12px 16px;
    gap: 8px;
  }

  .menu-toggle__texto {
    display: none;
  }
}
</style>
