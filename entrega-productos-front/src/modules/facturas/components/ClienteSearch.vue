<script setup>
/**
 * Buscador unificado de clientes para el encabezado de factura.
 * Muestra el desplegable directamente debajo del input con las coincidencias.
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  clientes: { type: Array, default: () => [] },
  modelValue: { type: [String, Number], default: '' },
  query: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'buscar'])

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
  props.clientes.find((c) => String(c.id) === String(props.modelValue)),
)

watch(
  () => props.modelValue,
  (valor) => {
    const cliente = props.clientes.find((c) => String(c.id) === String(valor))
    texto.value = cliente?.nombre ?? (valor ? texto.value : '')
  },
  { immediate: true },
)

watch(
  () => props.clientes,
  (lista) => {
    if (seleccionado.value) {
      texto.value = seleccionado.value.nombre
      return
    }
    if (abierto.value && lista.length) indice.value = 0
  },
)

const coincidencias = computed(() => {
  const termino = normalizar(texto.value)
  const lista = !termino
    ? props.clientes
    : props.clientes.filter((c) =>
        [c.nombre, c.numero_documento, c.correo]
          .filter(Boolean)
          .some((campo) => normalizar(campo).includes(termino)),
      )
  return (lista.length ? lista : props.clientes).slice(0, 8)
})

function abrir() {
  abierto.value = true
  indice.value = 0
}

function elegir(cliente) {
  texto.value = cliente.nombre
  abierto.value = false
  emit('update:modelValue', cliente.id)
}

function onInput(event) {
  const valor = String(event.target.value ?? '')
  texto.value = valor
  abrir()

  if (props.modelValue !== '' && props.modelValue != null) {
    emit('update:modelValue', '')
  }
  emit('buscar', valor)
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
    const cliente = coincidencias.value[indice.value]
    if (cliente) elegir(cliente)
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
  <div ref="raiz" class="cliente-search">
    <input
      type="text"
      data-test="field-cliente_id"
      :value="texto"
      autocomplete="off"
      placeholder="Busca por nombre, documento o correo…"
      role="combobox"
      :aria-expanded="abierto"
      @focus="abrir"
      @input="onInput"
      @keydown="onKeydown"
    />
    <small v-if="texto.trim().length > 0 && texto.trim().length < 3 && !seleccionado" class="campo-hint">
      Escribe al menos 3 caracteres para buscar.
    </small>
    <ul v-if="abierto && coincidencias.length" class="cliente-search__lista" role="listbox">
      <li
        v-for="(cliente, i) in coincidencias"
        :key="cliente.id"
        :data-test="`cliente-opcion-${i}`"
        role="option"
        :aria-selected="String(cliente.id) === String(modelValue)"
        :class="{ activo: i === indice, elegido: String(cliente.id) === String(modelValue) }"
        @mousedown.prevent="elegir(cliente)"
      >
        <strong>{{ cliente.nombre }}</strong>
        <small v-if="cliente.numero_documento">
          {{ cliente.tipo_documento ? `${cliente.tipo_documento} ` : '' }}{{ cliente.numero_documento }}
        </small>
      </li>
    </ul>
    <p v-else-if="abierto && texto.trim().length >= 3 && !seleccionado" class="cliente-search__vacio">
      Sin coincidencias
    </p>
  </div>
</template>

<style scoped>
.cliente-search {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cliente-search input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px;
  font: inherit;
}
.campo-hint {
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 400;
}
.cliente-search__lista {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  z-index: 30;
  margin: 0;
  padding: 4px;
  list-style: none;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgb(0 0 0 / 12%);
  max-height: 220px;
  overflow-y: auto;
}
.cliente-search__lista li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 400;
}
.cliente-search__lista li.activo,
.cliente-search__lista li:hover {
  background: #eef2ff;
  color: #3730a3;
}
.cliente-search__lista li.elegido {
  font-weight: 600;
}
.cliente-search__lista small {
  color: #6b7280;
  font-size: 0.78rem;
}
.cliente-search__vacio {
  position: absolute;
  top: calc(100% + 2px);
  left: 0;
  right: 0;
  z-index: 30;
  margin: 0;
  padding: 8px 10px;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #6b7280;
  font-size: 0.85rem;
}
</style>
