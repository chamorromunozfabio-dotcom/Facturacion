import { computed, onMounted, ref } from 'vue'
import empresasApi from '../api/empresas'
import { useAuthStore } from '../../auth/store/auth'

/**
 * Selector de empresa para el admin (multiempresa).
 *
 * - El backend filtra por el token a los demás roles: este filtro solo existe
 *   para el admin y envía `empresa_id` al listado.
 * - Las opciones vienen de `GET /empresas?estado=activa`, tal como pidió el
 *   backend para el selector.
 */
export function useEmpresaFiltro() {
  const auth = useAuthStore()
  const esAdmin = computed(() => auth.role === 'admin')
  const empresas = ref([])
  const empresaId = ref('')
  const empresaOpciones = computed(() =>
    empresas.value.map((empresa) => ({ value: empresa.id, label: empresa.razon_social })),
  )

  async function cargarEmpresas() {
    if (!esAdmin.value) return
    try {
      const result = await empresasApi.listActivas()
      empresas.value = result.data ?? []
    } catch {
      empresas.value = []
    }
  }

  onMounted(cargarEmpresas)

  return { esAdmin, empresas, empresaId, empresaOpciones, cargarEmpresas }
}

/**
 * Campo `empresa_id` del formulario del admin. Es obligatorio al crear un
 * bodeguero, un usuario `empresa` o una bodega (422 si falta).
 */
export function campoEmpresa(empresaOpciones) {
  return {
    key: 'empresa_id',
    label: 'Empresa',
    type: 'select',
    required: true,
    options: [{ value: '', label: 'Selecciona la empresa…' }, ...empresaOpciones],
    hint: 'La empresa dueña del registro.',
  }
}

/** Parámetros de listado con el filtro de empresa, solo para el admin. */
export function empresaParams(esAdmin, empresaId) {
  return esAdmin && empresaId ? { empresa_id: empresaId } : {}
}
