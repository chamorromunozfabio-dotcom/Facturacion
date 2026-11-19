<script setup>
import { computed, reactive, watch } from 'vue'
import { useModalA11y } from '../composables/useModalA11y'
import TipoSearch from './TipoSearch.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  titulo: { type: String, default: 'Nueva factura' },
  modelValue: { type: Object, default: () => ({}) },
  clientes: { type: Array, default: () => [] },
  bodegas: { type: Array, default: () => [] },
  tipos: { type: Array, default: () => [] },
  submitLabel: { type: String, default: 'Guardar' },
  loading: { type: Boolean, default: false },
  serverErrors: { type: Object, default: () => ({}) },
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
const tocados = new Set()

function limpiarErrores() {
  Object.keys(errores).forEach((clave) => delete errores[clave])
  tocados.clear()
}

function loadModel(value) {
  const initial = { ...value }
  if (Array.isArray(initial.detalle)) {
    initial.detalle = initial.detalle.map((linea) => ({ ...emptyLinea(), ...linea }))
  }
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

// Cada bodega tiene su propio catálogo. El backend también permite usar tipos
// "generales" (sin bodega), así que los mostramos junto a los de la bodega.
// Si el backend todavía no devuelve bodega_id, mostramos todos como antes.
const tiposDisponibles = computed(() => {
  const todos = props.tipos ?? []
  if (!todos.length) return []
  const conBodega = todos.filter(
    (tipo) => tipo.bodega_id !== undefined && tipo.bodega_id !== null,
  )
  if (!conBodega.length) return todos
  const generales = todos.filter(
    (tipo) => tipo.bodega_id === undefined || tipo.bodega_id === null,
  )
  if (!form.bodega_id) return generales
  return [
    ...generales,
    ...conBodega.filter((tipo) => String(tipo.bodega_id) === String(form.bodega_id)),
  ]
})

const tieneTipo = computed(() => tiposDisponibles.value.length > 0)
const esCredito = computed(() => form.forma_pago === 'credito')

function addLinea() {
  form.detalle.push(emptyLinea())
}

function removeLinea(index) {
  form.detalle.splice(index, 1)
}

function onTipoChange(linea, tipo, index) {
  linea.tipo_id = tipo?.id ?? ''
  if (tipo) linea.descripcion = tipo.nombre
  marcaLinea(index, 'tipo')
  if (tipo) marcaLinea(index, 'descripcion')
}

// Si cambian la bodega, un tipo de otra bodega ya no es válido en la factura.
watch(
  () => form.bodega_id,
  () => {
    const permitidos = new Set(tiposDisponibles.value.map((tipo) => String(tipo.id)))
    form.detalle.forEach((linea, index) => {
      if (linea.tipo_id && !permitidos.has(String(linea.tipo_id))) {
        linea.tipo_id = ''
        marcaLinea(index, 'tipo')
      }
    })
  },
)

const MENSAJES = {
  cliente_id: 'Elige el cliente.',
  bodega_id: 'Elige la bodega.',
  forma_pago: 'Elige la forma de pago.',
  medio_pago: 'Elige el medio de pago.',
  fecha_vencimiento: 'Escribe la fecha límite.',
  fecha_invalida: 'Fecha no válida.',
  detalle: 'Agrega un producto.',
  observaciones: 'Máximo 1000 caracteres.',
}

const MENSAJES_LINEA = {
  tipo: 'Elige el tipo.',
  descripcion: 'Escribe la descripción.',
  descripcion_larga: 'Máximo 255 caracteres.',
  unidad_medida: 'Escribe la unidad.',
  unidad_larga: 'Máximo 20 caracteres.',
  cantidad: 'Escribe la cantidad.',
  cantidad_valor: 'Cantidad mayor que 0.',
  cantidad_decimales: 'Hasta 2 decimales.',
  precio_unitario: 'Escribe el precio.',
  precio_valor: 'Precio mayor o igual que 0.',
  precio_decimales: 'Hasta 2 decimales.',
  descuento_porcentaje: 'Escribe el descuento.',
  descuento_valor: 'Descuento 0 a 100.',
  iva_porcentaje: 'Elige el IVA.',
  iva_valor: 'IVA 0, 5 o 19.',
}

function esEnteroPositivo(valor) {
  if (String(valor ?? '').trim() === '') return false
  const numero = Number(valor)
  return Number.isInteger(numero) && numero > 0
}

function esNumero(valor) {
  const texto = String(valor ?? '').trim()
  return texto !== '' && Number.isFinite(Number(texto))
}

function masDeDosDecimales(valor) {
  return /\.(\d{3,})$/.test(String(valor).trim())
}

function esFechaValida(valor) {
  const texto = String(valor ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return false
  const [anio, mes, dia] = texto.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return (
    fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia
  )
}

function campoLineaValido(campo, linea) {
  switch (campo) {
    case 'tipo':
      return esEnteroPositivo(linea.tipo_id)
    case 'descripcion': {
      const texto = String(linea.descripcion ?? '').trim()
      return texto.length > 0 && texto.length <= 255
    }
    case 'unidad_medida': {
      const texto = String(linea.unidad_medida ?? '').trim()
      return texto.length > 0 && texto.length <= 20
    }
    case 'cantidad':
      return esNumero(linea.cantidad) && Number(linea.cantidad) > 0 && !masDeDosDecimales(linea.cantidad)
    case 'precio_unitario':
      return esNumero(linea.precio_unitario) && Number(linea.precio_unitario) >= 0 && !masDeDosDecimales(linea.precio_unitario)
    case 'descuento_porcentaje':
      return esNumero(linea.descuento_porcentaje) && Number(linea.descuento_porcentaje) >= 0 && Number(linea.descuento_porcentaje) <= 100
    case 'iva_porcentaje':
      return String(linea.iva_porcentaje ?? '').trim() !== '' && IVAS.includes(Number(linea.iva_porcentaje))
    default:
      return true
  }
}

function campoCabeceraValido(clave) {
  switch (clave) {
    case 'cliente_id':
      return esEnteroPositivo(form.cliente_id)
    case 'bodega_id':
      return esEnteroPositivo(form.bodega_id)
    case 'forma_pago':
      return !!form.forma_pago
    case 'medio_pago':
      return !!form.medio_pago
    case 'fecha_vencimiento':
      return !esCredito.value || esFechaValida(form.fecha_vencimiento)
    case 'observaciones':
      return String(form.observaciones ?? '').length <= 1000
    default:
      return true
  }
}

// Actualiza el aviso del campo apenas el usuario lo cambia, sin tocar los demás.
function revalidar(clave) {
  if (!tocados.has(clave)) return
  if (clave === 'detalle') {
    if (form.detalle.length) delete errores[clave]
    return
  }
  const coincidencia = clave.match(/^linea_(\d+)_(.+)$/)
  if (coincidencia) {
    const linea = form.detalle[Number(coincidencia[1])]
    if (!linea || campoLineaValido(coincidencia[2], linea)) delete errores[clave]
    return
  }
  if (campoCabeceraValido(clave)) delete errores[clave]
}

function marca(clave) {
  tocados.add(clave)
  revalidar(clave)
}

function marcaLinea(index, campo) {
  marca(`linea_${index}_${campo}`)
}

const CLAVES_LINEA = {
  tipo_id: 'tipo',
  descripcion: 'descripcion',
  unidad_medida: 'unidad_medida',
  cantidad: 'cantidad',
  precio_unitario: 'precio_unitario',
  descuento_porcentaje: 'descuento_porcentaje',
  iva_porcentaje: 'iva_porcentaje',
}

const MENSAJES_SERVIDOR = {
  cliente_id: MENSAJES.cliente_id,
  bodega_id: MENSAJES.bodega_id,
  forma_pago: MENSAJES.forma_pago,
  medio_pago: MENSAJES.medio_pago,
  fecha_vencimiento: MENSAJES.fecha_vencimiento,
  detalle: MENSAJES.detalle,
  observaciones: MENSAJES.observaciones,
  general: 'Revisa la factura.',
}

const MENSAJES_SERVIDOR_LINEA = {
  tipo: MENSAJES_LINEA.tipo,
  descripcion: MENSAJES_LINEA.descripcion,
  unidad_medida: MENSAJES_LINEA.unidad_medida,
  cantidad: MENSAJES_LINEA.cantidad,
  precio_unitario: MENSAJES_LINEA.precio_unitario,
  descuento_porcentaje: MENSAJES_LINEA.descuento_porcentaje,
  iva_porcentaje: MENSAJES_LINEA.iva_porcentaje,
}

function mensajeServidor(clave) {
  const coincidencia = clave.match(/^detalle\[(\d+)\]\.(.+)$/)
  if (coincidencia) {
    const campo = CLAVES_LINEA[coincidencia[2]] || coincidencia[2]
    return MENSAJES_SERVIDOR_LINEA[campo] || 'Revisa el producto.'
  }
  return MENSAJES_SERVIDOR[clave] || 'Revisa este dato.'
}

function aplicarErroresServidor(nuevos = {}) {
  const convertidos = {}
  for (const [clave] of Object.entries(nuevos)) {
    const interna = clave.match(/^detalle\[(\d+)\]\.(.+)$/)
      ? `linea_${clave.match(/^detalle\[(\d+)\]/)[1]}_${CLAVES_LINEA[clave.split('.')[1]] || clave.split('.')[1]}`
      : clave
    convertidos[interna] = mensajeServidor(clave)
  }
  Object.assign(errores, convertidos)
}

watch(() => props.serverErrors, aplicarErroresServidor, { deep: true, immediate: true })
watch(esCredito, (credito) => {
  if (!credito) delete errores.fecha_vencimiento
})

function validar() {
  const nuevos = {}
  for (const clave of ['cliente_id', 'bodega_id', 'forma_pago', 'medio_pago', 'fecha_vencimiento', 'observaciones']) {
    tocados.add(clave)
  }
  form.detalle.forEach((_, index) => {
    for (const campo of ['tipo', 'descripcion', 'unidad_medida', 'cantidad', 'precio_unitario', 'descuento_porcentaje', 'iva_porcentaje']) {
      tocados.add(`linea_${index}_${campo}`)
    }
  })

  if (!esEnteroPositivo(form.cliente_id)) nuevos.cliente_id = MENSAJES.cliente_id
  if (!esEnteroPositivo(form.bodega_id)) nuevos.bodega_id = MENSAJES.bodega_id
  if (!form.forma_pago) nuevos.forma_pago = MENSAJES.forma_pago
  if (!form.medio_pago) nuevos.medio_pago = MENSAJES.medio_pago

  if (esCredito.value) {
    if (!String(form.fecha_vencimiento ?? '').trim()) {
      nuevos.fecha_vencimiento = MENSAJES.fecha_vencimiento
    } else if (!esFechaValida(form.fecha_vencimiento)) {
      nuevos.fecha_vencimiento = MENSAJES.fecha_invalida
    }
  }

  if (String(form.observaciones ?? '').length > 1000) {
    nuevos.observaciones = MENSAJES.observaciones
  }
  if (!form.detalle.length) nuevos.detalle = MENSAJES.detalle

  form.detalle.forEach((linea, index) => {
    const clave = `linea_${index}_`

    if (!esEnteroPositivo(linea.tipo_id)) nuevos[clave + 'tipo'] = MENSAJES_LINEA.tipo

    const descripcion = String(linea.descripcion ?? '').trim()
    if (!descripcion) nuevos[clave + 'descripcion'] = MENSAJES_LINEA.descripcion
    else if (descripcion.length > 255) nuevos[clave + 'descripcion'] = MENSAJES_LINEA.descripcion_larga

    const unidad = String(linea.unidad_medida ?? '').trim()
    if (!unidad) nuevos[clave + 'unidad_medida'] = MENSAJES_LINEA.unidad_medida
    else if (unidad.length > 20) nuevos[clave + 'unidad_medida'] = MENSAJES_LINEA.unidad_larga

    const cantidad = String(linea.cantidad ?? '').trim()
    if (!cantidad) nuevos[clave + 'cantidad'] = MENSAJES_LINEA.cantidad
    else if (!esNumero(cantidad) || Number(cantidad) <= 0) {
      nuevos[clave + 'cantidad'] = MENSAJES_LINEA.cantidad_valor
    } else if (masDeDosDecimales(cantidad)) {
      nuevos[clave + 'cantidad'] = MENSAJES_LINEA.cantidad_decimales
    }

    const precio = String(linea.precio_unitario ?? '').trim()
    if (!precio) nuevos[clave + 'precio_unitario'] = MENSAJES_LINEA.precio_unitario
    else if (!esNumero(precio) || Number(precio) < 0) {
      nuevos[clave + 'precio_unitario'] = MENSAJES_LINEA.precio_valor
    } else if (masDeDosDecimales(precio)) {
      nuevos[clave + 'precio_unitario'] = MENSAJES_LINEA.precio_decimales
    }

    const descuento = String(linea.descuento_porcentaje ?? '').trim()
    if (!descuento) nuevos[clave + 'descuento_porcentaje'] = MENSAJES_LINEA.descuento_porcentaje
    else if (!esNumero(descuento) || Number(descuento) < 0 || Number(descuento) > 100) {
      nuevos[clave + 'descuento_porcentaje'] = MENSAJES_LINEA.descuento_valor
    }

    const iva = String(linea.iva_porcentaje ?? '').trim()
    if (!iva) nuevos[clave + 'iva_porcentaje'] = MENSAJES_LINEA.iva_porcentaje
    else if (!IVAS.includes(Number(iva))) nuevos[clave + 'iva_porcentaje'] = MENSAJES_LINEA.iva_valor
  })

  Object.keys(errores).forEach((clave) => {
    if (!(clave in nuevos)) delete errores[clave]
  })
  Object.assign(errores, nuevos)
  return Object.keys(nuevos).length === 0
}

function handleSubmit() {
  if (!validar()) return

  const payload = {
    cliente_id: Number(form.cliente_id),
    bodega_id: Number(form.bodega_id),
    forma_pago: form.forma_pago,
    medio_pago: form.medio_pago,
    fecha_vencimiento: esCredito.value ? form.fecha_vencimiento : null,
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
              <select v-model="form.cliente_id" data-test="field-cliente_id" @change="marca('cliente_id')">
                <option value="">Selecciona el cliente…</option>
                <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
                  {{ cliente.nombre }}
                </option>
              </select>
              <small v-if="errores.cliente_id" data-test="error-cliente_id" class="campo-error">{{ errores.cliente_id }}</small>
            </label>

            <label>
              Bodega *
              <select v-model="form.bodega_id" data-test="field-bodega_id" @change="marca('bodega_id')">
                <option value="">Selecciona la bodega…</option>
                <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega.id">
                  {{ bodega.nombre }}
                </option>
              </select>
              <small v-if="errores.bodega_id" data-test="error-bodega_id" class="campo-error">{{ errores.bodega_id }}</small>
            </label>

            <label>
              Forma de pago *
              <select v-model="form.forma_pago" data-test="field-forma_pago" @change="marca('forma_pago')">
                <option value="">Selecciona la forma de pago…</option>
                <option v-for="opcion in formaPagoOptions" :key="opcion.value" :value="opcion.value">
                  {{ opcion.label }}
                </option>
              </select>
              <small v-if="errores.forma_pago" data-test="error-forma_pago" class="campo-error">{{ errores.forma_pago }}</small>
            </label>

            <label>
              Medio de pago *
              <select v-model="form.medio_pago" data-test="field-medio_pago" @change="marca('medio_pago')">
                <option value="">Selecciona el medio de pago…</option>
                <option v-for="opcion in medioPagoOptions" :key="opcion.value" :value="opcion.value">
                  {{ opcion.label }}
                </option>
              </select>
              <small v-if="errores.medio_pago" data-test="error-medio_pago" class="campo-error">{{ errores.medio_pago }}</small>
            </label>

            <label v-if="esCredito">
              Fecha de vencimiento *
              <input v-model="form.fecha_vencimiento" data-test="field-fecha_vencimiento" type="date" @change="marca('fecha_vencimiento')" />
              <small v-if="errores.fecha_vencimiento" data-test="error-fecha_vencimiento" class="campo-error">{{ errores.fecha_vencimiento }}</small>
            </label>

            <label class="full">
              Observaciones (opcional)
              <textarea v-model="form.observaciones" data-test="field-observaciones" rows="2" @input="marca('observaciones')"></textarea>
              <small v-if="errores.observaciones" data-test="error-observaciones" class="campo-error">{{ errores.observaciones }}</small>
            </label>
          </div>

          <section class="lineas">
            <div class="lineas__header">
              <h3>Productos</h3>
              <button data-test="add-linea" type="button" class="btn btn--small" @click="addLinea">
                + Agregar línea
              </button>
            </div>

            <p v-if="!tieneTipo" class="hint">
              {{ form.bodega_id ? 'Cargando tipos de la bodega…' : 'Elige una bodega para ver sus tipos.' }}
            </p>
            <p v-if="errores.detalle" data-test="error-detalle" class="campo-error">{{ errores.detalle }}</p>
            <p v-if="errores.general" data-test="error-general" class="campo-error">{{ errores.general }}</p>

            <div v-for="(linea, index) in form.detalle" :key="index" class="linea" data-test="linea">
              <label class="linea__tipo">
                Tipo *
                <TipoSearch
                  :tipos="tiposDisponibles"
                  :model-value="linea.tipo_id"
                  :data-test="`linea-tipo_id-${index}`"
                  @update:model-value="linea.tipo_id = $event"
                  @select="onTipoChange(linea, $event, index)"
                />
                <small v-if="errores[`linea_${index}_tipo`]" :data-test="`error-linea-${index}-tipo`" class="campo-error">{{ errores[`linea_${index}_tipo`] }}</small>
              </label>

              <label class="linea__desc">
                Descripción *
                <input v-model="linea.descripcion" :data-test="`linea-descripcion-${index}`" type="text" placeholder="Ej. Arroz 500 g" @input="marcaLinea(index, 'descripcion')" />
                <small v-if="errores[`linea_${index}_descripcion`]" :data-test="`error-linea-${index}-descripcion`" class="campo-error">{{ errores[`linea_${index}_descripcion`] }}</small>
              </label>

              <label class="linea__unidad">
                Unidad *
                <input v-model="linea.unidad_medida" :data-test="`linea-unidad_medida-${index}`" type="text" placeholder="UND" @input="marcaLinea(index, 'unidad_medida')" />
                <small v-if="errores[`linea_${index}_unidad_medida`]" :data-test="`error-linea-${index}-unidad_medida`" class="campo-error">{{ errores[`linea_${index}_unidad_medida`] }}</small>
              </label>

              <label>
                Cant. *
                <input v-model.number="linea.cantidad" :data-test="`linea-cantidad-${index}`" type="number" min="1" step="0.01" placeholder="Ej. 10" @input="marcaLinea(index, 'cantidad')" />
                <small v-if="errores[`linea_${index}_cantidad`]" :data-test="`error-linea-${index}-cantidad`" class="campo-error">{{ errores[`linea_${index}_cantidad`] }}</small>
              </label>

              <label>
                Precio *
                <input v-model.number="linea.precio_unitario" :data-test="`linea-precio_unitario-${index}`" type="number" min="0" step="0.01" placeholder="Ej. 3500" @input="marcaLinea(index, 'precio_unitario')" />
                <small v-if="errores[`linea_${index}_precio_unitario`]" :data-test="`error-linea-${index}-precio_unitario`" class="campo-error">{{ errores[`linea_${index}_precio_unitario`] }}</small>
              </label>

              <label>
                Dto. % *
                <input v-model.number="linea.descuento_porcentaje" :data-test="`linea-descuento_porcentaje-${index}`" type="number" min="0" max="100" step="0.01" placeholder="0" @input="marcaLinea(index, 'descuento_porcentaje')" />
                <small v-if="errores[`linea_${index}_descuento_porcentaje`]" :data-test="`error-linea-${index}-descuento_porcentaje`" class="campo-error">{{ errores[`linea_${index}_descuento_porcentaje`] }}</small>
              </label>

              <label>
                IVA % *
                <select v-model.number="linea.iva_porcentaje" :data-test="`linea-iva_porcentaje-${index}`" @change="marcaLinea(index, 'iva_porcentaje')">
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
.modal__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.btn--small { padding: 6px 10px; font-size: 0.85rem; }
.btn--danger { color: #b91c1c; border-color: #fca5a5; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
@media (max-width: 700px) { .grid, .linea { grid-template-columns: 1fr; } }
</style>
