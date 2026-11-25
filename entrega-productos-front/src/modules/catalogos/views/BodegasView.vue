<script setup>
import CrudPage from '../../../shared/ui/CrudPage.vue'
import { computed, ref, watch } from 'vue'
import bodegasApi from '../api/bodegas'
import usuariosApi from '../api/usuarios'
import { useAuthStore } from '../../auth/store/auth'
import { useCrud } from '../composables/useCrud'
import EmpresaSelect from '../../empresas/components/EmpresaSelect.vue'
import { campoEmpresa, empresaParams, useEmpresaFiltro } from '../../empresas/composables/useEmpresaFiltro'

// El admin asigna empresa y dueño; la empresa asigna dueño entre sus bodegueros.
const auth = useAuthStore()
const { esAdmin, empresaId, empresaOpciones } = useEmpresaFiltro()
const esEmpresa = computed(() => auth.role === 'empresa')
const puedeElegirDueno = computed(() => esAdmin.value || esEmpresa.value)
const bodegueroOptions = ref([])

const columns = computed(() => [
  { key: 'nombre', label: 'Nombre' },
  ...(esAdmin.value ? [{ key: 'empresa_nombre', label: 'Empresa' }] : []),
  ...(puedeElegirDueno.value ? [{ key: 'bodeguero_nombre', label: 'Bodeguero' }] : []),
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'recibe_nombre', label: 'Responsable' },
  { key: 'telefono', label: 'Teléfono' },
])

const phonePattern = /^[0-9]{7,20}$/
const phoneMessage = 'Solo dígitos: entre 7 y 20.'

// El backend exige los 11 datos. `codigo`, `recibe_documento` y `recibe_cargo`
// tenían un largo distinto en el front; aquí van con el nuevo límite.
const fields = [
  { key: 'nombre', label: 'Nombre', required: true, maxLength: 100 },
  { key: 'codigo', label: 'Código', required: true, maxLength: 30 },
  { key: 'direccion', label: 'Dirección', required: true, maxLength: 200 },
  { key: 'ciudad', label: 'Ciudad', required: true, maxLength: 100 },
  { key: 'departamento', label: 'Departamento', required: true, maxLength: 100 },
  {
    key: 'telefono',
    label: 'Teléfono',
    required: true,
    digitsOnly: true,
    maxLength: 20,
    pattern: phonePattern,
    message: phoneMessage,
    hint: 'Ej. 3001234567',
  },
  {
    key: 'correo',
    label: 'Correo de la bodega',
    required: true,
    type: 'email',
    maxLength: 100,
    noSpaces: true,
    hint: 'Ej. bodega@empresa.com.',
  },
  { key: 'recibe_nombre', label: 'Nombre de quien recibe', required: true, maxLength: 100 },
  {
    key: 'recibe_documento',
    label: 'Documento de quien recibe',
    required: true,
    digitsOnly: true,
    maxLength: 30,
    hint: 'Solo números, sin puntos ni guiones.',
  },
  { key: 'recibe_cargo', label: 'Cargo de quien recibe', required: true, maxLength: 100 },
  {
    key: 'recibe_telefono',
    label: 'Teléfono de quien recibe',
    required: true,
    digitsOnly: true,
    maxLength: 20,
    pattern: phonePattern,
    message: phoneMessage,
    hint: 'Ej. 3109876543',
  },
]

const formFields = computed(() => [
  ...(esAdmin.value ? [campoEmpresa(empresaOpciones.value)] : []),
  ...fields,
  ...(puedeElegirDueno.value
    ? [
        {
          key: 'bodeguero_id',
          label: 'Bodeguero dueño',
          type: 'select',
          options: [{ value: '', label: 'Sin asignar' }, ...bodegueroOptions.value],
        },
      ]
    : []),
])

const emptyForm = () => Object.fromEntries(formFields.value.map((field) => [field.key, '']))
const formFromRow = (row) =>
  Object.fromEntries(
    formFields.value.map((field) => [
      field.key,
      field.key === 'bodeguero_id' ? String(row[field.key] ?? '') : row[field.key] ?? '',
    ]),
  )

async function loadBodegueros(empresaObjetivo = empresaId.value) {
  if (!puedeElegirDueno.value) return
  try {
    // El dueño debe ser de la misma empresa que la bodega (400 si no).
    const params = { rol: 'bodeguero', page: 1, limit: 100 }
    if (esAdmin.value && empresaObjetivo) params.empresa_id = empresaObjetivo
    const result = await usuariosApi.list(params)
    bodegueroOptions.value = (result.data ?? []).map((user) => ({
      value: user.id,
      label: user.nombre,
    }))
  } catch {
    bodegueroOptions.value = []
  }
}

// Al cambiar de empresa, los bodegueros disponibles deben ser solo los de ella.
watch(empresaId, (nueva) => {
  if (!modalOpen.value) loadBodegueros(nueva)
})

// Todos los datos son obligatorios: no filtramos vacíos para que el usuario
// vea el aviso en el campo en vez de un error raro del backend.
function cleanPayload(payload) {
  const limpio = Object.fromEntries(
    Object.entries(payload).filter(([key]) => key !== 'bodeguero_id'),
  )
  if (typeof limpio.codigo === 'string') limpio.codigo = limpio.codigo.trim().toUpperCase()
  if (esAdmin.value && limpio.empresa_id !== undefined) {
    limpio.empresa_id = Number(limpio.empresa_id)
  }
  if (puedeElegirDueno.value && payload.bodeguero_id) {
    limpio.bodeguero_id = Number(payload.bodeguero_id)
  } else if (puedeElegirDueno.value && editing.value?.bodeguero_id != null) {
    // Al dejar "Sin asignar" en una edición, quitamos el dueño actual.
    limpio.bodeguero_id = null
  }
  return limpio
}

const {
  canCreate,
  canEdit,
  canDelete,
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
  modulo: 'bodegas',
  api: bodegasApi,
  columns,
  fields: formFields,
  createLabel: 'Nueva bodega',
  emptyForm,
  formFromRow,
  cleanPayload,
  // El dueño puede venir como número o como string según el backend.
  normalizarCambio: (key, valor) =>
    key === 'bodeguero_id' || key === 'empresa_id' ? String(valor ?? '') : valor,
  duplicateMessage: 'Ya existe una bodega con ese nombre. Probá con otro.',
  mensajes: {
    creado: (clean) => `Bodega creada. "${clean.nombre}" ya está en la lista.`,
    actualizado: 'Bodega actualizada. Los cambios ya están guardados.',
    eliminado: 'Bodega eliminada. Ya no aparece en la lista.',
    sinCambios: 'No hay cambios: la bodega ya estaba guardada.',
    fallbackGuardar: 'No se pudo guardar la bodega.',
  },
  confirmacion: {
    titulo: 'Eliminar bodega',
    mensaje: 'La bodega se eliminará de forma permanente. Esta acción no se puede deshacer.',
  },
  paramsExtra: () => empresaParams(esAdmin.value, empresaId.value),
  filtros: [empresaId],
  alMontar: () => loadBodegueros(),
})

watch(
  () => [modalOpen.value, form.value?.empresa_id],
  async ([abierto, empForm], [estabaAbierto, empAnterior]) => {
    if (!esAdmin.value || !abierto) return
    const empresaObjetivo = empForm || empresaId.value || ''
    await loadBodegueros(empresaObjetivo)
    if (
      estabaAbierto &&
      empForm !== empAnterior &&
      form.value?.bodeguero_id &&
      !bodegueroOptions.value.some((opt) => String(opt.value) === String(form.value.bodeguero_id))
    ) {
      form.value = { ...form.value, bodeguero_id: '' }
    }
  },
)
</script>

<template>
  <CrudPage
    titulo="Bodegas"
    descripcion="Administra las bodegas y sus datos de contacto."
    badge="Inventario"
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
    :fields="formFields"
    :form="form"
    :saving="saving"
    crear-titulo="Nueva bodega"
    editar-titulo="Editar bodega"
    crear-submit-label="Crear bodega"
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
      <EmpresaSelect v-if="esAdmin" v-model="empresaId" :empresas="empresaOpciones" />
    </template>
  </CrudPage>
</template>
