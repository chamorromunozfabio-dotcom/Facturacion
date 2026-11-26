<script setup>
import CrudPage from '../../../shared/ui/CrudPage.vue'
import { computed, ref, watch } from 'vue'
import bodegasApi from '../api/bodegas'
import usuariosApi from '../api/usuarios'
import BodeguerosEmpresaCrud from '../components/BodeguerosEmpresaCrud.vue'
import { useAuthStore } from '../../auth/store/auth'
import { useCrud } from '../composables/useCrud'
import { BODEGA_FIELDS } from '../utils/bodegas'
import EmpresaSelect from '../../empresas/components/EmpresaSelect.vue'
import { campoEmpresa, empresaParams, useEmpresaFiltro } from '../../empresas/composables/useEmpresaFiltro'

// El admin asigna empresa y dueño; la empresa asigna dueño entre sus bodegueros.
const auth = useAuthStore()
const { esAdmin, empresaId, empresaOpciones } = useEmpresaFiltro()
const esEmpresa = computed(() => auth.role === 'empresa')
const puedeElegirDueno = computed(() => esAdmin.value || esEmpresa.value)
const bodeguerosLista = ref([])
const bodegueroOptions = ref([])
const tab = ref('bodegas')

const columns = computed(() => [
  { key: 'nombre', label: 'Nombre' },
  ...(esAdmin.value ? [{ key: 'empresa_nombre', label: 'Empresa' }] : []),
  ...(puedeElegirDueno.value
    ? [{ key: 'bodeguero_nombre', label: 'Responsable' }]
    : [{ key: 'recibe_nombre', label: 'Responsable' }]),
  { key: 'ciudad', label: 'Ciudad' },
  { key: 'telefono', label: 'Teléfono' },
  { key: 'estado', label: 'Estado' },
])

function bodegueroSeleccionado(id = form.value?.bodeguero_id) {
  if (!id) return null
  return bodeguerosLista.value.find((u) => String(u.id) === String(id)) ?? null
}

const formFields = computed(() => {
  const idxRecibe = BODEGA_FIELDS.findIndex((f) => f.key === 'recibe_nombre')
  const generales = BODEGA_FIELDS.slice(0, idxRecibe)
  const bodeguero = bodegueroSeleccionado()
  // Si ya se eligió bodeguero, ocultamos los campos redundantes que ya vienen de él.
  const recibe = BODEGA_FIELDS.slice(idxRecibe).filter((campo) => {
    if (!bodeguero) return true
    if (campo.key === 'recibe_nombre' || campo.key === 'recibe_cargo') return false
    if (campo.key === 'recibe_documento' && bodeguero.numero_documento) return false
    if (campo.key === 'recibe_telefono' && bodeguero.telefono) return false
    return true
  })
  const dueno = puedeElegirDueno.value
    ? [
        {
          key: 'bodeguero_id',
          label: 'Bodeguero encargado',
          type: 'select',
          options: [{ value: '', label: 'Sin asignar' }, ...bodegueroOptions.value],
          hint: 'Será el responsable de recibir en esta bodega.',
        },
      ]
    : []
  return [...(esAdmin.value ? [campoEmpresa(empresaOpciones.value)] : []), ...generales, ...dueno, ...recibe]
})

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
    bodeguerosLista.value = result.data ?? []
    bodegueroOptions.value = bodeguerosLista.value.map((user) => ({
      value: user.id,
      label: user.nombre,
    }))
  } catch {
    bodeguerosLista.value = []
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
    const bodeguero = bodegueroSeleccionado(payload.bodeguero_id)
    if (bodeguero) {
      limpio.recibe_nombre = limpio.recibe_nombre || bodeguero.nombre
      limpio.recibe_documento = limpio.recibe_documento || bodeguero.numero_documento
      limpio.recibe_cargo = limpio.recibe_cargo || bodeguero.cargo || 'Bodeguero'
      limpio.recibe_telefono = limpio.recibe_telefono || bodeguero.telefono
    }
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
  toggleEstado,
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
  transformarFila: (bodega) => ({
    ...bodega,
    bodeguero_nombre: bodega.bodeguero_nombre || bodega.recibe_nombre || 'Sin asignar',
  }),
  alMontar: () => loadBodegueros(),
})

// Al cambiar la empresa dentro del modal del admin, se recargan sus bodegueros.
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

// Al elegir un bodeguero dueño, se autocompletan los datos de quien recibe.
watch(
  () => [modalOpen.value, form.value?.bodeguero_id],
  ([abierto, nuevoId], [estabaAbierto, anteriorId]) => {
    if (!abierto || !estabaAbierto || !nuevoId || String(nuevoId) === String(anteriorId)) return
    const bodeguero = bodeguerosLista.value.find((u) => String(u.id) === String(nuevoId))
    if (!bodeguero) return
    form.value = {
      ...form.value,
      recibe_nombre: bodeguero.nombre || form.value.recibe_nombre,
      recibe_documento: bodeguero.numero_documento || form.value.recibe_documento,
      recibe_cargo: bodeguero.cargo || form.value.recibe_cargo || 'Bodeguero',
      recibe_telefono: bodeguero.telefono || form.value.recibe_telefono,
    }
  },
)
</script>

<template>
  <nav v-if="esEmpresa" class="tabs" aria-label="Gestión de bodegas y bodegueros">
    <button
      type="button"
      class="tabs__btn"
      :class="{ activo: tab === 'bodegas' }"
      data-test="tab-bodegas"
      @click="tab = 'bodegas'"
    >
      Bodegas
    </button>
    <button
      type="button"
      class="tabs__btn"
      :class="{ activo: tab === 'bodegueros' }"
      data-test="tab-bodegueros"
      @click="tab = 'bodegueros'"
    >
      Mis bodegueros
    </button>
  </nav>

  <BodeguerosEmpresaCrud v-if="esEmpresa && tab === 'bodegueros'" @changed="loadBodegueros()" />

  <CrudPage
    v-else
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
    :can-toggle-estado="true"
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
    @toggle-estado="toggleEstado"
    @update:model-value="form = $event"
    @submit="save"
    @close-modal="modalOpen = false"
    @confirm="confirmDelete"
    @cancel="confirmOpen = false"
    @close-alert="alert = null"
  >
    <template #cell-estado="{ value }">
      <span>{{ value === false ? 'Inactiva' : 'Activa' }}</span>
    </template>
    <template #filter>
      <EmpresaSelect v-if="esAdmin" v-model="empresaId" :empresas="empresaOpciones" />
    </template>
  </CrudPage>
</template>

<style scoped>
.tabs { display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap; }
.tabs__btn { border: 1px solid #d1d5db; background: #fff; color: #374151; border-radius: 999px; padding: 7px 14px; font: inherit; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.tabs__btn.activo { background: #0f766e; border-color: #0f766e; color: #fff; }
</style>
