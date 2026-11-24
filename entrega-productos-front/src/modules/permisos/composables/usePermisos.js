import { computed, onMounted, ref } from 'vue'
import permisosApi from '../api/permisos'
import rolesApi from '../../catalogos/api/roles'
import usuariosApi from '../../catalogos/api/usuarios'
import { getErrorMessage } from '../../../shared/api/axios'
import {
  CATALOGO_PERMISOS,
  MODULOS_PERMISO,
  claveDelNombreBackend,
  plantillaDelRol,
} from '../../../shared/config/permissions'
import { normalizarTexto } from '../utils/permisos'

/**
 * Toda la lógica de "Permisos por usuario": búsqueda, matriz, cambios
 * pendientes y confirmación. La vista solo muestra las piezas.
 */
export function usePermisos() {
  const usuarios = ref([])
  const roles = ref([])
  const permisosBackend = ref([])
  const busqueda = ref('')
  const usuarioSeleccionadoId = ref(null)
  const permisosDelUsuario = ref([])
  const cambiosPendientes = ref(new Map())
  const cargando = ref(false)
  const guardando = ref(false)
  const mensaje = ref(null)

  const usuarioSeleccionado = computed(
    () => usuarios.value.find((usuario) => usuario.id === usuarioSeleccionadoId.value) ?? null,
  )
  const rolDelUsuario = computed(
    () => roles.value.find((rol) => rol.id === usuarioSeleccionado.value?.rol_id) ?? null,
  )
  const plantillaSeleccionada = computed(() => plantillaDelRol(usuarioSeleccionado.value?.rol))

  const coincidencias = computed(() => {
    const texto = normalizarTexto(busqueda.value).trim()
    if (!texto || !usuarios.value.length) return []
    return usuarios.value.filter((usuario) =>
      [usuario.nombre, usuario.correo, usuario.rol, usuario.empresa_nombre].some((valor) =>
        normalizarTexto(valor).includes(texto),
      ),
    )
  })
  const resultados = computed(() => coincidencias.value.slice(0, 8))

  /** Resuelve el id real del backend por nombre exacto (ej. `facturas_create`). */
  const idPorClave = computed(() => {
    const map = {}
    for (const permiso of permisosBackend.value) {
      const item = CATALOGO_PERMISOS.find((opcion) => opcion.nombre === permiso.nombre)
      if (item) map[item.clave] = permiso.id
    }
    return map
  })

  const permisosAsignados = computed(() =>
    permisosDelUsuario.value.map((permiso) => {
      const clave = claveDelNombreBackend(permiso.nombre)
      const item = CATALOGO_PERMISOS.find((opcion) => opcion.clave === clave)
      return {
        ...permiso,
        clave,
        etiqueta: item?.etiqueta ?? permiso.nombre,
        enCatalogo: Boolean(item),
      }
    }),
  )

  function tieneClave(clave) {
    return permisosAsignados.value.some((permiso) => permiso.clave === clave)
  }

  /** Estado que se ve en pantalla: el guardado, salvo que haya un cambio preparado. */
  function estadoCheck(opcion) {
    return cambiosPendientes.value.get(opcion.clave)?.asignado ?? opcion.asignado
  }

  /** Tarjetas por módulo: `asignado` es lo guardado y `visible` lo que se muestra. */
  const modulosConPermisos = computed(() =>
    MODULOS_PERMISO.map((modulo) => ({
      ...modulo,
      opciones: CATALOGO_PERMISOS.filter((item) => item.modulo === modulo.clave).map((item) => {
        const asignado = tieneClave(item.clave)
        return {
          ...item,
          idBackend: idPorClave.value[item.clave] ?? null,
          asignado,
          visible: cambiosPendientes.value.get(item.clave)?.asignado ?? asignado,
        }
      }),
    })),
  )

  /** Permisos que se muestran en el resumen, incluyendo los recién tildados. */
  const permisosVisibles = computed(() => {
    const lista = permisosAsignados.value.filter(
      (permiso) => cambiosPendientes.value.get(permiso.clave)?.asignado !== false,
    )
    for (const [clave, cambio] of cambiosPendientes.value) {
      if (cambio.asignado && !lista.some((permiso) => permiso.clave === clave)) {
        lista.push({ clave, etiqueta: cambio.etiqueta, nombre: cambio.nombre })
      }
    }
    return lista
  })

  const tieneCambios = computed(() => cambiosPendientes.value.size > 0)

  const resumenPermisos = computed(() =>
    permisosVisibles.value.length
      ? permisosVisibles.value.map((permiso) => permiso.etiqueta).join(' · ')
      : 'todavía no tiene permisos asignados.',
  )

  const faltanEnBackend = computed(
    () => CATALOGO_PERMISOS.filter((item) => idPorClave.value[item.clave] === undefined).length,
  )

  async function cargarPermisosDelUsuario() {
    if (!usuarioSeleccionadoId.value) {
      permisosDelUsuario.value = []
      return
    }
    try {
      const resultado = await usuariosApi.listPermisos(usuarioSeleccionadoId.value)
      // Copia nueva para que la vista se actualice aunque el backend reutilice el array.
      permisosDelUsuario.value = [...(resultado.data ?? [])]
    } catch (error) {
      mensaje.value = { type: 'error', message: getErrorMessage(error) }
    }
  }

  async function cargarPagina() {
    cargando.value = true
    try {
      const [listaUsuarios, listaPermisos, listaRoles] = await Promise.all([
        usuariosApi.list({ page: 1, limit: 100 }),
        permisosApi.list({ q: '', page: 1, limit: 100 }),
        rolesApi.list({ page: 1, limit: 100 }),
      ])
      usuarios.value = listaUsuarios.data ?? []
      permisosBackend.value = listaPermisos.data ?? []
      roles.value = listaRoles.data ?? []
      // Arranca sin nadie elegido: los permisos aparecen después de consultar un usuario.
    } catch (error) {
      mensaje.value = { type: 'error', message: getErrorMessage(error) }
    } finally {
      cargando.value = false
    }
  }

  async function seleccionarUsuario(usuario) {
    if (guardando.value) return
    usuarioSeleccionadoId.value = usuario.id
    cambiosPendientes.value = new Map()
    mensaje.value = null
    await cargarPermisosDelUsuario()
  }

  function cambiarUsuario() {
    if (guardando.value) return
    usuarioSeleccionadoId.value = null
    permisosDelUsuario.value = []
    cambiosPendientes.value = new Map()
    busqueda.value = ''
    mensaje.value = null
  }

  /** Solo se puede cambiar lo que el backend ya publicó en su catálogo. */
  const opcionesCambiables = computed(() =>
    modulosConPermisos.value
      .flatMap((modulo) => modulo.opciones)
      .filter((opcion) => opcion.idBackend != null),
  )

  const todosMarcados = computed(
    () =>
      opcionesCambiables.value.length > 0 &&
      opcionesCambiables.value.every((opcion) => estadoCheck(opcion)),
  )

  function prepararCambio(pendientes, opcion, deseado) {
    if (deseado === opcion.asignado) {
      pendientes.delete(opcion.clave)
    } else {
      pendientes.set(opcion.clave, {
        clave: opcion.clave,
        nombre: opcion.nombre,
        etiqueta: opcion.etiqueta,
        idBackend: opcion.idBackend,
        asignado: deseado,
      })
    }
  }

  /** El check solo prepara el cambio; se aplica con Confirmar. */
  function togglePermiso(opcion) {
    if (!usuarioSeleccionado.value || guardando.value || !opcion.idBackend) return
    mensaje.value = null
    const pendientes = new Map(cambiosPendientes.value)
    prepararCambio(pendientes, opcion, !estadoCheck(opcion))
    cambiosPendientes.value = pendientes
  }

  /** Las acciones masivas usan la misma regla: preparar y confirmar después. */
  function aplicarMasivo(deseadoPorOpcion) {
    if (!usuarioSeleccionado.value || guardando.value) return
    mensaje.value = null
    const pendientes = new Map(cambiosPendientes.value)
    for (const opcion of opcionesCambiables.value) {
      prepararCambio(pendientes, opcion, deseadoPorOpcion(opcion))
    }
    cambiosPendientes.value = pendientes
  }

  function marcarTodos() {
    aplicarMasivo(() => true)
  }

  function desmarcarTodos() {
    aplicarMasivo(() => false)
  }

  function aplicarRol() {
    const delRol = new Set(plantillaSeleccionada.value)
    aplicarMasivo((opcion) => delRol.has(opcion.clave))
  }

  function toggleTodos() {
    if (todosMarcados.value) desmarcarTodos()
    else marcarTodos()
  }

  function descartarCambios() {
    cambiosPendientes.value = new Map()
    mensaje.value = null
  }

  /** Aplica todos los cambios preparados con los endpoints reales (POST/DELETE). */
  async function confirmarCambios() {
    if (!tieneCambios.value || guardando.value || !usuarioSeleccionado.value) return
    guardando.value = true
    mensaje.value = null
    const usuario = usuarioSeleccionado.value
    const cambios = [...cambiosPendientes.value.values()]
    let aplicados = 0
    let fallidos = 0

    for (const cambio of cambios) {
      try {
        if (cambio.asignado) {
          await usuariosApi.addPermiso(usuario.id, cambio.idBackend)
        } else {
          await usuariosApi.removePermiso(usuario.id, cambio.idBackend)
        }
        aplicados += 1
      } catch {
        fallidos += 1
      }
    }

    // Leemos el estado real y descartamos lo preparado: lo que falló sigue sin aplicar.
    await cargarPermisosDelUsuario()
    cambiosPendientes.value = new Map()
    guardando.value = false
    mensaje.value = fallidos
      ? {
          type: 'error',
          message: `Se aplicaron ${aplicados} cambios y fallaron ${fallidos}. Revisá los permisos del usuario.`,
        }
      : {
          type: 'success',
          message: `${aplicados} ${aplicados === 1 ? 'cambio guardado' : 'cambios guardados'} en "${usuario.nombre}".`,
        }
  }

  onMounted(cargarPagina)

  return {
    usuarios,
    roles,
    permisosBackend,
    busqueda,
    usuarioSeleccionadoId,
    permisosDelUsuario,
    cambiosPendientes,
    cargando,
    guardando,
    mensaje,
    usuarioSeleccionado,
    rolDelUsuario,
    plantillaSeleccionada,
    coincidencias,
    resultados,
    modulosConPermisos,
    permisosVisibles,
    tieneCambios,
    resumenPermisos,
    faltanEnBackend,
    opcionesCambiables,
    todosMarcados,
    seleccionarUsuario,
    cambiarUsuario,
    togglePermiso,
    aplicarRol,
    desmarcarTodos,
    toggleTodos,
    descartarCambios,
    confirmarCambios,
  }
}
