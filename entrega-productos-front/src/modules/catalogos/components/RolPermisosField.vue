<script setup>
import { computed } from 'vue'
import { construirModulosDesdeBackend } from '../../../shared/config/permissions'

/** Matriz de permisos plantilla para crear o editar un rol. */
const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  permisosBackend: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const modulosPermisos = computed(() => construirModulosDesdeBackend(props.permisosBackend))

function togglePermiso(id) {
  if (!id) return
  const next = props.modelValue.includes(id)
    ? props.modelValue.filter((item) => item !== id)
    : [...props.modelValue, id]
  emit('update:modelValue', next)
}

function marcarTodos() {
  emit(
    'update:modelValue',
    modulosPermisos.value
      .flatMap((modulo) => modulo.opciones.map((op) => op.idBackend))
      .filter(Boolean),
  )
}

function limpiar() {
  emit('update:modelValue', [])
}
</script>

<template>
  <div class="rol-permisos" data-test="rol-permisos">
    <div class="rol-permisos__header">
      <strong>Permisos del rol ({{ modelValue.length }})</strong>
      <div class="rol-permisos__acciones">
        <button type="button" class="link-btn" data-test="rol-marcar-todos" @click="marcarTodos">
          Marcar todos
        </button>
        <button type="button" class="link-btn" data-test="rol-limpiar" @click="limpiar">
          Limpiar
        </button>
      </div>
    </div>
    <p class="rol-permisos__hint">
      Los usuarios nuevos con este rol heredarán estos permisos automáticamente.
    </p>
    <div class="rol-permisos__grid">
      <fieldset v-for="modulo in modulosPermisos" :key="modulo.clave" class="rol-permisos__grupo">
        <legend>{{ modulo.etiqueta }}</legend>
        <label
          v-for="opcion in modulo.opciones"
          :key="opcion.clave"
          class="rol-permisos__check"
        >
          <input
            type="checkbox"
            :data-test="`rol-perm-${opcion.nombre}`"
            :checked="Boolean(opcion.idBackend && modelValue.includes(opcion.idBackend))"
            :disabled="!opcion.idBackend"
            @change="togglePermiso(opcion.idBackend)"
          />
          <span>{{ opcion.accionEtiqueta }}</span>
        </label>
      </fieldset>
    </div>
  </div>
</template>

<style scoped>
.rol-permisos {
  margin-top: 12px;
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}
.rol-permisos__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rol-permisos__acciones {
  display: flex;
  gap: 10px;
}
.link-btn {
  border: 0;
  background: transparent;
  color: #2563eb;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
}
.rol-permisos__hint {
  margin: 4px 0 10px;
  color: #6b7280;
  font-size: 0.78rem;
}
.rol-permisos__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
  max-height: 220px;
  overflow-y: auto;
}
.rol-permisos__grupo {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rol-permisos__grupo legend {
  font-size: 0.78rem;
  font-weight: 700;
  color: #374151;
  padding: 0 4px;
}
.rol-permisos__check {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #374151;
  cursor: pointer;
}
</style>
