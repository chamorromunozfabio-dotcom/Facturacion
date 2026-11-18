<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { useModalA11y } from '../composables/useModalA11y'

const props = defineProps({
  open: { type: Boolean, default: false },
  titulo: { type: String, default: 'Nueva factura' },
  modelValue: { type: Object, default: () => ({}) },
  clientes: { type: Array, default: () => [] },
  bodegas: { type: Array, default: () => [] },
  tipos: { type: Array, default: () => [] },
  submitLabel: { type: String, default: 'Guardar' },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'submit', 'close'])
const { panelRef } = useModalA11y(computed(() => props.open), () => emit('close'))

const IVAS = [0, 5, 19]
const formaPagoOptions = [
  { value: 'contado', label: 'Contado' },
  { value: 'credito', label: 'Crédito' },
]
const medioPagoOptions = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'tarjeta', label: 'Tarjeta' },
]

const emptyLinea = () => ({
  tipo_id: '',
  descripcion: '',
  cantidad: 1,
  precio_unitario: 0,
  descuento_porcentaje: 0,
  iva_porcentaje: 19,
})

const defaults = () => ({
  cliente_id: '',
  bodega_id: '',
  forma_pago: 'contado',
  medio_pago: 'transferencia',
  fecha_vencimiento: '',
  observaciones: '',
  detalle: [emptyLinea()],
})

const form = reactive(defaults())
const error = ref('')

function loadModel(value) {
  const initial = { ...value }
  if (Array.isArray(initial.detalle)) {
    initial.detalle = initial.detalle.map((linea) => ({ ...linea }))
  }
  Object.assign(form, defaults(), initial)
  if (!form.detalle.length) form.detalle = [emptyLinea()]
  error.value = ''
}

loadModel(props.modelValue)

watch(() => props.modelValue, loadModel, { deep: true })
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) loadModel(props.modelValue)
  },
)

const esCredito = computed(() => form.forma_pago === 'credito')

const tieneTipo = computed(() => props.tipos.length > 0)

function addLinea() {
  form.detalle.push(emptyLinea())
}

function removeLinea(index) {
  form.detalle.splice(index, 1)
}

function onTipoChange(linea, value) {
  linea.tipo_id = value
  const tipo = props.tipos.find((item) => String(item.id) === String(value))
  if (tipo) linea.descripcion = tipo.nombre
}

function validar() {
  if (!form.cliente_id) return 'Selecciona un cliente.'
  if (!form.bodega_id) return 'Selecciona una bodega.'
  if (!form.forma_pago) return 'Selecciona la forma de pago.'
  if (!form.medio_pago) return 'Selecciona el medio de pago.'
  if (esCredito.value && !form.fecha_vencimiento) {
    return 'La fecha de vencimiento es obligatoria con crédito.'
  }
  if (!form.detalle.length) return 'Agrega al menos una línea.'

  for (const [index, linea] of form.detalle.entries()) {
    const numero = index + 1
    if (Number(linea.cantidad) <= 0) return `La línea ${numero} debe tener cantidad mayor a 0.`
    if (Number(linea.precio_unitario) < 0) return `La línea ${numero} no puede tener precio negativo.`
    const descuento = Number(linea.descuento_porcentaje)
    if (descuento < 0 || descuento > 100) {
      return `El descuento de la línea ${numero} debe estar entre 0 y 100.`
    }
    if (!IVAS.includes(Number(linea.iva_porcentaje))) {
      return `El IVA de la línea ${numero} debe ser 0, 5 o 19.`
    }
  }
  return ''
}

function handleSubmit() {
  error.value = validar()
  if (error.value) return

  const payload = {
    cliente_id: Number(form.cliente_id),
    bodega_id: Number(form.bodega_id),
    forma_pago: form.forma_pago,
    medio_pago: form.medio_pago,
    fecha_vencimiento: form.fecha_vencimiento || null,
    observaciones: String(form.observaciones ?? '').trim() || null,
    detalle: form.detalle.map((linea) => ({
      tipo_id: linea.tipo_id === '' || linea.tipo_id == null ? null : Number(linea.tipo_id),
      descripcion: String(linea.descripcion ?? '').trim(),
      cantidad: Number(linea.cantidad),
      precio_unitario: Number(linea.precio_unitario),
      descuento_porcentaje: Number(linea.descuento_porcentaje),
      iva_porcentaje: Number(linea.iva_porcentaje),
    })),
  }

  emit('update:modelValue', payload)
  emit('submit', payload)
}
</script>

<template>
  <Transition name="modal">
    <div v-if="open" data-test="factura-form" class="modal">
    <div class="modal__backdrop" @click="emit('close')"></div>
    <div ref="panelRef" tabindex="-1" class="modal__panel" role="dialog" aria-modal="true" :aria-label="titulo">
      <header class="modal__header">
        <h2>{{ titulo }}</h2>
        <button
          data-test="close-x"
          type="button"
          class="modal__close"
          aria-label="Cerrar formulario"
          @click="emit('close')"
        >×</button>
      </header>

      <form class="modal__body" @submit.prevent="handleSubmit">
        <div class="grid">
          <label>
            Cliente *
            <select v-model="form.cliente_id" data-test="field-cliente_id" required>
              <option value="">Selecciona…</option>
              <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                {{ cliente.nombre }}
              </option>
            </select>
          </label>

          <label>
            Bodega *
            <select v-model="form.bodega_id" data-test="field-bodega_id" required>
              <option value="">Selecciona…</option>
              <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega.id">
                {{ bodega.nombre }}
              </option>
            </select>
          </label>

          <label>
            Forma de pago *
            <select v-model="form.forma_pago" data-test="field-forma_pago">
              <option v-for="opcion in formaPagoOptions" :key="opcion.value" :value="opcion.value">
                {{ opcion.label }}
              </option>
            </select>
          </label>

          <label>
            Medio de pago *
            <select v-model="form.medio_pago" data-test="field-medio_pago">
              <option v-for="opcion in medioPagoOptions" :key="opcion.value" :value="opcion.value">
                {{ opcion.label }}
              </option>
            </select>
          </label>

          <label v-if="esCredito">
            Fecha de vencimiento *
            <input v-model="form.fecha_vencimiento" data-test="field-fecha_vencimiento" type="date" />
          </label>

          <label class="full">
            Observaciones
            <textarea v-model="form.observaciones" data-test="field-observaciones" rows="2"></textarea>
          </label>
        </div>

        <section class="lineas">
          <div class="lineas__header">
            <h3>Productos</h3>
            <button data-test="add-linea" type="button" class="btn btn--small" @click="addLinea">
              + Agregar línea
            </button>
          </div>

          <p v-if="!tieneTipo" class="hint">Cargando tipos…</p>

          <div v-for="(linea, index) in form.detalle" :key="index" class="linea" data-test="linea">
            <label class="linea__tipo">
              Tipo
              <select
                :value="linea.tipo_id"
                :data-test="`linea-tipo_id-${index}`"
                @change="onTipoChange(linea, $event.target.value)"
              >
                <option value="">Sin tipo</option>
                <option v-for="tipo in tipos" :key="tipo.id" :value="tipo.id">{{ tipo.nombre }}</option>
              </select>
            </label>

            <label class="linea__desc">
              Descripción
              <input v-model="linea.descripcion" :data-test="`linea-descripcion-${index}`" type="text" />
            </label>

            <label>
              Cant.
              <input v-model.number="linea.cantidad" :data-test="`linea-cantidad-${index}`" type="number" min="1" />
            </label>

            <label>
              Precio
              <input v-model.number="linea.precio_unitario" :data-test="`linea-precio_unitario-${index}`" type="number" min="0" />
            </label>

            <label>
              Dto. %
              <input v-model.number="linea.descuento_porcentaje" :data-test="`linea-descuento_porcentaje-${index}`" type="number" min="0" max="100" />
            </label>

            <label>
              IVA %
              <select v-model.number="linea.iva_porcentaje" :data-test="`linea-iva_porcentaje-${index}`">
                <option v-for="iva in IVAS" :key="iva" :value="iva">{{ iva }}</option>
              </select>
            </label>

            <button
              data-test="remove-linea"
              type="button"
              class="btn btn--small btn--danger"
              :disabled="form.detalle.length === 1"
              @click="removeLinea(index)"
            >
              ×
            </button>
          </div>
        </section>

        <p v-if="error" data-test="form-error" class="error">{{ error }}</p>

        <footer class="modal__footer">
          <button data-test="cancel" type="button" class="btn" @click="emit('close')">Cancelar</button>
          <button data-test="submit" type="submit" class="btn btn--primary" :disabled="loading">
            {{ loading ? 'Guardando...' : submitLabel }}
          </button>
        </footer>
      </form>
    </div>
  </div>
  </Transition>
</template>

<style scoped>
.modal { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50; }
.modal__backdrop { position: absolute; inset: 0; background: rgb(17 24 39 / 50%); }
.modal__panel { position: relative; width: 100%; max-width: 860px; max-height: 92vh; overflow-y: auto; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgb(0 0 0 / 20%); }
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
h2, h3 { margin: 0; font-size: 1.1rem; }
h3 { font-size: 0.95rem; }
.modal__close { border: 0; background: transparent; font-size: 1.6rem; cursor: pointer; color: #6b7280; }
.modal__body { padding: 20px; }
.grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.grid .full { grid-column: 1 / -1; }
label { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; font-weight: 600; color: #374151; }
input, select, textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; font: inherit; }
.lineas { margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 14px; }
.lineas__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.linea { display: grid; grid-template-columns: 1.2fr 2fr 0.6fr 0.9fr 0.7fr 0.6fr auto; gap: 8px; align-items: end; margin-bottom: 10px; }
.hint { color: #6b7280; font-size: 0.85rem; }
.error { color: #b91c1c; background: #fef2f2; border-radius: 6px; padding: 8px 10px; font-size: 0.9rem; }
.modal__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.btn--small { padding: 6px 10px; font-size: 0.85rem; }
.btn--danger { color: #b91c1c; border-color: #fca5a5; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
@media (max-width: 700px) { .grid, .linea { grid-template-columns: 1fr; } }
</style>
