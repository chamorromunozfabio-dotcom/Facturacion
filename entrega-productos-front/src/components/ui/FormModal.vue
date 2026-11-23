<script setup>
import { computed, reactive, watch } from 'vue'
import ModalBase from './ModalBase.vue'
import BotonBase from './BotonBase.vue'
import { useModalA11y } from '../../composables/useModalA11y'

/**
 * Modal reutilizable para crear o editar cualquier registro.
 * No guarda nada: avisa al padre con submit y close.
 *
 * fields: [{ key: 'nombre', label: 'Nombre', required: true, type: 'text' }]
 * Se usa con v-model:modelValue para recibir y devolver los valores.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  fields: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  submitLabel: { type: String, default: 'Guardar' },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'submit', 'close'])

useModalA11y(computed(() => props.open), () => emit('close'))

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toRegExp(pattern) {
  return pattern instanceof RegExp ? pattern : new RegExp(pattern)
}

const form = reactive({ ...props.modelValue })
const errores = reactive({})
const tocados = new Set()

function limpiarErrores() {
  Object.keys(errores).forEach((clave) => delete errores[clave])
  tocados.clear()
}

watch(
  () => props.modelValue,
  (value) => Object.assign(form, value),
  { deep: true },
)

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      Object.assign(form, props.modelValue)
      limpiarErrores()
    }
  },
)

function mensaje(field, tipo = 'requerido') {
  const avisos = {
    requerido: `Escribe ${field.label.toLowerCase()}.`,
    longitud: `Máximo ${field.maxLength} caracteres.`,
    formato: field.message || 'Dato no válido.',
    numero: 'Escribe un número.',
    entero: 'Debe ser un número entero.',
    minimo: `Mínimo ${field.min}.`,
    maximo: `Máximo ${field.max}.`,
  }
  return avisos[tipo] || avisos.requerido
}

function esNumerico(valor) {
  const texto = String(valor ?? '').trim()
  return texto !== '' && Number.isFinite(Number(texto))
}

function validarCampo(field) {
  const valor = form[field.key] ?? ''
  const texto = String(valor).trim()
  if (field.required && texto === '') return mensaje(field, 'requerido')
  if (!texto) return ''
  if (field.maxLength && texto.length > field.maxLength) return mensaje(field, 'longitud')
  if (field.type === 'email' && !EMAIL_RE.test(texto)) return mensaje(field, 'formato')
  if (field.pattern && !toRegExp(field.pattern).test(texto)) return mensaje(field, 'formato')
  if (field.type === 'number' && !esNumerico(valor)) return mensaje(field, 'numero')
  if (field.type === 'number' && field.integer && !Number.isInteger(Number(valor))) {
    return mensaje(field, 'entero')
  }
  if (field.type === 'number' && field.min != null && Number(valor) < field.min) {
    return mensaje(field, 'minimo')
  }
  if (field.type === 'number' && field.max != null && Number(valor) > field.max) {
    return mensaje(field, 'maximo')
  }
  return ''
}

function setValue(key, value) {
  form[key] = value
  if (tocados.has(key)) {
    const aviso = validarCampo(props.fields.find((f) => f.key === key))
    if (aviso) errores[key] = aviso
    else delete errores[key]
  }
  emit('update:modelValue', { ...form })
}

function handleSubmit() {
  for (const field of props.fields) {
    const aviso = validarCampo(field)
    tocados.add(field.key)
    if (aviso) errores[field.key] = aviso
    else delete errores[field.key]
  }

  if (Object.keys(errores).length) return

  const payload = {}
  for (const field of props.fields) {
    const raw = form[field.key] ?? ''
    payload[field.key] = typeof raw === 'string' ? raw.trim() : raw
  }

  emit('update:modelValue', payload)
  emit('submit', payload)
}
</script>

<template>
  <ModalBase
    :open="open"
    test-id="modal"
    :label="title"
    max-width="600px"
    @close="emit('close')"
  >
    <header class="modal__header">
      <h2>{{ title }}</h2>
      <BotonBase
        data-test="close-x"
        type="button"
        class="modal__close"
        aria-label="Cerrar ventana"
        @click="emit('close')"
      >
        ×
      </BotonBase>
    </header>

    <form class="modal__body" @submit.prevent="handleSubmit">
      <div v-for="field in fields" :key="field.key" class="modal__field">
        <label :for="`field-${field.key}`">
          {{ field.label }}
          <span v-if="field.required">*</span>
        </label>

        <textarea
          v-if="field.type === 'textarea'"
          :id="`field-${field.key}`"
          :data-test="`field-${field.key}`"
          :value="form[field.key] ?? ''"
          :placeholder="field.placeholder || ''"
          @input="setValue(field.key, $event.target.value)"
        />

        <select
          v-else-if="field.type === 'select'"
          :id="`field-${field.key}`"
          :data-test="`field-${field.key}`"
          :value="form[field.key] ?? ''"
          @change="setValue(field.key, $event.target.value)"
        >
          <option v-for="option in field.options" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>

        <input
          v-else
          :id="`field-${field.key}`"
          :data-test="`field-${field.key}`"
          :type="field.type || 'text'"
          :value="form[field.key] ?? ''"
          :placeholder="field.placeholder || ''"
          @input="setValue(field.key, $event.target.value)"
        />

        <small v-if="errores[field.key]" :data-test="`error-${field.key}`" class="campo-error">
          {{ errores[field.key] }}
        </small>
      </div>

      <footer class="modal__footer">
        <BotonBase data-test="cancel" type="button" class="btn" @click="emit('close')">
          Cancelar
        </BotonBase>
        <BotonBase data-test="submit" type="submit" class="btn btn--primary" :disabled="loading">
          {{ loading ? 'Guardando...' : submitLabel }}
        </BotonBase>
      </footer>
    </form>
  </ModalBase>
</template>

<style scoped>
.modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #e5e7eb; }
h2 { margin: 0; font-size: 1.1rem; }
.modal__close { border: 0; background: transparent; font-size: 1.6rem; cursor: pointer; color: #6b7280; }
.modal__body { padding: 20px; }
.modal__field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.modal__field label { font-size: 0.85rem; font-weight: 600; color: #374151; }
input, select, textarea { width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; font: inherit; }
.campo-error { color: #b91c1c; font-size: 0.78rem; font-weight: 500; line-height: 1.25; }
.modal__footer { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }
.btn { border: 1px solid #d1d5db; background: #fff; border-radius: 8px; padding: 8px 14px; cursor: pointer; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--primary { background: #4f46e5; border-color: #4f46e5; color: #fff; }
</style>
