<script setup>
import TipoSearch from './TipoSearch.vue'
import { sanitizarDecimal } from '../utils/facturaCampos'

/** Productos de la factura. Cada línea es un renglón editable. */
defineProps({
  lineas: { type: Array, default: () => [] },
  errores: { type: Object, default: () => ({}) },
  tiposDisponibles: { type: Array, default: () => [] },
  tieneTipo: { type: Boolean, default: false },
  bodegaId: { type: [String, Number], default: '' },
  ivas: { type: Array, default: () => [0, 5, 19] },
})

const emit = defineEmits(['add', 'remove', 'select-tipo', 'marcar'])

/** Cantidad, precio y descuento solo aceptan dígitos y un punto (2 decimales). */
function escribirNumero(linea, campo, index, evento) {
  linea[campo] = sanitizarDecimal(evento.target.value)
  emit('marcar', `linea_${index}_${campo}`)
}

/** Bloquea la tecla antes de que aparezca: solo dígitos y el punto decimal. */
function bloquearTeclaNumero(evento) {
  if (evento.ctrlKey || evento.metaKey || evento.altKey) return
  if (evento.key.length === 1 && !/[0-9.]/.test(evento.key)) evento.preventDefault()
}
</script>

<template>
  <section class="lineas">
    <div class="lineas__header">
      <h3>Productos</h3>
      <button data-test="add-linea" type="button" class="btn btn--small" @click="$emit('add')">
        + Agregar línea
      </button>
    </div>

    <p class="hint">Cantidad, precio y descuento: solo números, con hasta 2 decimales (el descuento va de 0 a 100).</p>

    <p v-if="!tieneTipo" class="hint">
      {{ bodegaId ? 'Cargando productos de la bodega…' : 'Elige una bodega para ver sus productos.' }}
    </p>
    <p v-if="errores.detalle" data-test="error-detalle" class="campo-error">{{ errores.detalle }}</p>
    <p v-if="errores.general" data-test="error-general" class="campo-error">{{ errores.general }}</p>

    <div v-for="(linea, index) in lineas" :key="index" class="linea" data-test="linea">
      <label class="linea__tipo">
        Producto *
        <TipoSearch
          :tipos="tiposDisponibles"
          :model-value="linea.tipo_id"
          :data-test="`linea-tipo_id-${index}`"
          @update:model-value="linea.tipo_id = $event"
          @select="$emit('select-tipo', { linea, tipo: $event, index })"
        />
        <small v-if="errores[`linea_${index}_tipo`]" :data-test="`error-linea-${index}-tipo`" class="campo-error">{{ errores[`linea_${index}_tipo`] }}</small>
      </label>

      <label>
        Descripción *
        <input v-model="linea.descripcion" :data-test="`linea-descripcion-${index}`" type="text" maxlength="255" placeholder="Ej. Arroz 500 g" @input="$emit('marcar', `linea_${index}_descripcion`)" />
        <small v-if="errores[`linea_${index}_descripcion`]" :data-test="`error-linea-${index}-descripcion`" class="campo-error">{{ errores[`linea_${index}_descripcion`] }}</small>
      </label>

      <label class="linea__unidad">
        Unidad *
        <input v-model="linea.unidad_medida" :data-test="`linea-unidad_medida-${index}`" type="text" maxlength="20" placeholder="UND" @input="$emit('marcar', `linea_${index}_unidad_medida`)" />
        <small v-if="errores[`linea_${index}_unidad_medida`]" :data-test="`error-linea-${index}-unidad_medida`" class="campo-error">{{ errores[`linea_${index}_unidad_medida`] }}</small>
      </label>

      <label>
        Cant. *
        <input :value="linea.cantidad" :data-test="`linea-cantidad-${index}`" type="text" inputmode="decimal" placeholder="Ej. 10" @keydown="bloquearTeclaNumero" @input="escribirNumero(linea, 'cantidad', index, $event)" />
        <small v-if="errores[`linea_${index}_cantidad`]" :data-test="`error-linea-${index}-cantidad`" class="campo-error">{{ errores[`linea_${index}_cantidad`] }}</small>
      </label>

      <label>
        Precio *
        <input :value="linea.precio_unitario" :data-test="`linea-precio_unitario-${index}`" type="text" inputmode="decimal" placeholder="Ej. 3500" @keydown="bloquearTeclaNumero" @input="escribirNumero(linea, 'precio_unitario', index, $event)" />
        <small v-if="errores[`linea_${index}_precio_unitario`]" :data-test="`error-linea-${index}-precio_unitario`" class="campo-error">{{ errores[`linea_${index}_precio_unitario`] }}</small>
      </label>

      <label>
        Dto. % *
        <input :value="linea.descuento_porcentaje" :data-test="`linea-descuento_porcentaje-${index}`" type="text" inputmode="decimal" placeholder="0" @keydown="bloquearTeclaNumero" @input="escribirNumero(linea, 'descuento_porcentaje', index, $event)" />
        <small v-if="errores[`linea_${index}_descuento_porcentaje`]" :data-test="`error-linea-${index}-descuento_porcentaje`" class="campo-error">{{ errores[`linea_${index}_descuento_porcentaje`] }}</small>
      </label>

      <label>
        IVA % *
        <select v-model.number="linea.iva_porcentaje" :data-test="`linea-iva_porcentaje-${index}`" @change="$emit('marcar', `linea_${index}_iva_porcentaje`)">
          <option value="">Selecciona…</option>
          <option v-for="iva in ivas" :key="iva" :value="iva">{{ iva }}</option>
        </select>
        <small v-if="errores[`linea_${index}_iva_porcentaje`]" :data-test="`error-linea-${index}-iva_porcentaje`" class="campo-error">{{ errores[`linea_${index}_iva_porcentaje`] }}</small>
      </label>

      <button
        data-test="remove-linea"
        type="button"
        class="btn btn--small btn--danger"
        :disabled="lineas.length === 1"
        @click="$emit('remove', index)"
      >
        ×
      </button>
    </div>
  </section>
</template>

<style scoped>
.lineas {
  margin-top: 20px;
  border-top: 1px solid #e5e7eb;
  padding-top: 14px;
}

.lineas__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

h3 {
  margin: 0;
  font-size: 0.95rem;
}

.linea {
  display: grid;
  grid-template-columns: 1.1fr 1.8fr 0.7fr 0.55fr 0.8fr 0.7fr 0.55fr auto;
  gap: 8px;
  align-items: end;
  margin-bottom: 10px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

input,
select,
textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px;
  font: inherit;
}

.hint {
  color: #6b7280;
  font-size: 0.85rem;
}

.campo-error {
  color: #b91c1c;
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.25;
}

.btn {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}

.btn--small {
  padding: 6px 10px;
  font-size: 0.85rem;
}

.btn--danger {
  color: #b91c1c;
  border-color: #fca5a5;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 700px) {
  .linea {
    grid-template-columns: 1fr;
  }
}
</style>
