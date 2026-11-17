<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { menuItems } from '../config/navigation'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const logoUrl = `${import.meta.env.BASE_URL}logo.png`

const visibleMenu = computed(() =>
  menuItems.filter((item) => !item.roles?.length || item.roles.includes(auth.role)),
)

async function logout() {
  auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="brand">
        <img :src="logoUrl" alt="Logo de Entrega de Productos" class="brand__logo" />
        <div>
          <strong>Entrega de Productos</strong>
          <small>Panel principal</small>
        </div>
      </div>

      <nav class="menu" aria-label="Menú principal">
        <RouterLink v-for="item in visibleMenu" :key="item.to" :to="item.to" class="menu__item">
          <span aria-hidden="true">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
      </nav>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="user">
          <strong>{{ auth.userName || 'Usuario' }}</strong>
          <small v-if="auth.role">Rol: {{ auth.role }}</small>
        </div>
        <button type="button" class="logout" @click="logout">Cerrar sesión</button>
      </header>

      <main class="content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 240px 1fr;
  min-height: 100vh;
}

.sidebar {
  background: #111827;
  color: #e5e7eb;
  padding: 20px 14px;
}

.brand {
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
  background: #2563eb;
  color: #fff;
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.user strong,
.user small {
  display: block;
}

.user small {
  color: #6b7280;
  font-size: 0.78rem;
}

.logout {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.logout:hover {
  background: #f9fafb;
}

.content {
  padding: 24px;
}

@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    padding: 12px;
  }

  .brand {
    padding-bottom: 12px;
  }

  .menu {
    flex-direction: row;
    overflow-x: auto;
    margin-top: 12px;
  }

  .menu__item {
    white-space: nowrap;
  }

  .content {
    padding: 16px;
  }
}
</style>
