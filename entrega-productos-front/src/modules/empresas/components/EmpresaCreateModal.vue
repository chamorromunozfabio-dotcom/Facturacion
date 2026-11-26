<script setup>
import { computed, reactive, watch } from 'vue'
import ModalBase from '../../../shared/ui/ModalBase.vue'
import { useModalA11y } from '../../../shared/composables/useModalA11y'
import {
  bloquearTecla,
  camposDe,
  limpiarValor,
  payloadDe,
  puedeRegistrar,
  validarCampo,
} from '../../auth/utils/registro'

const props = defineProps({
  open: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  error: { type: String, default: '' },
  fieldErrors: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'submit'])

useModalA11y(computed(() => props.open), () => emit('close'))

const campos = camposDe('empresa')
const form = reactive({
  razon_social: '',
  nit: '',
  telefono: '',
  direccion: '',
  representante: '',
  correo: '',
  contrasena: '',
  confirmar: '',
})
const errores = reactive({})
const tocados = reactive({})

function reset() {
  Object.keys(form).forEach((k) => { form[k] = '' })
  Object.keys(errores).forEach((k) => delete errores[k])
  Object.keys(tocados).forEach((k) => delete tocados[k])
}

watch(() => props.open, (abierto) => {
  if (abierto) reset()
})

watch(() => props.fieldErrors, (nuevos) => {
  Object.entries(nuevos ?? {}).forEach(([campo, mensaje]) => {
    errores[campo] = mensaje
    tocados[campo] = true
  })
}, { deep: true })

const puedeGuardar = computed(() => puedeRegistrar('empresa', form) && !props.saving)

function setValor(campo, valor) {
  form[campo.key] = limpiarValor(campo, valor)
  tocados[campo.key] = true
  const aviso = validarCampo(campo, form)
  if (aviso) errores[campo.key] = aviso
  else delete errores[campo.key]

  if (campo.key === 'contrasena' && tocados.confirmar) {
    const confirmar = campos.find((c) => c.key === 'confirmar')
    const avisoConfirmar = validarCampo(confirmar, form)
    if (avisoConfirmar) errores.confirmar = avisoConfirmar
    else delete errores.confirmar
  }
}

function submit() {
  for (const campo of campos) {
    tocados[campo.key] = true
    const aviso = validarCampo(campo, form)
    if (aviso) errores[campo.key] = aviso
  }
  if (!puedeRegistrar('empresa', form)) return
  emit('submit', payloadDe('empresa', form))
}
</script>

<template>
  <ModalBase
    :open="open"
    test-id="empresa-crear-modal"
    label="Nueva empresa"
    max-width="580px"
    @close="emit('close')"
  >
    <header class="modal__header">
      <h2>Nueva empresa</h2>
      <button type="button" class="modal__close" aria-label="Cerrar creación" @click="emit('close')">
        ×
      </button>
    </header>

    <form class="modal__body" @submit.prevent="submit">
      <p v-if="error" class="error" data-test="empresa-crear-error">{{ error }}</p>

      <div class="campos-grid">
        <div v-for="campo in campos" :key="campo.key" class="campo">
          <label :for="`empresa-${campo.key}`">{{ campo.label }} *</label>
          <input
            :id="`empresa-${campo.key}`"
            :data-test="`empresa-field-${campo.key}`"
            :type="campo.type || 'text'"
            :value="form[campo.key]"
            :placeholder="campo.hint"
            :inputmode="campo.digitsOnly ? 'numeric' : undefined"
            @keydown="bloquearTecla(campo, $event)"
            @input="setValor(campo, $event.target.value)"
          />
          <small v-if="tocados[campo.key] && errores[campo.key]" class="campo-error">
            {{ errores[campo.key] }}
          </small>
        </div>
      </div>

      <footer class="modal__footer">
        <button type="button" class="btn" @click="emit('close')">Cancelar</button>
        <button
          type="submit"
          class="btn btn--primary"
          data-test="empresa-crear-submit"
          :disabled="!puedeGuardar"
        >
          {{ saving ? 'Creando...' : 'Crear y activar empresa' }}
        </button>
      </footer>
    </form>
  </ModalBase>
</template>

<style scoped>
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
h2 { margin: 0; font-size: 1.1rem; }
.modal__close { border: 0; background: transparent; font-size: 1.6rem; cursor: pointer; color: #6b7280; }
.modal__body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.campos-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.campo { display: flex; flex-direction: column; gap: 4px; }
label { font-size: 0.82rem; font-weight: 600; color: #374151; }
input { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; font: inherit; }
.campo-error { color: #b91c1c; font-size: 0.76rem; }
.error { color: #b91c1c; background: #fef2f2; border-radius: 6px; padding: 8px 10px; font-size: 0.88rem; margin: 0; }
.modal__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
.btn { border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.btn--primary { background: #0f766e; border-color: #0f766e; color: #fff; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
@media (max-width: 540px) { .campos-grid { grid-template-columns: 1fr; } }
</style>
