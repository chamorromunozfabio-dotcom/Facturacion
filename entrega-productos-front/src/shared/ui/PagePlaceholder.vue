<script setup>
defineProps({
  title: { type: String, required: true },
  day: { type: String, default: '' },
  description: { type: String, default: '' },
})
</script>

<template>
  <section class="placeholder">
    <header class="placeholder__header">
      <h1>{{ title }}</h1>
      <span v-if="day" class="badge">{{ day }}</span>
    </header>

    <p class="placeholder__text">
      {{ description || 'Esta pantalla ya tiene su ruta lista. Falta conectarla a la API.' }}
    </p>

    <div class="placeholder__note">
      <strong>Pendiente de confirmar con el líder:</strong>
      <ul>
        <li>Campos exactos de la tabla y cuáles son obligatorios.</li>
        <li>Ejemplo de JSON de entrada y de salida.</li>
        <li>Roles que pueden ver o editar esta pantalla.</li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.placeholder {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
}

.placeholder__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

.badge {
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
}

.placeholder__text {
  color: #4b5563;
  margin: 12px 0 20px;
}

.placeholder__note {
  background: #fffbeb;
  border-left: 4px solid #f59e0b;
  padding: 12px 16px;
  border-radius: 6px;
  font-size: 0.9rem;
}

ul {
  margin: 8px 0 0;
  padding-left: 20px;
}
</style>
