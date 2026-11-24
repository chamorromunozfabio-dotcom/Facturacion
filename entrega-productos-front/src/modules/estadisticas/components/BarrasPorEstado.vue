<script setup>
import { computed } from 'vue'
import { maximoDe } from '../utils/estadisticas'

const props = defineProps({
  titulo: { type: String, default: '' },
  datos: { type: Array, default: () => [] },
})

const maximo = computed(() => maximoDe({ datos: props.datos }))

function ancho(valor) {
  if (!maximo.value) return '0%'
  const numero = Math.max(0, Number(valor) || 0)
  return `${Math.round((numero / maximo.value) * 100)}%`
}
</script>

<template>
  <section class="barras" data-test="serie-barras">
    <h2 v-if="titulo" class="barras__titulo">{{ titulo }}</h2>

    <div
      v-for="(dato, index) in datos"
      :key="`${dato.etiqueta}-${index}`"
      class="barras__fila"
      :data-test="`barra-${index}`"
    >
      <span class="barras__etiqueta">{{ dato.etiqueta }}</span>
      <div class="barras__pista" role="img" :aria-label="`${dato.etiqueta}: ${dato.valor}`">
        <span class="barras__relleno" :style="{ width: ancho(dato.valor) }" />
      </div>
      <span class="barras__valor">{{ dato.valor }}</span>
    </div>
  </section>
</template>

<style scoped>
.barras {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.barras__titulo {
  margin: 0;
  font-size: 1rem;
}

.barras__fila {
  display: grid;
  grid-template-columns: minmax(90px, 140px) 1fr 44px;
  align-items: center;
  gap: 10px;
  font-size: 0.85rem;
}

.barras__etiqueta {
  color: #374151;
}

.barras__pista {
  background: #eef2ff;
  border-radius: 999px;
  height: 12px;
  overflow: hidden;
}

.barras__relleno {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #2563eb;
  transition: width 0.4s ease;
}

.barras__valor {
  text-align: right;
  font-weight: 600;
  color: #1f2937;
}

@media (max-width: 480px) {
  .barras__fila {
    grid-template-columns: minmax(70px, 100px) 1fr 36px;
    gap: 6px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .barras__relleno {
    transition: none;
  }
}
</style>
