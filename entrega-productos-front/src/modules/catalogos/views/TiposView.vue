<script setup>
import CrudPage from '../../../shared/ui/CrudPage.vue'
import StatusBadge from '../../../shared/ui/StatusBadge.vue'
import { computed, ref, watch } from 'vue'
import { useAuthStore } from '../../auth/store/auth'
import bodegasApi from '../api/bodegas'
import tiposApi from '../api/tipos'
import { useCrud } from '../composables/useCrud'
import EmpresaSelect from '../../empresas/components/EmpresaSelect.vue'
import { empresaParams, nombreEmpresaDe, useEmpresaFiltro } from '../../empresas/composables/useEmpresaFiltro'

// Admin y empresa pueden elegir bodega; el bodeguero queda atado a la suya.
const auth = useAuthStore()
const { esAdmin, empresaId, empresaOpciones } = useEmpresaFiltro()
const puedeElegirBodega = computed(() => esAdmin.value || auth.role === 'empresa')
const bodegas = ref([])
const bodegasModal = ref([])
const bodegaId = ref('')

const bodegasOpciones = computed(() =>
  bodegas.value.filter((b) => b.estado !== false).map((b) => ({ value: b.id, label: b.nombre })),
)
const bodegasModalOpciones = computed(() =>
  (esAdmin.value ? bodegasModal.value : bodegas.value)
    .filter((b) => b.estado !== false)
    .map((b) => ({ value: b.id, label: b.nombre })),
)
const nombreBodega = (id) =>
  bodegas.value.find((bodega) => String(bodega.id) === String(id))?.nombre ?? ''

const columns = computed(() => [
  { key: 'nombre', label: 'Nombre' },
  ...(esAdmin.value ? [{ key: 'empresa_nombre', label: 'Empresa' }] : []),
  ...(puedeElegirBodega.value ? [{ key: 'bodega_nombre', label: 'Bodega' }] : []),
  { key: 'estado', label: 'Estado' },
])

const fields = computed(() => {
  const list = [{ key: 'nombre', label: 'Nombre', required: true, maxLength: 100 }]
  if (esAdmin.value && empresaOpciones.value.length) {
    list.push({
      key: 'empresa_id',
      label: 'Empresa',
      type: 'select',
      options: [{ value: '', label: 'Todas las empresas y bodegas (general)' }, ...empresaOpciones.value],
      hint: 'Elige una empresa para asignar una bodega específica.',
    })
    if (form.value.empresa_id && bodegasModalOpciones.value.length) {
      list.push({
        key: 'bodega_id',
        label: 'Bodega',
        type: 'select',
        required: true,
        options: [{ value: '', label: 'Selecciona la bodega…' }, ...bodegasModalOpciones.value],
      })
    }
    return list
  }
  if (!puedeElegirBodega.value || !bodegasOpciones.value.length) return list
  list.push({
    key: 'bodega_id',
    label: 'Bodega',
    type: 'select',
    required: auth.role === 'empresa',
    options: [
      { value: '', label: auth.role === 'empresa' ? 'Selecciona la bodega…' : 'Tipo general (sin bodega)' },
      ...bodegasOpciones.value,
    ],
  })
  return list
})

async function cargarBodegas() {
  try {
    // Con empresa elegida, las bodegas del selector son solo las de esa empresa.
    const params = { page: 1, limit: 100 }
    if (empresaId.value) params.empresa_id = empresaId.value
    const result = await bodegasApi.list(params)
    bodegas.value = result.data ?? []
  } catch {
    bodegas.value = []
  }
}

async function cargarBodegasModal(empresaObjetivo) {
  if (!esAdmin.value) return
  if (!empresaObjetivo) {
    bodegasModal.value = []
    return
  }
  try {
    const result = await bodegasApi.list({ page: 1, limit: 100, empresa_id: empresaObjetivo })
    bodegasModal.value = result.data ?? []
  } catch {
    bodegasModal.value = []
  }
}

// Al cambiar la empresa del filtro se recargan bodegas y listado de tipos.
watch(empresaId, () => {
  cargarBodegas()
  if (page.value !== 1) page.value = 1
  else load()
})

function cleanPayload(payload) {
  const clean = { nombre: String(payload.nombre ?? '').trim() }
  const usaEmpresaModal = esAdmin.value && empresaOpciones.value.length > 0
  const bodegaElegida = usaEmpresaModal
    ? payload.empresa_id
      ? payload.bodega_id
      : ''
    : puedeElegirBodega.value
      ? payload.bodega_id
      : bodegaId.value
  const sinBodega = bodegaElegida === '' || bodegaElegida === null || bodegaElegida === undefined
  if (!sinBodega) clean.bodega_id = Number(bodegaElegida)
  // En edición, admin o empresa también pueden devolver un tipo a "general" (null).
  if (editing.value && puedeElegirBodega.value && sinBodega) clean.bodega_id = null
  return clean
}

const {
  canCreate, canEdit, canDelete, createLabel, confirmacion,
  rows, total, page, limit, q, loading, alert,
  modalOpen, editing, form, saving, confirmOpen, deleting, removing,
  load, openCreate, openEdit, save, askDelete, confirmDelete, toggleEstado,
} = useCrud({
  modulo: 'tipos',
  api: tiposApi,
  columns,
  fields,
  createLabel: 'Nuevo producto',
  emptyForm: () => ({
    nombre: '',
    empresa_id: esAdmin.value ? empresaId.value || '' : '',
    bodega_id:
      bodegaId.value ||
      (esAdmin.value && empresaOpciones.value.length ? '' : bodegas.value[0]?.id || ''),
  }),
  formFromRow: (row) => ({
    nombre: row.nombre ?? '',
    empresa_id:
      row.empresa_id ??
      bodegas.value.find((b) => String(b.id) === String(row.bodega_id))?.empresa_id ??
      '',
    bodega_id: row.bodega_id == null ? '' : row.bodega_id,
  }),
  cleanPayload,
  // En edición, si la fila no trae bodega, comparamos contra la bodega activa del filtro.
  actualParaCambios: (row) => ({ ...row, bodega_id: row.bodega_id ?? bodegaId.value }),
  // "" y null significan "general", así que se comparan como el mismo valor.
  normalizarCambio: (key, valor) =>
    key === 'bodega_id'
      ? valor == null || valor === ''
        ? null
        : String(valor)
      : String(valor ?? ''),
  transformarFila: (tipo) => {
    const bodega = bodegas.value.find((b) => String(b.id) === String(tipo.bodega_id))
    const empId = tipo.empresa_id ?? bodega?.empresa_id
    return {
      ...tipo,
      bodega_nombre: tipo.bodega_nombre || nombreBodega(tipo.bodega_id) || 'General',
      empresa_nombre:
        tipo.empresa_nombre || tipo.empresa?.razon_social || bodega?.empresa_nombre || nombreEmpresaDe(empresaOpciones.value, empId) || 'General (todas)',
    }
  },
  paramsExtra: () => ({
    ...(bodegaId.value ? { bodega_id: bodegaId.value } : {}),
    ...empresaParams(esAdmin.value, empresaId.value),
  }),
  filtros: [bodegaId, empresaId],
  duplicateMessage: 'Ya existe un tipo con ese nombre en esta bodega. Probá con otro.',
  mensajes: {
    creado: (clean) => `Producto creado. "${clean.nombre}" ya está en la lista.`,
    actualizado: 'Producto actualizado. Los cambios ya están guardados.',
    eliminado: 'Producto eliminado. Ya no aparece en la lista.',
    sinCambios: 'No hay cambios: el tipo ya estaba guardado.',
    fallbackGuardar: 'No se pudo guardar el tipo.',
  },
  confirmacion: { titulo: 'Eliminar tipo', mensaje: 'El tipo se eliminará de forma permanente. Esta acción no se puede deshacer.' },
  despuesDeGuardar: (clean) => {
    if (!puedeElegirBodega.value) return
    const vista = clean.bodega_id ?? ''
    if (String(vista) !== String(bodegaId.value)) bodegaId.value = vista
  },
  alMontar: () =>
    cargarBodegas().then(() => {
      // Admin y empresa arrancan en "Todas" para ver también los tipos generales.
      if (!puedeElegirBodega.value && !bodegaId.value && bodegas.value.length) {
        bodegaId.value = bodegas.value[0].id
      }
    }),
})

// El cambio de bodega recarga enseguida: el filtro de búsqueda sí lleva debounce.
watch(bodegaId, () => {
  if (page.value !== 1) page.value = 1
  else load()
})

// En el formulario del admin, al cambiar empresa se cargan sus bodegas específicas.
watch(
  () => [modalOpen.value, form.value?.empresa_id],
  async ([abierto, empForm], [estabaAbierto, empAnterior]) => {
    if (!esAdmin.value || !abierto) return
    await cargarBodegasModal(empForm)
    if (estabaAbierto && empForm !== empAnterior && form.value?.bodega_id) {
      const sigue = bodegasModal.value.some((b) => String(b.id) === String(form.value.bodega_id))
      if (!sigue) form.value = { ...form.value, bodega_id: '' }
    }
  },
)
function empresaDeTipo(row) {
  if (row.bodega_id == null && !row.empresa_id) return 'General (todas)'
  const bodega = bodegas.value.find((b) => String(b.id) === String(row.bodega_id))
  const empId = row.empresa_id ?? bodega?.empresa_id
  return (
    (row.empresa_nombre && row.empresa_nombre !== 'General (todas)' ? row.empresa_nombre : '') ||
    row.empresa?.razon_social ||
    bodega?.empresa_nombre ||
    nombreEmpresaDe(empresaOpciones.value, empId) ||
    (empId ? `Empresa #${empId}` : '—')
  )
}
</script>

<template>
  <CrudPage
    titulo="Tipos de producto"
    descripcion="Crea y edita los productos disponibles en cada bodega."
    badge="Catálogo"
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
    :fields="fields"
    :form="form"
    :saving="saving"
    crear-titulo="Nuevo producto"
    editar-titulo="Editar producto"
    crear-submit-label="Crear producto"
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
      <StatusBadge :estado="value === false ? 'Inactivo' : 'Activo'" />
    </template>
    <template #cell-empresa_nombre="{ row }">
      <span>{{ empresaDeTipo(row) }}</span>
    </template>
    <template #filter>
      <EmpresaSelect v-if="esAdmin" v-model="empresaId" :empresas="empresaOpciones" />
      <label v-if="puedeElegirBodega || bodegas.length > 1" class="filter">
        Bodega
        <select v-model="bodegaId" data-test="bodega-filter">
          <option v-if="puedeElegirBodega" value="">Todas las bodegas</option>
          <option v-for="bodega in bodegas" :key="bodega.id" :value="bodega.id">
            {{ bodega.nombre }}
          </option>
        </select>
      </label>
    </template>
  </CrudPage>
</template>

<style scoped>
.filter { display: flex; align-items: center; gap: 10px; font-size: 0.9rem; }
.filter select { border: 1px solid #d1d5db; border-radius: 8px; padding: 8px; font: inherit; }
</style>
