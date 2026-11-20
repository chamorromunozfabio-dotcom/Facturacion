<script setup>
import AlertMessage from '../components/ui/AlertMessage.vue'
import StatCard from '../components/estadisticas/StatCard.vue'
import BarrasPorEstado from '../components/estadisticas/BarrasPorEstado.vue'
import { useEstadisticas } from '../composables/useEstadisticas'

const {
  desde,
  hasta,
  invalido,
  loading,
  error,
  resumen,
  tarjetas,
  barras,
  sinDatos,
  cargar,
} = useEstadisticas()
</script>

<template>
  <section>
    <h1>Estadísticas</h1>
    <p class="subtitle">El resumen se filtra según tus permisos y tu rol.</p>

    <div class="filtros">
      <label>
        Desde
        <input v-model="desde" data-test="desde" type="date" />
      </label>
      <label>
        Hasta
        <input v-model="hasta" data-test="hasta" type="date" />
      </label>
      <button type="button" data-test="recargar" :disabled="invalido || loading" @click="cargar">
        {{ loading ? 'Cargando...' : 'Actualizar' }}
      </button>
    </div>

    <p v-if="invalido" class="aviso" data-test="rango-invalido">
      La fecha “desde” no puede ser mayor que “hasta”.
    </p>

    <AlertMessage v-if="error" :message="error" type="error" @close="error = ''" />

    <template v-if="!invalido">
      <p class="alcance" data-test="generado-para">
        Datos de {{ resumen.generado_para || 'tu usuario' }} ·
        {{ resumen.periodo.desde || desde }} a {{ resumen.periodo.hasta || hasta }}
      </p>

      <p v-if="sinDatos" class="aviso" data-test="sin-datos">
        No hay datos para el período seleccionado.
      </p>

      <div v-if="tarjetas.length" class="grid">
        <StatCard v-for="tarjeta in tarjetas" :key="tarjeta.clave" v-bind="tarjeta" />
      </div>

      <div v-if="barras.length" class="series">
        <BarrasPorEstado
          v-for="serie in barras"
          :key="serie.clave"
          :titulo="serie.titulo"
          :datos="serie.datos"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
h1 {
  margin: 0 0 6px;
  font-size: 1.6rem;
}

.subtitle {
  margin: 0 0 20px;
  color: #6b7280;
}

.filtros {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
  margin-bottom: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  font-weight: 600;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
}

button {
  background: #2563eb;
  color: #fff;
  border: 0;
  border-radius: 8px;
  padding: 9px 16px;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.alcance {
  color: #6b7280;
  font-size: 0.82rem;
  margin: 0 0 16px;
}

.aviso {
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  border-radius: 8px;
  padding: 10px;
  font-size: 0.85rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.series {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

@media (max-width: 480px) {
  .filtros {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
