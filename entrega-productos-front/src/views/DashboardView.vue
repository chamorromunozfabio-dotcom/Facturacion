<script setup>
import { computed } from 'vue'
import { visibleMenuFor } from '../config/navigation'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const modules = computed(() => visibleMenuFor(auth.role).filter((item) => item.to !== '/'))
</script>

<template>
  <section>
    <h1>Hola, {{ auth.userName || 'usuario' }} 👋</h1>
    <p class="subtitle">
      La estructura del frontend ya está lista. Ahora seguimos con el login y los CRUD.
    </p>

    <div class="grid">
      <RouterLink v-for="item in modules" :key="item.to" :to="item.to" class="card">
        <span class="card__icon">{{ item.icon }}</span>
        <strong>{{ item.label }}</strong>
        <small>Abrir módulo →</small>
      </RouterLink>
    </div>

    <div class="note">
      <strong>Estado del día 1:</strong> rutas, layout, Axios y mocks funcionando.
      Los campos reales de cada tabla llegan con la respuesta del líder.
    </div>
  </section>
</template>

<style scoped>
h1 {
  margin: 0 0 6px;
  font-size: 1.6rem;
}

.subtitle {
  margin: 0 0 24px;
  color: #6b7280;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  text-decoration: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card:hover {
  border-color: #2563eb;
  box-shadow: 0 4px 12px rgb(37 99 235 / 12%);
}

.card__icon {
  font-size: 1.6rem;
}

.card small {
  color: #6b7280;
}

.note {
  margin-top: 24px;
  background: #eff6ff;
  border-left: 4px solid #2563eb;
  padding: 14px;
  border-radius: 6px;
  font-size: 0.9rem;
}
</style>
