<script setup>
import { Search, Users, X } from '@lucide/vue'
import BotonBase from '../ui/BotonBase.vue'
import CampoNative from '../ui/CampoNative.vue'
import { iniciales } from '../../utils/permisos'

/** Paso 1: busca a la persona a la que se van a revisar los permisos. */
defineProps({
  modelValue: { type: String, default: '' },
  cargando: { type: Boolean, default: false },
  coincidencias: { type: Array, default: () => [] },
  resultados: { type: Array, default: () => [] },
  seleccionadoId: { type: [Number, String], default: null },
})

defineEmits(['update:modelValue', 'select'])
</script>

<template>
  <section class="card card--buscar">
    <div class="paso">
      <span class="paso__numero">1</span>
      <div>
        <h2>¿A quién querés revisar?</h2>
        <p>Escribí el nombre, el correo o el rol. No mostramos la lista completa.</p>
      </div>
    </div>

    <div class="buscador">
      <Search class="buscador__icono" :size="18" aria-hidden="true" />
      <CampoNative
        :model-value="modelValue"
        data-test="user-search"
        type="search"
        placeholder="Ej: Juan, cliente@gmail.com, bodeguero..."
        aria-label="Buscar usuario"
        @update:model-value="$emit('update:modelValue', $event)"
      />
      <BotonBase
        v-if="modelValue"
        type="button"
        class="buscador__limpiar"
        aria-label="Limpiar búsqueda"
        @click="$emit('update:modelValue', '')"
      >
        <X :size="16" aria-hidden="true" />
      </BotonBase>
    </div>

    <p v-if="cargando" class="estado">Cargando usuarios y catálogos...</p>

    <template v-else-if="coincidencias.length">
      <div class="resultados" data-test="assignment-user">
        <BotonBase
          v-for="usuario in resultados"
          :key="usuario.id"
          type="button"
          class="usuario"
          :class="{ 'usuario--activo': usuario.id === seleccionadoId }"
          :aria-pressed="usuario.id === seleccionadoId"
          :data-test="`usuario-${usuario.id}`"
          @click="$emit('select', usuario)"
        >
          <span class="avatar">{{ iniciales(usuario.nombre) }}</span>
          <span class="usuario__datos">
            <strong>{{ usuario.nombre }}</strong>
            <small>{{ usuario.correo }}</small>
          </span>
          <span class="rol">{{ usuario.rol }}</span>
        </BotonBase>
      </div>
      <p v-if="coincidencias.length > resultados.length" class="estado">
        Mostrando {{ resultados.length }} de {{ coincidencias.length }} coincidencias. Seguí
        escribiendo para afinar.
      </p>
    </template>

    <div v-else-if="modelValue.trim()" class="estado estado--vacio" data-test="sin-resultados">
      <Search :size="20" aria-hidden="true" />
      <span>No encontramos usuarios para “{{ modelValue.trim() }}”.</span>
    </div>
    <div v-else class="estado estado--vacio">
      <Users :size="20" aria-hidden="true" />
      <span>Empezá a escribir para ver los usuarios disponibles.</span>
    </div>
  </section>
</template>

<style scoped>
.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 2px 10px rgb(15 23 42 / 4%);
}

.card p,
.estado {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.paso {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.paso__numero {
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 700;
  font-size: 0.9rem;
}

h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
}

.buscador {
  position: relative;
  display: flex;
  align-items: center;
}

.buscador__icono {
  position: absolute;
  left: 14px;
  color: #818cf8;
  pointer-events: none;
}

.buscador input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d8dbe3;
  border-radius: 12px;
  padding: 13px 44px 13px 42px;
  font-size: 0.95rem;
  color: #1f2937;
  background: #fbfbfd;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.buscador input:focus {
  background: #fff;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgb(99 102 241 / 12%);
}

.buscador input::placeholder {
  color: #9ca3af;
}

.buscador__limpiar {
  position: absolute;
  right: 10px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
}

.buscador__limpiar:hover {
  background: #e5e7eb;
}

.resultados {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.usuario {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease,
    box-shadow 0.15s ease;
}

.usuario:hover {
  transform: translateY(-2px);
  border-color: #a5b4fc;
  box-shadow: 0 6px 14px rgb(15 23 42 / 6%);
}

.usuario--activo {
  background: #eef2ff;
  border-color: #6366f1;
}

.avatar {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 700;
  font-size: 0.85rem;
}

.usuario__datos {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.usuario__datos strong {
  font-size: 0.9rem;
  color: #1f2937;
}

.usuario__datos small {
  font-size: 0.76rem;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rol {
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.usuario--activo .rol {
  background: #c7d2fe;
  color: #3730a3;
}

.estado--vacio {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
  padding: 22px;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  color: #9ca3af;
  background: #fcfcfd;
}

@media (max-width: 640px) {
  .card {
    padding: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .usuario,
  .buscador input {
    transition: none;
  }
}
</style>
