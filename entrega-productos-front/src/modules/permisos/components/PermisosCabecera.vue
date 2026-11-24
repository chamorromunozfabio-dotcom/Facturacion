<script setup>
import { ChevronLeft, KeyRound } from '@lucide/vue'
import BotonBase from '../../../shared/ui/BotonBase.vue'
import { iniciales } from '../utils/permisos'

/** Paso 2, cabecera: quién se está editando y cuántos permisos tiene. */
defineProps({
  usuario: { type: Object, required: true },
  rol: { type: Object, default: null },
  plantilla: { type: Array, default: () => [] },
  activos: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  faltan: { type: Number, default: 0 },
})

defineEmits(['cambiar'])
</script>

<template>
  <header class="detalle__head">
    <span class="avatar avatar--grande">{{ iniciales(usuario.nombre) }}</span>
    <div class="detalle__titulo">
      <h2 data-test="assignment-affected">
        Permisos de <strong>{{ usuario.nombre }}</strong>
        <template v-if="rol">({{ rol.nombre }})</template>
      </h2>
      <p>{{ usuario.correo }}</p>
    </div>
    <BotonBase type="button" class="btn btn--suave" @click="$emit('cambiar')">
      <ChevronLeft :size="16" aria-hidden="true" />
      Cambiar usuario
    </BotonBase>
  </header>

  <div class="metricas">
    <div class="metrica">
      <strong>{{ activos }}</strong>
      <span>permisos activos</span>
    </div>
    <div class="metrica">
      <strong>{{ total }}</strong>
      <span>funciones posibles</span>
    </div>
    <div class="metrica metrica--clara">
      <strong>{{ plantilla.length }}</strong>
      <span>en su rol</span>
    </div>
  </div>

  <p class="nota" data-test="plantilla-rol">
    Referencia del rol: {{ plantilla.length }} permisos predefinidos. No se aplican automáticamente,
    pero podés usar el botón “Por defecto del rol”.
  </p>

  <p v-if="faltan" class="aviso" data-test="permisos-pendientes">
    <KeyRound :size="15" aria-hidden="true" />
    Faltan {{ faltan }} funciones en el catálogo del backend. Quedan marcadas como pendientes.
  </p>
</template>

<style scoped>
.detalle__head {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding-bottom: 18px;
  border-bottom: 1px solid #eef2ff;
}

.detalle__titulo {
  flex: 1 1 240px;
}

.detalle__titulo p {
  margin: 4px 0 0;
  color: #9ca3af;
  font-size: 0.85rem;
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

.avatar--grande {
  flex-basis: 52px;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
}

h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
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

.metricas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.metrica {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #eef2ff;
  color: #3730a3;
}

.metrica strong {
  font-size: 1.4rem;
  line-height: 1;
}

.metrica span {
  font-size: 0.78rem;
  color: #6366f1;
}

.metrica--clara {
  background: #f5f3ff;
  color: #6d28d9;
}

.metrica--clara span {
  color: #8b5cf6;
}

.nota {
  margin: 12px 0 0;
  color: #6b7280;
  font-size: 0.82rem;
  line-height: 1.5;
}

.aviso {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 12px 0 0;
  padding: 10px 12px;
  border: 1px solid #fde68a;
  border-radius: 10px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.84rem;
}

@media (max-width: 640px) {
  .detalle__head {
    align-items: flex-start;
  }
}
</style>
