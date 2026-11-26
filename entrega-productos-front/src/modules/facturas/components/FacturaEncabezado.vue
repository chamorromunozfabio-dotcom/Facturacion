<script setup>
import ClienteSearch from './ClienteSearch.vue'
import { formaPagoOptions, medioPagoOptions } from '../utils/facturaCampos'

/** Datos generales de la factura: cliente, bodega, pagos, fecha y notas. */
defineProps({
  form: { type: Object, required: true },
  errores: { type: Object, default: () => ({}) },
  clientes: { type: Array, default: () => [] },
  clienteQuery: { type: String, default: '' },
  empresas: { type: Array, default: () => [] },
  empresaId: { type: [String, Number], default: '' },
  bodegas: { type: Array, default: () => [] },
  esCredito: { type: Boolean, default: false },
})

defineEmits(['marcar', 'buscar-cliente', 'update:empresaId'])
</script>

<template>
  <div class="grid">
    <label>
      Cliente *
      <ClienteSearch
        v-model="form.cliente_id"
        :clientes="clientes"
        :query="clienteQuery"
        @update:model-value="$emit('marcar', 'cliente_id')"
        @buscar="$emit('buscar-cliente', $event)"
      />
      <small v-if="errores.cliente_id" data-test="error-cliente_id" class="campo-error">{{ errores.cliente_id }}</small>
    </label>

    <label v-if="empresas.length">
      Empresa *
      <select
        :value="empresaId"
        data-test="field-empresa_id"
        @change="$emit('update:empresaId', $event.target.value)"
      >
        <option value="">Selecciona la empresa…</option>
        <option v-for="empresa in empresas" :key="empresa.value" :value="empresa.value">
          {{ empresa.label }}
        </option>
      </select>
    </label>

    <label>
      Bodega *
      <select v-model="form.bodega_id" data-test="field-bodega_id" @change="$emit('marcar', 'bodega_id')">
        <option value="">Selecciona la bodega…</option>
        <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega.id">
          {{ bodega.nombre }}
        </option>
      </select>
      <small v-if="errores.bodega_id" data-test="error-bodega_id" class="campo-error">{{ errores.bodega_id }}</small>
    </label>

    <label>
      Forma de pago *
      <select v-model="form.forma_pago" data-test="field-forma_pago" @change="$emit('marcar', 'forma_pago')">
        <option value="">Selecciona la forma de pago…</option>
        <option v-for="opcion in formaPagoOptions" :key="opcion.value" :value="opcion.value">
          {{ opcion.label }}
        </option>
      </select>
      <small v-if="errores.forma_pago" data-test="error-forma_pago" class="campo-error">{{ errores.forma_pago }}</small>
    </label>

    <label>
      Medio de pago *
      <select v-model="form.medio_pago" data-test="field-medio_pago" @change="$emit('marcar', 'medio_pago')">
        <option value="">Selecciona el medio de pago…</option>
        <option v-for="opcion in medioPagoOptions" :key="opcion.value" :value="opcion.value">
          {{ opcion.label }}
        </option>
      </select>
      <small v-if="errores.medio_pago" data-test="error-medio_pago" class="campo-error">{{ errores.medio_pago }}</small>
    </label>

    <label v-if="esCredito">
      Fecha de vencimiento *
      <input v-model="form.fecha_vencimiento" data-test="field-fecha_vencimiento" type="date" @change="$emit('marcar', 'fecha_vencimiento')" />
      <small v-if="errores.fecha_vencimiento" data-test="error-fecha_vencimiento" class="campo-error">{{ errores.fecha_vencimiento }}</small>
    </label>

    <label class="full">
      Observaciones (opcional)
      <textarea v-model="form.observaciones" data-test="field-observaciones" rows="2" maxlength="1000" @input="$emit('marcar', 'observaciones')"></textarea>
      <small v-if="errores.observaciones" data-test="error-observaciones" class="campo-error">{{ errores.observaciones }}</small>
    </label>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.grid .full {
  grid-column: 1 / -1;
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

.campo-error {
  color: #b91c1c;
  font-size: 0.78rem;
  font-weight: 500;
  line-height: 1.25;
}

.campo-hint {
  color: #6b7280;
  font-size: 0.75rem;
  line-height: 1.25;
}

@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
