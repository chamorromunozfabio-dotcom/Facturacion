<script setup>
import AlertMessage from '../components/ui/AlertMessage.vue'
import ConfirmDelete from '../components/ui/ConfirmDelete.vue'
import DataTable from '../components/ui/DataTable.vue'
import FormModal from '../components/ui/FormModal.vue'
import rolesApi from '../api/roles'
import { useCrud } from '../composables/useCrud'

const {
  canCreate,
  canEdit,
  canDelete,
  columnas: columns,
  campos: fields,
  createLabel,
  confirmacion,
  rows,
  total,
  page,
  limit,
  q,
  loading,
  alert,
  modalOpen,
  editing,
  form,
  saving,
  confirmOpen,
  deleting,
  removing,
  openCreate,
  openEdit,
  save,
  askDelete,
  confirmDelete,
} = useCrud({
  modulo: 'roles',
  api: rolesApi,
  columns: [
    { key: 'nombre', label: 'Nombre' },
    { key: 'descripcion', label: 'Descripción' },
    { key: 'estado', label: 'Estado' },
  ],
  fields: [
    { key: 'nombre', label: 'Nombre', required: true, maxLength: 50 },
    { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 255 },
  ],
  createLabel: 'Nuevo rol',
  emptyForm: () => ({ nombre: '', descripcion: '' }),
  formFromRow: (row) => ({ nombre: row.nombre ?? '', descripcion: row.descripcion ?? '' }),
  duplicateMessage: 'Ya existe un rol con ese nombre. Probá con otro.',
  mensajes: {
    creado: (clean) => `Rol creado. "${clean.nombre}" ya está disponible para asignar.`,
    actualizado: 'Rol actualizado. Los cambios ya están guardados.',
    eliminado: 'Rol eliminado. Ya no aparece en la lista.',
    sinCambios: 'No hay cambios: el rol ya estaba guardado.',
    fallbackGuardar: 'No se pudo guardar el rol.',
  },
  confirmacion: {
    titulo: 'Eliminar rol',
    mensaje: 'El rol se eliminará de forma permanente. Esta acción no se puede deshacer.',
  },
})
</script>

<template>
  <section class="crud-page">
    <header class="crud-page__header">
      <div>
        <h1>Roles</h1>
        <p>Crea roles y asígnalos a una persona desde el módulo Usuarios.</p>
      </div>
      <span class="badge">Accesos</span>
    </header>

    <Transition name="alert">
      <AlertMessage
        v-if="alert"
        :type="alert.type"
        :message="alert.message"
        @close="alert = null"
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
      @update:q="q = $event"
      @update:page="page = $event"
      @create="openCreate"
      @edit="openEdit"
      @delete="askDelete"
    >
      <template #cell-estado="{ value }">
        <span :class="value ? 'estado--activo' : 'estado--inactivo'">
          {{ value ? 'Activo' : 'Inactivo' }}
        </span>
      </template>
    </DataTable>

    <FormModal
      :open="modalOpen"
      :title="editing ? 'Editar rol' : 'Nuevo rol'"
      :fields="fields"
      :model-value="form"
      :submit-label="editing ? 'Guardar cambios' : 'Crear rol'"
      :loading="saving"
      @update:model-value="form = $event"
      @submit="save"
      @close="modalOpen = false"
    />

    <ConfirmDelete
      :open="confirmOpen"
      :title="confirmacion.titulo"
      :message="confirmacion.mensaje"
      :item-label="deleting?.nombre || ''"
      :loading="removing"
      @confirm="confirmDelete"
      @cancel="confirmOpen = false"
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

.estado--activo {
  color: #047857;
  font-weight: 600;
}

.estado--inactivo {
  color: #9ca3af;
  font-weight: 600;
}
</style>
