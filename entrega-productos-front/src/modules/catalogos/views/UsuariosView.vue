<script setup>
import CrudPage from '../../../shared/ui/CrudPage.vue'
import { computed, ref } from 'vue'
import rolesApi from '../api/roles'
import usuariosApi from '../api/usuarios'
import { quitarVacios } from '../utils/crud'
import {
  ROLES_POR_DEFECTO,
  camposCliente,
  normalizarUsuarioFila,
  resolveRolId,
} from '../utils/usuarios'
import { useAuthStore } from '../../auth/store/auth'
import { useCrud } from '../composables/useCrud'
import EmpresaSelect from '../../empresas/components/EmpresaSelect.vue'
import { campoEmpresa, empresaParams, useEmpresaFiltro } from '../../empresas/composables/useEmpresaFiltro'

const auth = useAuthStore()
const isBodeguero = computed(() => auth.role === 'bodeguero')
const isEmpresa = computed(() => auth.role === 'empresa')
const { esAdmin, empresaId, empresaOpciones, cargarEmpresas } = useEmpresaFiltro()
const roleFilter = ref('')
const rolesDisponibles = ref([])

const roleOptions = computed(() => {
  const activos = rolesDisponibles.value
    .filter((rol) => rol.estado !== false)
    .map((rol) => ({ value: Number(rol.id), label: rol.nombre }))
  const opciones = activos.length ? activos : ROLES_POR_DEFECTO
  // La empresa solo puede crear y editar bodegueros de su propio equipo.
  return isEmpresa.value ? opciones.filter((rol) => rol.label === 'bodeguero') : opciones
})

function nombreRol(id) {
  return roleOptions.value.find((rol) => rol.value === Number(id))?.label ?? ''
}

const columns = computed(() => [
  { key: 'nombre', label: 'Nombre' },
  { key: 'correo', label: 'Correo' },
  { key: 'rol', label: 'Rol' },
  ...(esAdmin.value ? [{ key: 'empresa_nombre', label: 'Empresa' }] : []),
  { key: 'numero_documento', label: 'Documento' },
])

const baseFields = [
  { key: 'nombre', label: 'Nombre', required: true, maxLength: 100 },
  {
    key: 'correo',
    label: 'Correo',
    type: 'email',
    required: true,
    noSpaces: true,
    hint: 'Ej. nombre@empresa.com.',
  },
  {
    key: 'contrasena',
    label: 'Contraseña',
    type: 'password',
    required: true,
    minLength: 8,
    hint: 'Mínimo 8 caracteres.',
  },
  { key: 'rol_id', label: 'Rol', type: 'select', required: true },
]

const effectiveRole = computed(() => {
  if (isBodeguero.value) return 'cliente'
  if (isEmpresa.value) return 'bodeguero'
  return roleFilter.value
})

const fields = computed(() => {
  const list = baseFields
    .filter((field) => field.key !== 'rol_id' || !isEmpresa.value)
    .map((field) =>
      field.key === 'rol_id' ? { ...field, options: roleOptions.value } : { ...field },
    )
  if (nombreRol(form.value.rol_id) === 'cliente') list.push(...camposCliente(form.value.tipo_documento))
  // Multiempresa: el admin debe elegir la empresa al crear/editar un bodeguero o usuario `empresa`.
  if (esAdmin.value && ['bodeguero', 'empresa'].includes(nombreRol(form.value.rol_id))) {
    list.push(campoEmpresa(empresaOpciones.value))
  }
  if (editing.value) {
    const password = list.find((field) => field.key === 'contrasena')
    password.required = false
    password.label = 'Contraseña (vacía = no cambiar)'
  }
  return list
})

async function cargarRoles() {
  try {
    const result = await rolesApi.list({ page: 1, limit: 100 })
    if (result.data?.length) rolesDisponibles.value = result.data
  } catch {
    // Si falla, seguimos con los tres roles por defecto para no bloquear el formulario.
  }
}

function cleanPayload(payload) {
  const clean = quitarVacios(payload)
  if (isEmpresa.value) {
    // La empresa solo crea bodegueros de su equipo: el backend asigna rol y empresa por token.
    delete clean.rol_id
    delete clean.empresa_id
  } else if (clean.rol_id !== undefined) {
    clean.rol_id = Number(clean.rol_id)
  }
  if (esAdmin.value && clean.empresa_id !== undefined) {
    clean.empresa_id = Number(clean.empresa_id)
  }
  return clean
}

const {
  canCreate, canEdit, canDelete, createLabel, confirmacion,
  rows, total, page, limit, q, loading, alert,
  modalOpen, editing, form, saving, confirmOpen, deleting, removing,
  openCreate, openEdit, save, askDelete, confirmDelete,
} = useCrud({
  modulo: 'usuarios',
  api: usuariosApi,
  columns,
  fields,
  createLabel: 'Nuevo usuario',
  emptyForm: () => {
    const empty = Object.fromEntries(fields.value.map((field) => [field.key, '']))
    if (isEmpresa.value) {
      empty.rol_id = roleOptions.value.find((rol) => rol.label === 'bodeguero')?.value ?? 2
    }
    return empty
  },
  formFromRow: (row) => ({
    nombre: row.nombre ?? '',
    correo: row.correo ?? '',
    contrasena: '',
    rol_id: resolveRolId(row, roleOptions.value),
    empresa_id: row.empresa_id ?? row.empresa?.id ?? '',
    tipo_documento: row.tipo_documento ?? '',
    numero_documento: row.numero_documento ?? '',
    telefono: row.telefono ?? '',
    direccion: row.direccion ?? '',
    ciudad: row.ciudad ?? '',
  }),
  actualParaCambios: (row) => normalizarUsuarioFila(row, roleOptions.value),
  normalizarCambio: (key, valor) =>
    key === 'rol_id' || key === 'empresa_id'
      ? valor === '' || valor == null
        ? ''
        : String(valor)
      : valor,
  transformarFila: (usuario) => normalizarUsuarioFila(usuario, roleOptions.value),
  cleanPayload,
  duplicateMessage: 'Ya existe un usuario con ese correo. Probá con otro.',
  mensajes: {
    creado: (clean) => `Usuario creado. "${clean.nombre}" ya puede iniciar sesión.`,
    actualizado: 'Usuario actualizado. Los cambios ya están guardados.',
    eliminado: 'Usuario eliminado. Ya no tiene acceso.',
    sinCambios: 'No hay cambios: el usuario ya estaba guardado.',
    fallbackGuardar: 'No se pudo guardar el usuario.',
  },
  confirmacion: {
    titulo: 'Eliminar usuario',
    mensaje: 'El usuario perderá el acceso. Esta acción no se puede deshacer.',
  },
  paramsExtra: () => ({
    ...(effectiveRole.value ? { rol: effectiveRole.value } : {}),
    ...empresaParams(esAdmin.value, empresaId.value),
  }),
  filtros: [roleFilter, empresaId],
  antesDeAbrir: () => {
    cargarEmpresas()
    return cargarRoles()
  },
  alMontar: cargarRoles,
})
</script>

<template>
  <CrudPage
    titulo="Usuarios"
    descripcion="Crea usuarios y asigna su rol de acceso."
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
    crear-titulo="Nuevo usuario"
    editar-titulo="Editar usuario"
    crear-submit-label="Crear usuario"
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
    <template #filter>
      <label v-if="!isBodeguero && !isEmpresa" class="filter">
        Filtrar por rol
        <select v-model="roleFilter" data-test="role-filter">
          <option value="">Todos</option>
          <option
            v-for="rol in roleOptions"
            :key="rol.value"
            :value="rol.label"
            :data-test="`role-filter-option-${rol.value}`"
          >
            {{ rol.label }}
          </option>
        </select>
      </label>
      <EmpresaSelect v-if="esAdmin" v-model="empresaId" :empresas="empresaOpciones" />
    </template>
  </CrudPage>
</template>

<style scoped>
.filter { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
.filter select { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px 10px; }
</style>
