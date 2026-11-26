<script setup>
import { computed, useSlots } from 'vue'
import AlertMessage from './AlertMessage.vue'
import ConfirmDelete from './ConfirmDelete.vue'
import DataTable from './DataTable.vue'
import FormModal from './FormModal.vue'

/**
 * Estructura visual común de los listados con alta, edición y baja.
 * La lógica sigue en useCrud; cada vista solo pasa su configuración y aporta
 * los slots `notice`, `filter`, `cell-<columna>` o `actions` cuando los necesita.
 */
defineProps({
  titulo: { type: String, required: true },
  descripcion: { type: String, default: '' },
  badge: { type: String, default: '' },
  alert: { type: Object, default: null },

  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  limit: { type: Number, default: 10 },
  q: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  createLabel: { type: String, default: 'Nuevo' },
  canCreate: { type: Boolean, default: true },
  canEdit: { type: Boolean, default: true },
  canDelete: { type: Boolean, default: true },
  canToggleEstado: { type: Boolean, default: false },
  canToggleRow: { type: Function, default: () => true },

  modalOpen: { type: Boolean, default: false },
  editing: { type: Object, default: null },
  fields: { type: Array, default: () => [] },
  form: { type: Object, default: () => ({}) },
  saving: { type: Boolean, default: false },
  crearTitulo: { type: String, default: 'Nuevo registro' },
  editarTitulo: { type: String, default: 'Editar registro' },
  crearSubmitLabel: { type: String, default: 'Crear' },
  editarSubmitLabel: { type: String, default: 'Guardar cambios' },

  confirmOpen: { type: Boolean, default: false },
  confirmTitulo: { type: String, default: 'Eliminar' },
  confirmMensaje: { type: String, default: '' },
  deleting: { type: Object, default: null },
  removing: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:q',
  'update:page',
  'create',
  'edit',
  'delete',
  'toggle-estado',
  'update:model-value',
  'submit',
  'close-modal',
  'confirm',
  'cancel',
  'close-alert',
])

const slots = useSlots()
// DataTable solo conoce los slots de celda y `actions`; los reenviamos sin envolverlos.
const tableSlots = computed(() =>
  Object.keys(slots).filter((nombre) => nombre === 'actions' || nombre.startsWith('cell-')),
)
</script>

<template>
  <section class="crud-page">
    <header class="crud-page__header">
      <div>
        <h1>{{ titulo }}</h1>
        <p v-if="descripcion">{{ descripcion }}</p>
      </div>
      <span v-if="badge" class="badge">{{ badge }}</span>
    </header>

    <slot name="notice" />
    <div v-if="slots.filter" class="crud-page__filters">
      <slot name="filter" />
    </div>

    <Transition name="alert">
      <AlertMessage
        v-if="alert"
        :type="alert.type"
        :message="alert.message"
        @close="emit('close-alert')"
      />
    </Transition>

    <DataTable
      :columns="columns"
      :rows="rows"
      :total="total"
      :page="page"
      :limit="limit"
      :q="q"
      :loading="loading"
      :create-label="createLabel"
      :can-create="canCreate"
      :can-edit="canEdit"
      :can-delete="canDelete"
      :can-toggle-estado="canToggleEstado"
      :can-toggle-row="canToggleRow"
      @update:q="emit('update:q', $event)"
      @update:page="emit('update:page', $event)"
      @create="emit('create')"
      @edit="emit('edit', $event)"
      @delete="emit('delete', $event)"
      @toggle-estado="emit('toggle-estado', $event)"
    >
      <template v-for="nombre in tableSlots" #[nombre]="propsSlot" :key="nombre">
        <slot :name="nombre" v-bind="propsSlot" />
      </template>
    </DataTable>

    <FormModal
      :open="modalOpen"
      :title="editing ? editarTitulo : crearTitulo"
      :fields="fields"
      :model-value="form"
      :submit-label="editing ? editarSubmitLabel : crearSubmitLabel"
      :loading="saving"
      @update:model-value="emit('update:model-value', $event)"
      @submit="emit('submit', $event)"
      @close="emit('close-modal')"
    >
      <template v-if="slots['form-extra']" #extra="slotProps">
        <slot name="form-extra" v-bind="slotProps" />
      </template>
    </FormModal>

    <ConfirmDelete
      :open="confirmOpen"
      :title="confirmTitulo"
      :message="confirmMensaje"
      :item-label="deleting?.nombre || ''"
      :loading="removing"
      @confirm="emit('confirm')"
      @cancel="emit('cancel')"
    />
  </section>
</template>

<style scoped>
.crud-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crud-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.crud-page__filters {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

h1 {
  margin: 0;
  font-size: 1.5rem;
}

p {
  margin: 4px 0 0;
  color: #6b7280;
}

.badge {
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.8rem;
  font-weight: 600;
}
</style>
