<script setup>
import { computed, ref, watch } from 'vue'
import ModalBase from '../../../shared/ui/ModalBase.vue'
import { useModalA11y } from '../../../shared/composables/useModalA11y'
import { useFacturaForm } from '../composables/useFacturaForm'
import FacturaEncabezado from './FacturaEncabezado.vue'
import FacturaLineas from './FacturaLineas.vue'
import { IVAS } from '../utils/facturaCampos'

const props = defineProps({
  open: { type: Boolean, default: false },
  titulo: { type: String, default: 'Nueva factura' },
  modelValue: { type: Object, default: () => ({}) },
  clientes: { type: Array, default: () => [] },
  clienteQuery: { type: String, default: '' },
  empresas: { type: Array, default: () => [] },
  bodegas: { type: Array, default: () => [] },
  tipos: { type: Array, default: () => [] },
  submitLabel: { type: String, default: 'Guardar' },
  loading: { type: Boolean, default: false },
  serverErrors: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['update:modelValue', 'submit', 'close', 'buscar-cliente'])
useModalA11y(computed(() => props.open), () => emit('close'))

const {
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
  handleSubmit,
} = useFacturaForm(props, emit)

const empresaSeleccionada = ref('')

function sincronizarEmpresa() {
  if (!props.empresas.length) {
    empresaSeleccionada.value = ''
    return
  }
  const bodegaActual = props.bodegas.find((b) => String(b.id) === String(form.bodega_id))
  empresaSeleccionada.value = String(bodegaActual?.empresa_id ?? props.modelValue?.empresa_id ?? '')
}

watch(() => props.open, (abierto) => {
  if (abierto) sincronizarEmpresa()
}, { immediate: true })

watch(empresaSeleccionada, (nueva) => {
  if (!props.empresas.length || !form.bodega_id) return
  const bodegaActual = props.bodegas.find((b) => String(b.id) === String(form.bodega_id))
  if (bodegaActual && String(bodegaActual.empresa_id) !== String(nueva)) {
    form.bodega_id = ''
    marca('bodega_id')
  }
})

const bodegasFiltradas = computed(() => {
  if (!props.empresas.length || !empresaSeleccionada.value) return props.bodegas
  return props.bodegas.filter((b) => String(b.empresa_id) === String(empresaSeleccionada.value))
})
</script>

<template>
  <ModalBase
    :open="open"
    test-id="factura-form"
    :label="titulo"
    @close="emit('close')"
  >
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
      <FacturaEncabezado
        :form="form"
        :errores="errores"
        :clientes="clientes"
        :cliente-query="clienteQuery"
        :empresas="empresas"
        v-model:empresa-id="empresaSeleccionada"
        :bodegas="bodegasFiltradas"
        :es-credito="esCredito"
        @marcar="marca"
        @buscar-cliente="emit('buscar-cliente', $event)"
      />

      <FacturaLineas
        :lineas="form.detalle"
        :errores="errores"
        :tipos-disponibles="tiposDisponibles"
        :tiene-tipo="tieneTipo"
        :bodega-id="form.bodega_id"
        :ivas="IVAS"
        @add="addLinea"
        @remove="removeLinea"
        @select-tipo="onTipoChange($event.linea, $event.tipo, $event.index)"
        @marcar="marca"
      />

      <footer class="modal__footer">
        <small v-if="!formularioValido && !loading" class="campo-hint form-hint" data-test="form-hint">
          Completa los campos marcados para guardar.
        </small>
        <button data-test="cancel" type="button" class="btn" @click="emit('close')">Cancelar</button>
        <button data-test="submit" type="submit" class="btn btn--primary" :disabled="loading || !formularioValido">
          {{ loading ? 'Guardando...' : submitLabel }}
        </button>
      </footer>
    </form>
  </ModalBase>
</template>

<style scoped>
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
h2 { margin: 0; font-size: 1.1rem; }
.modal__close { border: 0; background: transparent; font-size: 1.6rem; cursor: pointer; color: #6b7280; }
.modal__body { padding: 20px; }
.modal__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
.modal__footer .form-hint { margin-right: auto; align-self: center; color: #92400e; font-size: 0.8rem; }

@media (max-width: 700px) {
  .modal__body { padding: 14px; }
}
</style>
