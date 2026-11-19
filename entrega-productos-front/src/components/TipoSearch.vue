<script setup>
/**
 * Buscador de tipos para las líneas de una factura.
 *
 * Reemplaza al <select> porque con cientos de tipos el desplegable se vuelve
 * inmanejable. El usuario escribe parte del nombre y elige una opción.
 * Acepta también el id exacto para integraciones y pruebas.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  tipos: { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' },
  dataTest: { type: String, required: true },
  placeholder: { type: String, default: 'Busca un tipo…' },
})
const emit = defineEmits(['update:modelValue', 'select'])

const texto = ref('')
const abierto = ref(false)
const indice = ref(0)
const raiz = ref(null)

function normalizar(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const seleccionado = computed(() =>
  props.tipos.find((tipo) => String(tipo.id) === String(props.modelValue)),
)

watch(
  () => props.modelValue,
  (valor) => {
    const tipo = props.tipos.find((item) => String(item.id) === String(valor))
    texto.value = tipo?.nombre ?? (valor ? texto.value : '')
  },
)

watch(
  () => props.tipos,
  () => {
    if (seleccionado.value) texto.value = seleccionado.value.nombre
  },
)

const coincidencias = computed(() => {
  const termino = normalizar(texto.value)
  const lista = !termino
    ? props.tipos
    : props.tipos.filter((tipo) => normalizar(tipo.nombre).includes(termino))
  return lista.slice(0, 8)
})

function abrir() {
  abierto.value = true
  indice.value = 0
}

function elegir(tipo) {
  texto.value = tipo.nombre
  abierto.value = false
  emit('update:modelValue', tipo.id)
  emit('select', tipo)
}

function onInput(event) {
  const valor = event.target.value
  texto.value = valor
  abrir()

  // Permite seleccionar por id exacto (útil para integraciones y pruebas).
  const porId = props.tipos.find((tipo) => String(tipo.id) === valor.trim())
  if (porId) {
    elegir(porId)
    return
  }

  if (props.modelValue !== '' && props.modelValue != null) {
    emit('update:modelValue', '')
    emit('select', null)
  }
}

function onKeydown(event) {
  if (!abierto.value) {
    if (event.key === 'ArrowDown') abrir()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    indice.value = Math.min(indice.value + 1, coincidencias.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    indice.value = Math.max(indice.value - 1, 0)
  } else if (event.key === 'Enter') {
    event.preventDefault()
    const tipo = coincidencias.value[indice.value]
    if (tipo) elegir(tipo)
  } else if (event.key === 'Escape') {
    abierto.value = false
  }
}

function onPointerDown(event) {
  if (raiz.value && !raiz.value.contains(event.target)) abierto.value = false
}

onMounted(() => document.addEventListener('pointerdown', onPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onPointerDown))
</script>

<template>
  <div ref="raiz" class="tipo-search">
    <input
      :data-test="dataTest"
      :value="texto"
      type="text"
      autocomplete="off"
      :placeholder="placeholder"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="abierto ? 'true' : 'false'"
      @input="onInput"
      @focus="abrir"
      @keydown="onKeydown"
    />

    <ul
      v-if="abierto"
      :data-test="`${dataTest}-opciones`"
      class="tipo-search__lista"
      role="listbox"
    >
      <li v-if="!coincidencias.length" class="tipo-search__vacio" data-test="tipo-search-vacio">
        Sin resultados
      </li>
      <li v-for="(tipo, i) in coincidencias" :key="tipo.id">
        <button
          type="button"
          role="option"
          :aria-selected="String(tipo.id) === String(modelValue) ? 'true' : 'false'"
          :class="['tipo-search__opcion', { 'tipo-search__opcion--activo': i === indice }]"
          :data-test="`${dataTest}-opcion`"
          @mousedown.prevent="elegir(tipo)"
        >
          {{ tipo.nombre }}
        </button>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.tipo-search {
  position: relative;
}

.tipo-search__lista {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 10;
  margin: 0;
  padding: 4px;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 8px 20px rgb(15 23 42 / 16%);
}

.tipo-search__opcion {
  display: block;
  width: 100%;
  padding: 7px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #374151;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.tipo-search__opcion:hover,
.tipo-search__opcion--activo {
  background: #eef2ff;
  color: #3730a3;
}

.tipo-search__vacio {
  padding: 8px;
  color: #6b7280;
  font-size: 0.85rem;
}
</style>
