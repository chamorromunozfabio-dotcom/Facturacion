<script setup>
import { Check, KeyRound } from '@lucide/vue'

/** Matriz de módulos x acción. El check solo prepara; se aplica con Confirmar. */
defineProps({
  modulos: { type: Array, default: () => [] },
  todosMarcados: { type: Boolean, default: false },
  guardando: { type: Boolean, default: false },
  opcionesLength: { type: Number, default: 0 },
})

defineEmits(['toggle', 'toggle-todos', 'aplicar-rol', 'desmarcar-todos'])
</script>

<template>
  <div class="acciones-masivas" data-test="acciones-masivas">
    <label class="acciones-masivas__check">
      <input
        type="checkbox"
        data-test="check-todos"
        :checked="todosMarcados"
        :disabled="guardando || !opcionesLength"
        @change="$emit('toggle-todos')"
      />
      <span>Marcar todos</span>
    </label>
    <button
      type="button"
      class="btn btn--suave"
      data-test="aplicar-rol"
      :disabled="guardando || !opcionesLength"
      @click="$emit('aplicar-rol')"
    >
      Por defecto del rol
    </button>
    <button
      type="button"
      class="btn btn--suave"
      data-test="desmarcar-todos"
      :disabled="guardando || !opcionesLength"
      @click="$emit('desmarcar-todos')"
    >
      Desmarcar todos
    </button>
  </div>

  <div class="modulos" data-test="matriz-permisos">
    <article
      v-for="modulo in modulos"
      :key="modulo.clave"
      class="modulo"
      :data-test="`modulo-${modulo.clave}`"
    >
      <header class="modulo__head" :data-test="`columna-${modulo.clave}`">
        <span class="modulo__icono"><component :is="modulo.icono" :size="17" /></span>
        <h4>{{ modulo.etiqueta }}</h4>
        <span class="modulo__conteo">
          {{ modulo.opciones.filter((opcion) => opcion.visible).length }}/{{
            modulo.opciones.length
          }}
        </span>
      </header>
      <ul class="modulo__lista">
        <li
          v-for="opcion in modulo.opciones"
          :key="opcion.clave"
          class="funcion"
          :class="{
            'funcion--activa': opcion.visible,
            'funcion--pendiente': !opcion.idBackend,
          }"
        >
          <label class="check" :title="opcion.etiqueta">
            <input
              type="checkbox"
              :checked="opcion.visible"
              :disabled="guardando || opcion.idBackend == null"
              :data-test="`check-${opcion.clave}`"
              :aria-label="`${opcion.etiqueta}${opcion.visible ? ' (ya lo tiene)' : ''}`"
              @change="$emit('toggle', opcion)"
            />
            <span class="check__caja"><Check :size="12" aria-hidden="true" /></span>
            <span class="check__texto">{{ opcion.accionEtiqueta }}</span>
          </label>
          <span v-if="!opcion.idBackend" class="pendiente">
            <KeyRound :size="11" aria-hidden="true" />
            pendiente
          </span>
        </li>
      </ul>
    </article>
  </div>
</template>

<style scoped>
.acciones-masivas {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px solid #e0e7ff;
  border-radius: 12px;
  background: #f8faff;
}

.acciones-masivas__check {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #3730a3;
  cursor: pointer;
}

.acciones-masivas__check input {
  width: 16px;
  height: 16px;
  accent-color: #4f46e5;
  cursor: pointer;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn--suave {
  border: 1px solid #c7d2fe;
  background: #fff;
  color: #4338ca;
  font-weight: 600;
}

.btn--suave:hover {
  background: #eef2ff;
}

.acciones-masivas .btn:disabled,
.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.modulos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(265px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.modulo {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.modulo:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 14px rgb(15 23 42 / 5%);
}

.modulo__head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 13px;
  background: #f9fafb;
  border-bottom: 1px solid #eef0f4;
}

.modulo__icono {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
}

.modulo__head h4 {
  flex: 1;
  margin: 0;
  font-size: 0.9rem;
  color: #374151;
}

.modulo__conteo {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  border-radius: 999px;
  padding: 3px 8px;
}

.modulo__lista {
  list-style: none;
  margin: 0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.funcion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: 9px;
  padding: 2px 6px;
  transition: background 0.15s ease;
}

.funcion:hover {
  background: #f9fafb;
}

.funcion--activa {
  background: #f5f6ff;
}

.check {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  padding: 7px 4px;
  cursor: pointer;
  color: #6b7280;
  font-size: 0.86rem;
}

.check input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.check__caja {
  display: grid;
  place-items: center;
  flex: 0 0 19px;
  width: 19px;
  height: 19px;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: transparent;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.check input:focus-visible + .check__caja {
  outline: 3px solid rgb(99 102 241 / 30%);
  outline-offset: 2px;
}

.check input:checked + .check__caja {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}

.check input:disabled + .check__caja {
  opacity: 0.45;
}

.funcion--activa .check__texto {
  color: #3730a3;
  font-weight: 600;
}

.funcion--pendiente {
  opacity: 0.6;
}

.pendiente {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  color: #92400e;
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .modulo,
  .check__caja,
  .funcion {
    transition: none;
  }
}
</style>
