import { computed, onMounted, ref, unref, watch } from 'vue'
import { getErrorMessage } from '../../../shared/api/axios'
import { tienePermiso } from '../../../shared/config/permissions'
import { useAuthStore } from '../../auth/store/auth'
import { changedFields, errorMessage, paramsLista } from '../utils/crud'

/** Resuelve arrays, refs, computeds y funciones con la misma interfaz. */
function resolver(valor, ...args) {
  return typeof valor === 'function' ? valor(...args) : unref(valor)
}

function esPromesa(valor) {
  return Boolean(valor && typeof valor.then === 'function')
}

/**
 * Esqueleto común de los listados con alta, edición y baja.
 * Cada vista aporta su configuración: columnas, campos, mensajes y reglas propias.
 */
export function useCrud(config) {
  const {
    modulo,
    api,
    columns,
    fields,
    createLabel,
    emptyForm,
    formFromRow,
    cleanPayload = (payload) => payload,
    normalizarCambio,
    actualParaCambios,
    duplicateMessage,
    mensajes = {},
    confirmacion: confirmacionConfig = {},
    paramsExtra = () => ({}),
    filtros = [],
    transformarFila = (fila) => fila,
    alMontar,
    antesDeAbrir,
    despuesDeGuardar,
  } = config

  const auth = useAuthStore()
  const canCreate = computed(() => tienePermiso(auth.permisos, auth.role, modulo, 'create'))
  const canEdit = computed(() => tienePermiso(auth.permisos, auth.role, modulo, 'edit'))
  const canDelete = computed(() => tienePermiso(auth.permisos, auth.role, modulo, 'delete'))

  const columnas = computed(() => resolver(columns))
  const campos = computed(() => resolver(fields))
  const confirmacion = computed(() => resolver(confirmacionConfig))

  const rows = ref([])
  const total = ref(0)
  const page = ref(1)
  const limit = ref(10)
  const q = ref('')
  const loading = ref(false)
  const alert = ref(null)

  const modalOpen = ref(false)
  const editing = ref(null)
  const form = ref({})
  const saving = ref(false)

  const confirmOpen = ref(false)
  const deleting = ref(null)
  const removing = ref(false)

  let searchTimer

  watch([q, ...filtros], () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => {
      if (page.value !== 1) page.value = 1
      else load()
    }, 300)
  })

  watch(page, () => load())

  async function load() {
    loading.value = true
    try {
      const result = await api.list(
        paramsLista({
          q: q.value,
          page: page.value,
          limit: limit.value,
          extra: resolver(paramsExtra),
        }),
      )
      rows.value = (result.data ?? []).map(transformarFila)
      total.value = result.total ?? 0
    } catch (error) {
      alert.value = { type: 'error', message: getErrorMessage(error) }
    } finally {
      loading.value = false
    }
  }

  function abrir(prepare) {
    const antes = antesDeAbrir ? antesDeAbrir() : null
    const continuar = () => {
      const resultado = prepare()
      if (esPromesa(resultado)) {
        return resultado.then((formulario) => {
          form.value = formulario
          modalOpen.value = true
        })
      }
      form.value = resultado
      modalOpen.value = true
    }
    return esPromesa(antes) ? antes.then(continuar) : continuar()
  }

  function openCreate() {
    return abrir(() => {
      editing.value = null
      return resolver(emptyForm)
    })
  }

  function openEdit(row) {
    return abrir(() => {
      editing.value = row
      return resolver(formFromRow, row)
    })
  }

  async function save(payload) {
    saving.value = true
    const clean = cleanPayload(payload)
    try {
      if (editing.value) {
        const actual = actualParaCambios ? actualParaCambios(editing.value) : editing.value
        const changes = normalizarCambio
          ? changedFields(clean, actual, normalizarCambio)
          : changedFields(clean, actual)
        if (Object.keys(changes).length === 0) {
          modalOpen.value = false
          alert.value = { type: 'info', message: mensajes.sinCambios }
          return
        }
        const updated = await api.update(editing.value.id, changes)
        const merged = { ...editing.value, ...updated }
        rows.value = rows.value.map((row) => (row.id === merged.id ? merged : row))
        alert.value = {
          type: 'success',
          message: resolver(mensajes.actualizado, clean, merged),
        }
      } else {
        const created = await api.create(clean)
        rows.value = [created, ...rows.value]
        total.value += 1
        alert.value = {
          type: 'success',
          message: resolver(mensajes.creado, clean, created, payload),
        }
      }
      modalOpen.value = false
      if (despuesDeGuardar) despuesDeGuardar(clean)
    } catch (error) {
      alert.value = {
        type: 'error',
        message: errorMessage(error, mensajes.fallbackGuardar, duplicateMessage),
      }
    } finally {
      saving.value = false
    }
  }

  function askDelete(row) {
    deleting.value = row
    confirmOpen.value = true
  }

  async function confirmDelete() {
    removing.value = true
    try {
      await api.remove(deleting.value.id)
      rows.value = rows.value.filter((row) => row.id !== deleting.value.id)
      total.value = Math.max(0, total.value - 1)
      confirmOpen.value = false
      alert.value = {
        type: 'success',
        message: resolver(mensajes.eliminado, deleting.value),
      }
    } catch (error) {
      alert.value = { type: 'error', message: getErrorMessage(error) }
    } finally {
      removing.value = false
    }
  }

  onMounted(() => {
    load()
    if (alMontar) alMontar()
  })

  return {
    canCreate,
    canEdit,
    canDelete,
    columnas,
    campos,
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
    load,
    openCreate,
    openEdit,
    save,
    askDelete,
    confirmDelete,
  }
}
