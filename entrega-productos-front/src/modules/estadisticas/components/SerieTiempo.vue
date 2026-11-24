<script setup>
import { computed } from 'vue'
import { maximoDe } from '../utils/estadisticas'

const props = defineProps({
  titulo: { type: String, default: '' },
  datos: { type: Array, default: () => [] },
})

const maximo = computed(() => maximoDe({ datos: props.datos }))
const porMes = computed(() => /^\d{4}-\d{2}$/.test(String(props.datos[0]?.etiqueta ?? '')))

function altura(valor) {
  const numero = Math.max(0, Number(valor) || 0)
  if (!maximo.value || !numero) return '2px'
  return `${Math.max(4, Math.round((numero / maximo.value) * 100))}%`
}

/** En 30 días mostramos el día; en periodos largos, el mes. */
function etiquetaCorta(etiqueta) {
  const texto = String(etiqueta ?? '')
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto.slice(8, 10)
  if (/^\d{4}-\d{2}$/.test(texto)) return texto.slice(5, 7)
  return texto.length > 6 ? `${texto.slice(0, 6)}…` : texto
}
</script>

<template>
  <section class="serie-tiempo" data-test="serie-linea">
    <h2 v-if="titulo" class="serie-tiempo__titulo">{{ titulo }}</h2>

    <div class="serie-tiempo__scroll">
      <div class="serie-tiempo__grafico">
        <div
          v-for="(dato, index) in datos"
          :key="`${dato.etiqueta}-${index}`"
          class="serie-tiempo__columna"
          :data-test="`punto-${index}`"
        >
          <span class="serie-tiempo__pista">
            <span
              class="serie-tiempo__barra"
              :class="{ 'serie-tiempo__barra--cero': !Number(dato.valor) }"
              :style="{ height: altura(dato.valor) }"
              role="img"
              :aria-label="`${dato.etiqueta}: ${dato.valor}`"
              :title="`${dato.etiqueta}: ${dato.valor}`"
            />
          </span>
          <span class="serie-tiempo__etiqueta">{{ etiquetaCorta(dato.etiqueta) }}</span>
        </div>
      </div>
    </div>

    <p class="serie-tiempo__ayuda">
      Cada columna es un {{ porMes ? 'mes' : 'día' }} del periodo seleccionado.
    </p>
  </section>
</template>

<style scoped>
.serie-tiempo {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.serie-tiempo__titulo {
  margin: 0;
  font-size: 1rem;
}

.serie-tiempo__scroll {
  overflow-x: auto;
  padding-bottom: 4px;
}

.serie-tiempo__grafico {
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.serie-tiempo__columna {
  display: flex;
  flex: 1 0 24px;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  min-width: 24px;
}

.serie-tiempo__pista {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  width: 100%;
  height: 100px;
  background: #eef2ff;
  border-radius: 6px;
  overflow: hidden;
}

.serie-tiempo__barra {
  display: block;
  width: 70%;
  min-height: 2px;
  border-radius: 6px 6px 0 0;
  background: linear-gradient(180deg, #60a5fa, #2563eb);
  transition: height 0.4s ease;
}

.serie-tiempo__barra--cero {
  background: #c7d2fe;
}

.serie-tiempo__etiqueta {
  font-size: 0.7rem;
  color: #6b7280;
  white-space: nowrap;
}

.serie-tiempo__ayuda {
  margin: 0;
  font-size: 0.75rem;
  color: #9ca3af;
}

@media (max-width: 480px) {
  .serie-tiempo__columna {
    min-width: 20px;
    flex-basis: 20px;
  }

  .serie-tiempo__etiqueta {
    font-size: 0.62rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .serie-tiempo__barra {
    transition: none;
  }
}
</style>
