<script setup>
import { computed } from 'vue'
import { visibleMenuFor } from '../config/navigation'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const modules = computed(() => visibleMenuFor(auth.role).filter((item) => item.to !== '/'))

/** Cada rol ve un panel distinto: solo sus módulos y un mensaje acorde. */
const roleMessages = {
  admin: 'Gestionas todos los módulos y el ciclo completo de las facturas.',
  bodeguero: 'Gestionas Tipos, tus bodegas y el ciclo de las facturas.',
  cliente: 'Consulta tus facturas, acéptalas o recházalas y descarga el PDF.',
}
const roleMessage = computed(() => roleMessages[auth.role] || 'Bienvenido al sistema.')
</script>

<template>
  <section>
    <h1>Hola, {{ auth.userName || 'usuario' }}</h1>
    <p class="subtitle">{{ roleMessage }}</p>

    <div class="grid">
      <RouterLink
        v-for="(item, index) in modules"
        :key="item.to"
        :to="item.to"
        class="card"
        :style="{ animationDelay: `${index * 60}ms` }"
      >
        <component :is="item.icon" :size="26" class="card__icon" aria-hidden="true" />
        <strong>{{ item.label }}</strong>
        <small>Abrir módulo →</small>
      </RouterLink>
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
  animation: card-in 0.35s ease both;
}

.card:hover {
  border-color: var(--accent, #2563eb);
  box-shadow: 0 4px 12px rgb(37 99 235 / 12%);
}

.card__icon {
  color: var(--accent, #2563eb);
}

.card small {
  color: #6b7280;
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .card {
    animation: none;
  }
}
</style>
