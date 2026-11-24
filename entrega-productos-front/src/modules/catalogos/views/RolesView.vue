<script setup>
import CrudPage from '../../../shared/ui/CrudPage.vue'
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
  <CrudPage
    titulo="Roles"
    descripcion="Crea roles y asígnalos a una persona desde el módulo Usuarios."
    badge="Accesos"
    :alert="alert"
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
    :modal-open="modalOpen"
    :editing="editing"
    :fields="fields"
    :form="form"
    :saving="saving"
    crear-titulo="Nuevo rol"
    editar-titulo="Editar rol"
    crear-submit-label="Crear rol"
    :confirm-open="confirmOpen"
    :confirm-titulo="confirmacion.titulo"
    :confirm-mensaje="confirmacion.mensaje"
    :deleting="deleting"
    :removing="removing"
    @update:q="q = $event"
    @update:page="page = $event"
    @create="openCreate"
    @edit="openEdit"
    @delete="askDelete"
    @update:model-value="form = $event"
    @submit="save"
    @close-modal="modalOpen = false"
    @confirm="confirmDelete"
    @cancel="confirmOpen = false"
    @close-alert="alert = null"
  >
    <template #cell-estado="{ value }">
      <span :class="value ? 'estado--activo' : 'estado--inactivo'">
        {{ value ? 'Activo' : 'Inactivo' }}
      </span>
    </template>
  </CrudPage>
</template>

<style scoped>
.estado--activo {
  color: #047857;
  font-weight: 600;
}

.estado--inactivo {
  color: #9ca3af;
  font-weight: 600;
}
</style>
