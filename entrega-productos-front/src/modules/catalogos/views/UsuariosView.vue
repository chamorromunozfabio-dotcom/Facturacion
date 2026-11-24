<script setup>
import CrudPage from '../../../shared/ui/CrudPage.vue'
import { computed, ref } from 'vue'
import rolesApi from '../api/roles'
import usuariosApi from '../api/usuarios'
import { quitarVacios } from '../utils/crud'
import { useAuthStore } from '../../auth/store/auth'
import { useCrud } from '../composables/useCrud'
import EmpresaSelect from '../../empresas/components/EmpresaSelect.vue'
import { campoEmpresa, empresaParams, useEmpresaFiltro } from '../../empresas/composables/useEmpresaFiltro'

const auth = useAuthStore()
const isBodeguero = computed(() => auth.role === 'bodeguero')
const isEmpresa = computed(() => auth.role === 'empresa')
const { esAdmin, empresaId, empresaOpciones } = useEmpresaFiltro()
const roleFilter = ref('')

// Los roles NO son fijos: el admin puede crear otros y el backend los devuelve en
// GET /roles. Solo hay respaldo para los tres clásicos; `empresa` se resuelve
// siempre por nombre desde el backend (su id no es fijo ni conocido).
const ROLES_POR_DEFECTO = [
  { value: 1, label: 'admin' }, { value: 2, label: 'bodeguero' },
  { value: 3, label: 'cliente' },
]
const IDS_POR_DEFECTO = Object.fromEntries(ROLES_POR_DEFECTO.map((rol) => [rol.label, rol.value]))
const rolesDisponibles = ref([])

const roleOptions = computed(() => {
  const activos = rolesDisponibles.value
    .filter((rol) => rol.estado !== false)
    .map((rol) => ({ value: rol.id, label: rol.nombre }))
  const opciones = activos.length ? activos : ROLES_POR_DEFECTO
  // La empresa solo puede crear y editar bodegueros de su propio equipo.
  return isEmpresa.value ? opciones.filter((rol) => rol.label === 'bodeguero') : opciones
})

function nombreRol(id) {
  return roleOptions.value.find((rol) => rol.value === Number(id))?.label ?? ''
}

function resolveRolId(row) {
  if (row.rol_id !== undefined && row.rol_id !== null && row.rol_id !== '') return row.rol_id
  return roleOptions.value.find((rol) => rol.label === row.rol)?.value ?? IDS_POR_DEFECTO[row.rol] ?? ''
}

const documentOptions = ['CC', 'NIT', 'CE', 'PA'].map((value) => ({ value, label: value }))
// El backend solo acepta dígitos: 7 a 15 para el teléfono del usuario, sin
// símbolos (RESPUESTA_SOLO_NUMEROS.md). Bodegas sí sigue aceptando texto libre.
const phonePattern = /^[0-9]{7,15}$/
const phoneMessage = 'Solo dígitos: entre 7 y 15.'

const documentPatterns = { numerico: /^[0-9]+$/, pasaporte: /^[A-Za-z0-9]+$/ }

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
// El backend los acepta como opcionales para todos los roles (PA incluido).
// Al editar, el documento se valida con el tipo que va a quedar guardado:
// solo PA acepta letras, y en ambos casos sin puntos, guiones ni espacios.
const clienteFields = computed(() => {
  const esPasaporte = String(form.value.tipo_documento ?? '').toUpperCase() === 'PA'
  return [
    {
      key: 'tipo_documento',
      label: 'Tipo de documento',
      type: 'select',
      options: documentOptions,
    },
    {
      key: 'numero_documento',
      label: 'Número de documento',
      maxLength: 20,
      digitsOnly: !esPasaporte,
      lettersDigitsOnly: esPasaporte,
      pattern: esPasaporte ? documentPatterns.pasaporte : documentPatterns.numerico,
      message: esPasaporte
        ? 'Solo letras y números, sin símbolos.'
        : 'Solo números, sin puntos, guiones ni espacios.',
      hint: esPasaporte ? 'Letras y números, sin símbolos.' : 'Solo números, sin puntos ni guiones.',
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      digitsOnly: true,
      maxLength: 15,
      pattern: phonePattern,
      message: phoneMessage,
      hint: 'Solo números, entre 7 y 15.',
    },
    { key: 'direccion', label: 'Dirección' },
    { key: 'ciudad', label: 'Ciudad' },
  ]
})

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
  if (nombreRol(form.value.rol_id) === 'cliente') list.push(...clienteFields.value)
  // Multiempresa: el admin debe elegir la empresa al crear un bodeguero o un
  // usuario `empresa`; con otro rol el campo no aplica ni se envía.
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

/** Trae los roles reales del backend, incluidos los creados después del despliegue. */
async function cargarRoles() {
  try {
    const result = await rolesApi.list({ page: 1, limit: 100 })
    if (result.data?.length) rolesDisponibles.value = result.data
  } catch {
    // Si falla, seguimos con los tres roles por defecto para no bloquear el formulario.
  }
}

function rolBodegueroId() {
  return roleOptions.value.find((rol) => rol.label === 'bodeguero')?.value ?? 2
}

function cleanPayload(payload) {
  const clean = quitarVacios(payload)
  if (isEmpresa.value) {
    // La empresa nunca crea admins ni clientes: el backend además asigna la
    // empresa del token, así que el rol viaja fijo como bodeguero.
    clean.rol_id = rolBodegueroId()
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
    if (isEmpresa.value) empty.rol_id = rolBodegueroId()
    return empty
  },
  formFromRow: (row) => ({
    nombre: row.nombre ?? '',
    correo: row.correo ?? '',
    contrasena: '',
    rol_id: resolveRolId(row),
    empresa_id: row.empresa_id ?? '',
    tipo_documento: row.tipo_documento ?? '',
    numero_documento: row.numero_documento ?? '',
    telefono: row.telefono ?? '',
    direccion: row.direccion ?? '',
    ciudad: row.ciudad ?? '',
  }),
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
  antesDeAbrir: cargarRoles,
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
