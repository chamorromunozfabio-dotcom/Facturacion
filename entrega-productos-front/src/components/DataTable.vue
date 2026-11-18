<script setup>
import { computed, useSlots } from 'vue'

/**
 * Tabla reutilizable para todos los CRUD.
 * No llama a la API: solo muestra datos y avisa al padre con eventos.
 *
 * columns: [{ key: 'nombre', label: 'Nombre' }]
 * El padre escucha update:q, update:page, create, edit y delete.
 */
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  total: { type: Number, default: 0 },
  page: { type: Number, default: 1 },
  limit: { type: Number, default: 10 },
  q: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  searchable: { type: Boolean, default: true },
  canCreate: { type: Boolean, default: true },
  canEdit: { type: Boolean, default: true },
  canDelete: { type: Boolean, default: true },
})

const emit = defineEmits(['update:q', 'update:page', 'create', 'edit', 'delete'])
const slots = useSlots()

/** Mostramos la columna de acciones si hay permiso global o un slot personalizado. */
const showActions = computed(() => props.canEdit || props.canDelete || Boolean(slots.actions))

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))
const canPrev = computed(() => props.page > 1)
const canNext = computed(() => props.page < totalPages.value)
const firstRow = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1))
const lastRow = computed(() => Math.min(props.page * props.limit, props.total))

function onSearch(event) {
  emit('update:q', event.target.value)
}

function goTo(page) {
  if (page >= 1 && page <= totalPages.value) emit('update:page', page)
}
</script>

<template>
  <section class="data-table">
    <header class="data-table__toolbar">
      <label v-if="searchable" class="data-table__search">
        <span>Buscar</span>
        <input
          data-test="search"
          type="search"
          :value="q"
          placeholder="Escribe para buscar..."
          @input="onSearch"
        />
      </label>

      <button
        v-if="canCreate"
        data-test="create"
        type="button"
        class="btn btn--primary"
        @click="emit('create')"
      >
        + Nuevo
      </button>
    </header>

    <p v-if="loading" class="data-table__loading">Cargando datos...</p>

    <div class="data-table__scroll">
      <table>
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
            <th v-if="showActions" class="data-table__actions-head">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td v-for="column in columns" :key="column.key">
              {{ row[column.key] ?? '—' }}
            </td>
            <td v-if="showActions" class="data-table__actions">
              <slot name="actions" :row="row">
                <button
                  v-if="canEdit"
                  data-test="edit"
                  type="button"
                  class="btn btn--small"
                  @click="emit('edit', row)"
                >
                  Editar
                </button>
                <button
                  v-if="canDelete"
                  data-test="delete"
                  type="button"
                  class="btn btn--small btn--danger"
                  @click="emit('delete', row)"
                >
                  Eliminar
                </button>
              </slot>
            </td>
          </tr>
          <tr v-if="rows.length === 0 && !loading">
            <td :colspan="columns.length + (showActions ? 1 : 0)" class="data-table__empty">
              No hay registros.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="data-table__footer">
      <span>Mostrando {{ firstRow }}-{{ lastRow }} de {{ total }}</span>
      <div class="data-table__pager">
        <button
          data-test="prev"
          type="button"
          class="btn btn--small"
          :disabled="!canPrev"
          @click="goTo(page - 1)"
        >
          Anterior
        </button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button
          data-test="next"
          type="button"
          class="btn btn--small"
          :disabled="!canNext"
          @click="goTo(page + 1)"
        >
          Siguiente
        </button>
      </div>
    </footer>
  </section>
</template>

<style scoped>
.data-table {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
}

.data-table__toolbar,
.data-table__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
}

.data-table__toolbar {
  border-bottom: 1px solid #e5e7eb;
}

.data-table__footer {
  border-top: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.9rem;
}

.data-table__search {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
}

.data-table__search input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  min-width: 220px;
}

.data-table__scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

th,
td {
  text-align: left;
  padding: 10px 16px;
  border-bottom: 1px solid #f3f4f6;
  white-space: nowrap;
}

th {
  background: #f9fafb;
  color: #374151;
  font-size: 0.85rem;
}

.data-table__actions,
.data-table__actions-head {
  text-align: right;
}

.data-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.data-table__loading,
.data-table__empty {
  padding: 20px;
  text-align: center;
  color: #6b7280;
}

.data-table__pager {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn:hover:not(:disabled) {
  background: #f3f4f6;
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

.btn--primary:hover:not(:disabled) {
  background: #4338ca;
}

.btn--small {
  padding: 5px 10px;
  font-size: 0.85rem;
}

.btn--danger {
  color: #b91c1c;
  border-color: #fecaca;
}
</style>
