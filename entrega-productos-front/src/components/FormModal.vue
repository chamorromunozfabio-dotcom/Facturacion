<script setup>
import { reactive, ref, watch } from 'vue'

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

const form = reactive({ ...props.modelValue })
const error = ref('')

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
      error.value = ''
    }
  },
)

function setValue(key, value) {
  form[key] = value
  error.value = ''
  emit('update:modelValue', { ...form })
}

function handleSubmit() {
  // El backend recorta los espacios y valida hasta 100 caracteres en el nombre.
  const payload = {}
  for (const field of props.fields) {
    const raw = form[field.key] ?? ''
    payload[field.key] = typeof raw === 'string' ? raw.trim() : raw
  }

  const missing = props.fields.filter(
    (field) => field.required && String(payload[field.key]).trim() === '',
  )

  if (missing.length) {
    error.value = 'Completa los campos obligatorios.'
    return
  }

  const tooLong = props.fields.find(
    (field) => field.maxLength && String(payload[field.key]).length > field.maxLength,
  )

  if (tooLong) {
    error.value = `${tooLong.label} no puede superar los ${tooLong.maxLength} caracteres.`
    return
  }

  error.value = ''
  emit('update:modelValue', payload)
  emit('submit', payload)
}
</script>

<template>
  <div v-if="open" data-test="modal" class="modal">
    <div class="modal__backdrop" @click="emit('close')"></div>

    <div class="modal__panel" role="dialog" aria-modal="true" :aria-label="title">
      <header class="modal__header">
        <h2>{{ title }}</h2>
        <button data-test="close-x" type="button" class="modal__close" @click="emit('close')">
          ×
        </button>
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

          <input
            v-else
            :id="`field-${field.key}`"
            :data-test="`field-${field.key}`"
            :type="field.type || 'text'"
            :value="form[field.key] ?? ''"
            :placeholder="field.placeholder || ''"
            @input="setValue(field.key, $event.target.value)"
          />
        </div>

        <p v-if="error" data-test="error" class="error">{{ error }}</p>

        <footer class="modal__footer">
          <button data-test="cancel" type="button" class="btn" @click="emit('close')">
            Cancelar
          </button>
          <button data-test="submit" type="submit" class="btn btn--primary" :disabled="loading">
            {{ loading ? 'Guardando...' : submitLabel }}
          </button>
        </footer>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 50;
}

.modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgb(17 24 39 / 50%);
}

.modal__panel {
  position: relative;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgb(0 0 0 / 20%);
}

.modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e7eb;
}

h2 {
  margin: 0;
  font-size: 1.2rem;
}

.modal__close {
  border: 0;
  background: transparent;
  font-size: 1.6rem;
  line-height: 1;
  cursor: pointer;
  color: #6b7280;
}

.modal__body {
  padding: 20px;
}

.modal__field {
  margin-bottom: 14px;
}

label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 6px;
}

label span {
  color: #dc2626;
}

input,
textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 9px 10px;
  font: inherit;
}

textarea {
  min-height: 80px;
  resize: vertical;
}

.error {
  color: #b91c1c;
  background: #fef2f2;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 0.9rem;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}
</style>
