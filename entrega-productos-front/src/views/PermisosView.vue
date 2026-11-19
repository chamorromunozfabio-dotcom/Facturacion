<script setup>
import { computed, onMounted, ref } from 'vue'
import AlertMessage from '../components/AlertMessage.vue'
import permisosApi from '../api/permisos'
import rolesApi from '../api/roles'
import usuariosApi from '../api/usuarios'
import { getErrorMessage } from '../api/axios'
import { useAuthStore } from '../stores/auth'
import {
  CATALOGO_PERMISOS,
  MODULOS_PERMISO,
  claveDelNombreBackend,
  plantillaDelRol,
} from '../config/permissions'

const auth = useAuthStore()

const usuarios = ref([])
const roles = ref([])
const permisosBackend = ref([])
const usuarioSeleccionadoId = ref(null)
const permisosDelUsuario = ref([])
const claveSeleccionada = ref('')
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

const catalogoPorModulo = computed(() =>
  MODULOS_PERMISO.map((modulo) => ({
    ...modulo,
    opciones: CATALOGO_PERMISOS.filter((item) => item.modulo === modulo.clave).map((item) => ({
      ...item,
      idBackend: idPorClave.value[item.clave] ?? null,
      asignado: tieneClave(item.clave),
    })),
  })),
)

const faltanEnBackend = computed(
  () => CATALOGO_PERMISOS.filter((item) => idPorClave.value[item.clave] === undefined).length,
)

const seleccionado = computed(
  () => CATALOGO_PERMISOS.find((item) => item.clave === claveSeleccionada.value) ?? null,
)
const seleccionadoAsignado = computed(() =>
  seleccionado.value ? tieneClave(seleccionado.value.clave) : false,
)
const textoBoton = computed(() =>
  seleccionadoAsignado.value ? 'Quitar permiso' : 'Dar permiso',
)
const puedeAccionar = computed(
  () =>
    Boolean(usuarioSeleccionado.value) &&
    Boolean(seleccionado.value) &&
    idPorClave.value[seleccionado.value?.clave] !== undefined &&
    !guardando.value,
)

async function cargarPermisosDelUsuario() {
  if (!usuarioSeleccionadoId.value) {
    permisosDelUsuario.value = []
    return
  }
  try {
    const resultado = await usuariosApi.listPermisos(usuarioSeleccionadoId.value)
    // Copia nueva para que la tabla se actualice aunque el backend reutilice el array.
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

    // Dejamos arriba al admin en turno para que vea sus propios permisos.
    const preferido =
      usuarios.value.find((usuario) => usuario.id === auth.user?.id) ?? usuarios.value[0]
    if (preferido) {
      usuarioSeleccionadoId.value = preferido.id
      await cargarPermisosDelUsuario()
    }
  } catch (error) {
    mensaje.value = { type: 'error', message: getErrorMessage(error) }
  } finally {
    cargando.value = false
  }
}

function seleccionarUsuario(valor) {
  usuarioSeleccionadoId.value = valor === '' ? null : Number(valor)
  claveSeleccionada.value = ''
  cargarPermisosDelUsuario()
}

async function refrescarPermisos() {
  await cargarPermisosDelUsuario()
}

async function accionar() {
  if (!puedeAccionar.value) return
  guardando.value = true
  mensaje.value = null
  const item = seleccionado.value
  const permisoId = idPorClave.value[item.clave]
  const usuario = usuarioSeleccionado.value
  try {
    if (seleccionadoAsignado.value) {
      await usuariosApi.removePermiso(usuario.id, permisoId)
      mensaje.value = {
        type: 'success',
        message: `Permiso "${item.etiqueta}" quitado a "${usuario.nombre}".`,
      }
    } else {
      await usuariosApi.addPermiso(usuario.id, permisoId)
      mensaje.value = {
        type: 'success',
        message: `Permiso "${item.etiqueta}" dado a "${usuario.nombre}".`,
      }
    }
    await refrescarPermisos()
  } catch (error) {
    mensaje.value = {
      type: 'error',
      message: getErrorMessage(error) || 'No se pudo cambiar el permiso.',
    }
  } finally {
    guardando.value = false
  }
}

async function quitarPermiso(permiso) {
  if (!usuarioSeleccionado.value || guardando.value) return
  guardando.value = true
  mensaje.value = null
  try {
    const permisoId = permiso.id ?? idPorClave.value[permiso.clave]
    await usuariosApi.removePermiso(usuarioSeleccionado.value.id, permisoId)
    mensaje.value = {
      type: 'success',
      message: `Permiso "${permiso.etiqueta}" quitado a "${usuarioSeleccionado.value.nombre}".`,
    }
    await refrescarPermisos()
  } catch (error) {
    mensaje.value = {
      type: 'error',
      message: getErrorMessage(error) || 'No se pudo quitar el permiso.',
    }
  } finally {
    guardando.value = false
  }
}

onMounted(cargarPagina)
</script>

<template>
  <section class="crud-page">
    <header class="crud-page__header">
      <div>
        <h1>Permisos</h1>
        <p>
          Da o quita funciones a <strong>cada usuario</strong> desde una lista fija. No se pueden
          crear ni nombrar permisos nuevos.
        </p>
      </div>
      <span class="badge">Solo administrador</span>
    </header>

    <Transition name="alert">
      <AlertMessage
        v-if="mensaje"
        :type="mensaje.type"
        :message="mensaje.message"
        @close="mensaje = null"
      />
    </Transition>

    <section class="assignment">
      <header class="assignment__header">
        <div>
          <h2>Permisos por usuario</h2>
          <p class="assignment__hint">
            El permiso queda guardado en la persona que elijas. Si se lo das a un cliente, no se lo
            das a los demás clientes. El rol solo sirve como referencia.
          </p>
        </div>
      </header>

      <div class="assignment__selectors">
        <label>
          <span>Usuario</span>
          <select
            data-test="assignment-user"
            :value="usuarioSeleccionadoId ?? ''"
            @change="seleccionarUsuario($event.target.value)"
          >
            <option value="">Elige un usuario</option>
            <option v-for="usuario in usuarios" :key="usuario.id" :value="usuario.id">
              {{ usuario.nombre }} — {{ usuario.rol }}
            </option>
          </select>
        </label>
      </div>

      <p v-if="cargando" class="assignment__loading">Cargando usuarios y permisos...</p>

      <template v-else-if="usuarioSeleccionado">
        <p class="assignment__affected" data-test="assignment-affected">
          Editando los permisos de <strong>{{ usuarioSeleccionado.nombre }}</strong>
          <template v-if="rolDelUsuario"> (rol {{ rolDelUsuario.nombre }})</template>.
        </p>
        <p class="assignment__reference" data-test="plantilla-rol">
          Referencia del rol: {{ plantillaSeleccionada.length }} permisos predefinidos. No se aplican
          automáticamente.
        </p>

        <div class="assignment__actions">
          <label>
            <span>Funcionalidad</span>
            <select data-test="permiso-select" v-model="claveSeleccionada">
              <option value="">Elige una función</option>
              <optgroup
                v-for="modulo in catalogoPorModulo"
                :key="modulo.clave"
                :label="modulo.etiqueta"
              >
                <option
                  v-for="opcion in modulo.opciones"
                  :key="opcion.clave"
                  :value="opcion.clave"
                  :disabled="!opcion.idBackend"
                  :data-test="`opcion-${opcion.clave}`"
                >
                  {{ opcion.accionEtiqueta }}{{ opcion.asignado ? ' (ya lo tiene)' : '' }}{{
                    opcion.idBackend ? '' : ' — pendiente en el backend'
                  }}
                </option>
              </optgroup>
            </select>
          </label>

          <button
            data-test="toggle-permiso"
            type="button"
            class="btn btn--primary"
            :disabled="!puedeAccionar"
            @click="accionar"
          >
            {{ guardando ? 'Guardando...' : textoBoton }}
          </button>
        </div>

        <p v-if="faltanEnBackend" class="assignment__warning" data-test="permisos-pendientes">
          Faltan {{ faltanEnBackend }} funciones en el catálogo del backend. Están deshabilitadas
          hasta que el backend las publique.
        </p>

        <div class="assignment__current">
          <h3>Permisos que ya tiene {{ usuarioSeleccionado.nombre }}</h3>
          <ul class="assignment__assigned" data-test="permisos-actuales">
            <li
              v-for="permiso in permisosAsignados"
              :key="permiso.id ?? permiso.nombre"
              :data-test="`asignado-${permiso.clave ?? permiso.nombre}`"
            >
              <span>{{ permiso.etiqueta }}</span>
              <button
                type="button"
                class="btn btn--danger"
                :data-test="`quitar-${permiso.clave ?? permiso.nombre}`"
                :disabled="guardando"
                @click="quitarPermiso(permiso)"
              >
                Quitar
              </button>
            </li>
            <li v-if="permisosAsignados.length === 0" class="assignment__empty">
              Este usuario todavía no tiene permisos asignados.
            </li>
          </ul>
        </div>
      </template>

      <p v-else class="assignment__empty">No hay usuarios cargados.</p>
    </section>
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

h2 {
  margin: 0;
  font-size: 1.1rem;
}

h3 {
  margin: 0;
  font-size: 0.95rem;
  color: #374151;
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

.assignment {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 1px 3px rgb(0 0 0 / 6%);
}

.assignment__header,
.assignment__selectors,
.assignment__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.assignment__hint {
  max-width: 760px;
  font-size: 0.9rem;
  line-height: 1.5;
}

.assignment__selectors label,
.assignment__actions label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: #374151;
}

.assignment__selectors select,
.assignment__actions select {
  min-width: 280px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fff;
}

.assignment__affected,
.assignment__reference {
  font-size: 0.9rem;
}

.assignment__reference {
  font-size: 0.82rem;
}

.assignment__warning {
  font-size: 0.85rem;
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 8px 10px;
}

.assignment__current {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.assignment__assigned {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.assignment__assigned li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 0.9rem;
}

.assignment__empty,
.assignment__loading {
  font-size: 0.85rem;
  color: #6b7280;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #374151;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}

.btn--danger {
  color: #b91c1c;
  border-color: #fecaca;
}

@media (max-width: 640px) {
  .assignment__selectors select,
  .assignment__actions select {
    min-width: 0;
    width: 100%;
  }
}
</style>
