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

// Todos los datos empiezan vacíos: el usuario debe completarlos
// (la única excepción es observaciones).
const emptyLinea = () => ({
  tipo_id: '',
  descripcion: '',
  unidad_medida: '',
  cantidad: '',
  precio_unitario: '',
  descuento_porcentaje: '',
  iva_porcentaje: '',
})

const defaults = () => ({
  cliente_id: '',
  bodega_id: '',
  forma_pago: '',
  medio_pago: '',
  fecha_vencimiento: '',
  observaciones: '',
  detalle: [emptyLinea()],
})

const form = reactive(defaults())
const errores = reactive({})
const resumen = ref('')

function limpiarErrores() {
  Object.keys(errores).forEach((clave) => delete errores[clave])
  resumen.value = ''
}

function loadModel(value) {
  const initial = { ...value }
  if (Array.isArray(initial.detalle)) {
    initial.detalle = initial.detalle.map((linea) => ({ ...emptyLinea(), ...linea }))
  }
  // El backend acepta "crédito" con tilde; el selector usa "credito".
  if (initial.forma_pago === 'crédito') initial.forma_pago = 'credito'
  if (initial.medio_pago == null) initial.medio_pago = ''
  Object.assign(form, defaults(), initial)
  if (!form.detalle.length) form.detalle = [emptyLinea()]
  limpiarErrores()
}

loadModel(props.modelValue)

watch(() => props.modelValue, loadModel, { deep: true })
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) loadModel(props.modelValue)
  },
)

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
  const nuevos = {}

  if (!form.cliente_id) {
    nuevos.cliente_id = 'Falta seleccionar el cliente: elige quién recibe la factura.'
  }
  if (!form.bodega_id) {
    nuevos.bodega_id = 'Falta seleccionar la bodega: elige desde dónde se despacha.'
  }
  if (!form.forma_pago) {
    nuevos.forma_pago = 'Falta seleccionar la forma de pago: elige contado o crédito.'
  }
  if (!form.medio_pago) {
    nuevos.medio_pago = 'Falta seleccionar el medio de pago: elige efectivo, transferencia o tarjeta.'
  }
  if (!String(form.fecha_vencimiento ?? '').trim()) {
    nuevos.fecha_vencimiento = 'Falta la fecha de vencimiento: escribe la fecha límite de pago (AAAA-MM-DD).'
  }
  if (!form.detalle.length) {
    nuevos.detalle = 'Falta agregar al menos una línea de producto: la factura necesita un producto para facturar.'
  }

  form.detalle.forEach((linea, index) => {
    const numero = index + 1
    const clave = `linea_${index}_`

    if (!linea.tipo_id) {
      nuevos[clave + 'tipo'] = `Falta el tipo de producto en la línea ${numero}: selecciona un tipo de la lista.`
    }
    if (!String(linea.descripcion ?? '').trim()) {
      nuevos[clave + 'descripcion'] = `Falta la descripción del producto en la línea ${numero}: escribe qué producto se está entregando.`
    }
    if (!String(linea.unidad_medida ?? '').trim()) {
      nuevos[clave + 'unidad_medida'] = `Falta la unidad de medida en la línea ${numero}: escribe UND, KG, CAJA u otra unidad.`
    }

    const cantidad = String(linea.cantidad ?? '').trim()
    if (!cantidad) {
      nuevos[clave + 'cantidad'] = `Falta la cantidad en la línea ${numero}: escribe cuántas unidades se entregan (mayor que 0).`
    } else if (Number(cantidad) <= 0) {
      nuevos[clave + 'cantidad'] = `La cantidad de la línea ${numero} debe ser mayor que 0: revisa el valor escrito.`
    }

    const precio = String(linea.precio_unitario ?? '').trim()
    if (!precio) {
      nuevos[clave + 'precio_unitario'] = `Falta el precio unitario en la línea ${numero}: escribe el precio de una unidad sin IVA (puede ser 0).`
    } else if (Number(precio) < 0) {
      nuevos[clave + 'precio_unitario'] = `El precio unitario de la línea ${numero} no puede ser negativo: revisa el valor escrito.`
    }

    const descuento = String(linea.descuento_porcentaje ?? '').trim()
    if (!descuento) {
      nuevos[clave + 'descuento_porcentaje'] = `Falta el descuento porcentual en la línea ${numero}: escribe 0 si no hay descuento.`
    } else if (Number(descuento) < 0 || Number(descuento) > 100) {
      nuevos[clave + 'descuento_porcentaje'] = `El descuento de la línea ${numero} debe estar entre 0 y 100: revisa el valor escrito.`
    }

    const iva = String(linea.iva_porcentaje ?? '').trim()
    if (!iva) {
      nuevos[clave + 'iva_porcentaje'] = `Falta el IVA en la línea ${numero}: selecciona 0, 5 o 19.`
    } else if (!IVAS.includes(Number(iva))) {
      nuevos[clave + 'iva_porcentaje'] = `El IVA de la línea ${numero} debe ser 0, 5 o 19: selecciona una opción válida.`
    }
  })

  Object.keys(errores).forEach((clave) => {
    if (!(clave in nuevos)) delete errores[clave]
  })
  Object.assign(errores, nuevos)

  const mensajes = Object.values(nuevos)
  resumen.value = mensajes.length
    ? `Faltan ${mensajes.length} dato(s) por completar: ${mensajes.join(' ')}`
    : ''
  return resumen.value
}

function handleSubmit() {
  if (validar()) return

  const payload = {
    cliente_id: Number(form.cliente_id),
    bodega_id: Number(form.bodega_id),
    forma_pago: form.forma_pago,
    medio_pago: form.medio_pago,
    fecha_vencimiento: form.fecha_vencimiento,
    observaciones: String(form.observaciones ?? '').trim() || null,
    detalle: form.detalle.map((linea) => ({
      tipo_id: Number(linea.tipo_id),
      descripcion: String(linea.descripcion).trim(),
      unidad_medida: String(linea.unidad_medida).trim(),
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

        <form class="modal__body" novalidate @submit.prevent="handleSubmit">
          <div class="grid">
            <label>
              Cliente *
              <select v-model="form.cliente_id" data-test="field-cliente_id">
                <option value="">Selecciona el cliente…</option>
                <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                  {{ cliente.nombre }}
                </option>
              </select>
              <small v-if="errores.cliente_id" data-test="error-cliente_id" class="campo-error">{{ errores.cliente_id }}</small>
            </label>

            <label>
              Bodega *
              <select v-model="form.bodega_id" data-test="field-bodega_id">
                <option value="">Selecciona la bodega…</option>
                <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega.id">
                  {{ bodega.nombre }}
                </option>
              </select>
              <small v-if="errores.bodega_id" data-test="error-bodega_id" class="campo-error">{{ errores.bodega_id }}</small>
            </label>

            <label>
              Forma de pago *
              <select v-model="form.forma_pago" data-test="field-forma_pago">
                <option value="">Selecciona la forma de pago…</option>
                <option v-for="opcion in formaPagoOptions" :key="opcion.value" :value="opcion.value">
                  {{ opcion.label }}
                </option>
              </select>
              <small v-if="errores.forma_pago" data-test="error-forma_pago" class="campo-error">{{ errores.forma_pago }}</small>
            </label>

            <label>
              Medio de pago *
              <select v-model="form.medio_pago" data-test="field-medio_pago">
                <option value="">Selecciona el medio de pago…</option>
                <option v-for="opcion in medioPagoOptions" :key="opcion.value" :value="opcion.value">
                  {{ opcion.label }}
                </option>
              </select>
              <small v-if="errores.medio_pago" data-test="error-medio_pago" class="campo-error">{{ errores.medio_pago }}</small>
            </label>

            <label>
              Fecha de vencimiento *
              <input v-model="form.fecha_vencimiento" data-test="field-fecha_vencimiento" type="date" />
              <small v-if="errores.fecha_vencimiento" data-test="error-fecha_vencimiento" class="campo-error">{{ errores.fecha_vencimiento }}</small>
            </label>

            <label class="full">
              Observaciones (opcional)
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
            <p v-if="errores.detalle" data-test="error-detalle" class="campo-error">{{ errores.detalle }}</p>

            <div v-for="(linea, index) in form.detalle" :key="index" class="linea" data-test="linea">
              <label class="linea__tipo">
                Tipo *
                <select
                  :value="linea.tipo_id"
                  :data-test="`linea-tipo_id-${index}`"
                  @change="onTipoChange(linea, $event.target.value)"
                >
                  <option value="">Selecciona el tipo…</option>
                  <option v-for="tipo in tipos" :key="tipo.id" :value="tipo.id">{{ tipo.nombre }}</option>
                </select>
                <small v-if="errores[`linea_${index}_tipo`]" :data-test="`error-linea-${index}-tipo`" class="campo-error">{{ errores[`linea_${index}_tipo`] }}</small>
              </label>

              <label class="linea__desc">
                Descripción *
                <input v-model="linea.descripcion" :data-test="`linea-descripcion-${index}`" type="text" placeholder="Ej. Arroz 500 g" />
                <small v-if="errores[`linea_${index}_descripcion`]" :data-test="`error-linea-${index}-descripcion`" class="campo-error">{{ errores[`linea_${index}_descripcion`] }}</small>
              </label>

              <label class="linea__unidad">
                Unidad *
                <input v-model="linea.unidad_medida" :data-test="`linea-unidad_medida-${index}`" type="text" placeholder="UND" />
                <small v-if="errores[`linea_${index}_unidad_medida`]" :data-test="`error-linea-${index}-unidad_medida`" class="campo-error">{{ errores[`linea_${index}_unidad_medida`] }}</small>
              </label>

              <label>
                Cant. *
                <input v-model.number="linea.cantidad" :data-test="`linea-cantidad-${index}`" type="number" min="1" placeholder="Ej. 10" />
                <small v-if="errores[`linea_${index}_cantidad`]" :data-test="`error-linea-${index}-cantidad`" class="campo-error">{{ errores[`linea_${index}_cantidad`] }}</small>
              </label>

              <label>
                Precio *
                <input v-model.number="linea.precio_unitario" :data-test="`linea-precio_unitario-${index}`" type="number" min="0" placeholder="Ej. 3500" />
                <small v-if="errores[`linea_${index}_precio_unitario`]" :data-test="`error-linea-${index}-precio_unitario`" class="campo-error">{{ errores[`linea_${index}_precio_unitario`] }}</small>
              </label>

              <label>
                Dto. % *
                <input v-model.number="linea.descuento_porcentaje" :data-test="`linea-descuento_porcentaje-${index}`" type="number" min="0" max="100" placeholder="0" />
                <small v-if="errores[`linea_${index}_descuento_porcentaje`]" :data-test="`error-linea-${index}-descuento_porcentaje`" class="campo-error">{{ errores[`linea_${index}_descuento_porcentaje`] }}</small>
              </label>

              <label>
                IVA % *
                <select v-model.number="linea.iva_porcentaje" :data-test="`linea-iva_porcentaje-${index}`">
                  <option value="">Selecciona…</option>
                  <option v-for="iva in IVAS" :key="iva" :value="iva">{{ iva }}</option>
                </select>
                <small v-if="errores[`linea_${index}_iva_porcentaje`]" :data-test="`error-linea-${index}-iva_porcentaje`" class="campo-error">{{ errores[`linea_${index}_iva_porcentaje`] }}</small>
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

          <p v-if="resumen" data-test="form-error" class="error">{{ resumen }}</p>

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
.linea { display: grid; grid-template-columns: 1.1fr 1.8fr 0.7fr 0.55fr 0.8fr 0.7fr 0.55fr auto; gap: 8px; align-items: end; margin-bottom: 10px; }
.hint { color: #6b7280; font-size: 0.85rem; }
.campo-error { color: #b91c1c; font-size: 0.78rem; font-weight: 500; line-height: 1.25; }
.error { color: #b91c1c; background: #fef2f2; border-radius: 6px; padding: 8px 10px; font-size: 0.9rem; }
.modal__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.btn--small { padding: 6px 10px; font-size: 0.85rem; }
.btn--danger { color: #b91c1c; border-color: #fca5a5; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
@media (max-width: 700px) { .grid, .linea { grid-template-columns: 1fr; } }
</style>
