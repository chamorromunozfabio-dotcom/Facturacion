import { computed, reactive, watch } from 'vue'
import {
  aplicarErroresServidor,
  clavesDelFormulario,
  defaults,
  emptyLinea,
  validarFormulario,
} from '../utils/facturaCampos'

/**
 * Estado y reglas del formulario de factura. El componente solo dibuja el modal
 * y conecta el encabezado con las líneas.
 */
export function useFacturaForm(props, emit) {
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

  // Cada bodega tiene su catálogo; los tipos generales (sin bodega) también valen.
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

  /** El botón guardar queda deshabilitado mientras haya datos vacíos o mal escritos. */
  const formularioValido = computed(
    () => Object.keys(validarFormulario(form, esCredito.value)).length === 0,
  )

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

  // Si cambian la bodega, un producto de otra bodega ya no es válido.
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

  /** Actualiza el aviso del campo apenas el usuario lo cambia, sin tocar los demás. */
  function revalidar(clave) {
    if (!tocados.has(clave)) return
    if (clave === 'detalle') {
      if (form.detalle.length) delete errores[clave]
      return
    }
    // Recalcula todo el formulario (es chico) y toma solo el aviso del campo tocado.
    const nuevos = validarFormulario(form, esCredito.value)
    if (nuevos[clave]) errores[clave] = nuevos[clave]
    else delete errores[clave]
  }

  function marca(clave) {
    tocados.add(clave)
    revalidar(clave)
  }

  function marcaLinea(index, campo) {
    marca(`linea_${index}_${campo}`)
  }

  watch(() => props.serverErrors, (nuevos) => aplicarErroresServidor(errores, nuevos), {
    deep: true,
    immediate: true,
  })
  watch(esCredito, (credito) => {
    if (!credito) delete errores.fecha_vencimiento
  })

  function validar() {
    for (const clave of clavesDelFormulario(form)) tocados.add(clave)
    const nuevos = validarFormulario(form, esCredito.value)

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

  return {
    form,
    errores,
    tiposDisponibles,
    tieneTipo,
    esCredito,
    formularioValido,
    addLinea,
    removeLinea,
    onTipoChange,
    marca,
    validar,
    handleSubmit,
  }
}
