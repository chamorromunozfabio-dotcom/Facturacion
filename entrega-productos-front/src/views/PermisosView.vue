<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  Check,
  ChevronLeft,
  KeyRound,
  ReceiptText,
  Search,
  ShieldCheck,
  Tags,
  Users,
  Warehouse,
  X,
} from '@lucide/vue'
import AlertMessage from '../components/AlertMessage.vue'
import permisosApi from '../api/permisos'
import rolesApi from '../api/roles'
import usuariosApi from '../api/usuarios'
import { getErrorMessage } from '../api/axios'
import {
  CATALOGO_PERMISOS,
  MODULOS_PERMISO,
  claveDelNombreBackend,
  plantillaDelRol,
} from '../config/permissions'

const ICONOS_MODULO = {
  facturas: ReceiptText,
  bodegas: Warehouse,
  usuarios: Users,
  tipos: Tags,
  roles: ShieldCheck,
  permisos: KeyRound,
}

const usuarios = ref([])
const roles = ref([])
const permisosBackend = ref([])
const busqueda = ref('')
const usuarioSeleccionadoId = ref(null)
const permisosDelUsuario = ref([])
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

function normalizar(texto) {
  return String(texto ?? '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

const coincidencias = computed(() => {
  const texto = normalizar(busqueda.value).trim()
  if (!texto || !usuarios.value.length) return []
  return usuarios.value.filter((usuario) =>
    [usuario.nombre, usuario.correo, usuario.rol].some((valor) =>
      normalizar(valor).includes(texto),
    ),
  )
})
const resultados = computed(() => coincidencias.value.slice(0, 8))

function iniciales(nombre) {
  return normalizar(nombre)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

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

/** Tarjetas por módulo: cada función es un check contra el permiso guardado. */
const modulosConPermisos = computed(() =>
  MODULOS_PERMISO.map((modulo) => ({
    ...modulo,
    icono: ICONOS_MODULO[modulo.clave],
    opciones: CATALOGO_PERMISOS.filter((item) => item.modulo === modulo.clave).map((item) => ({
      ...item,
      idBackend: idPorClave.value[item.clave] ?? null,
      asignado: tieneClave(item.clave),
    })),
  })),
)

const resumenPermisos = computed(() =>
  permisosAsignados.value.length
    ? permisosAsignados.value.map((permiso) => permiso.etiqueta).join(' · ')
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
  mensaje.value = null
  await cargarPermisosDelUsuario()
}

function cambiarUsuario() {
  if (guardando.value) return
  usuarioSeleccionadoId.value = null
  permisosDelUsuario.value = []
  busqueda.value = ''
  mensaje.value = null
}

/** Un check hace el POST o el DELETE según el estado guardado. */
async function togglePermiso(opcion) {
  if (!usuarioSeleccionado.value || guardando.value || !opcion.idBackend) return
  guardando.value = true
  mensaje.value = null
  const usuario = usuarioSeleccionado.value
  const verbo = opcion.asignado ? 'quitado' : 'dado'
  try {
    if (opcion.asignado) {
      await usuariosApi.removePermiso(usuario.id, opcion.idBackend)
    } else {
      await usuariosApi.addPermiso(usuario.id, opcion.idBackend)
    }
    mensaje.value = {
      type: 'success',
      message: `Permiso "${opcion.etiqueta}" ${verbo} a "${usuario.nombre}".`,
    }
  } catch (error) {
    mensaje.value = {
      type: 'error',
      message: getErrorMessage(error) || 'No se pudo cambiar el permiso.',
    }
  } finally {
    // Volvemos a leer la base para que el check muestre el estado real.
    await cargarPermisosDelUsuario()
    guardando.value = false
  }
}

onMounted(cargarPagina)
</script>

<template>
  <section class="permisos-page">
    <header class="hero">
      <span class="hero__icon"><ShieldCheck :size="26" aria-hidden="true" /></span>
      <div class="hero__text">
        <h1>Permisos por usuario</h1>
        <p>
          Buscá a una persona, revisá sus funciones y tildá lo que puede hacer. Los cambios se
          guardan al instante.
        </p>
      </div>
      <span class="hero__badge">Solo administrador</span>
    </header>

    <Transition name="alert">
      <AlertMessage
        v-if="mensaje"
        :type="mensaje.type"
        :message="mensaje.message"
        @close="mensaje = null"
      />
    </Transition>

    <section class="card card--buscar">
      <div class="paso">
        <span class="paso__numero">1</span>
        <div>
          <h2>¿A quién querés revisar?</h2>
          <p>Escribí el nombre, el correo o el rol. No mostramos la lista completa.</p>
        </div>
      </div>

      <div class="buscador">
        <Search class="buscador__icono" :size="18" aria-hidden="true" />
        <input
          v-model="busqueda"
          data-test="user-search"
          type="search"
          placeholder="Ej: Juan, cliente@gmail.com, bodeguero..."
          aria-label="Buscar usuario"
        />
        <button
          v-if="busqueda"
          type="button"
          class="buscador__limpiar"
          aria-label="Limpiar búsqueda"
          @click="busqueda = ''"
        >
          <X :size="16" aria-hidden="true" />
        </button>
      </div>

      <p v-if="cargando" class="estado">Cargando usuarios y catálogos...</p>

      <template v-else-if="coincidencias.length">
        <div class="resultados" data-test="assignment-user">
          <button
            v-for="usuario in resultados"
            :key="usuario.id"
            type="button"
            class="usuario"
            :class="{ 'usuario--activo': usuario.id === usuarioSeleccionadoId }"
            :aria-pressed="usuario.id === usuarioSeleccionadoId"
            :data-test="`usuario-${usuario.id}`"
            @click="seleccionarUsuario(usuario)"
          >
            <span class="avatar">{{ iniciales(usuario.nombre) }}</span>
            <span class="usuario__datos">
              <strong>{{ usuario.nombre }}</strong>
              <small>{{ usuario.correo }}</small>
            </span>
            <span class="rol">{{ usuario.rol }}</span>
          </button>
        </div>
        <p v-if="coincidencias.length > resultados.length" class="estado">
          Mostrando {{ resultados.length }} de {{ coincidencias.length }} coincidencias. Seguí
          escribiendo para afinar.
        </p>
      </template>

      <div v-else-if="busqueda.trim()" class="estado estado--vacio" data-test="sin-resultados">
        <Search :size="20" aria-hidden="true" />
        <span>No encontramos usuarios para “{{ busqueda.trim() }}”.</span>
      </div>
      <div v-else class="estado estado--vacio">
        <Users :size="20" aria-hidden="true" />
        <span>Empezá a escribir para ver los usuarios disponibles.</span>
      </div>
    </section>

    <Transition name="panel">
      <section v-if="usuarioSeleccionado" class="card card--detalle" data-test="permisos-panel">
        <header class="detalle__head">
          <span class="avatar avatar--grande">{{ iniciales(usuarioSeleccionado.nombre) }}</span>
          <div class="detalle__titulo">
            <h2 data-test="assignment-affected">
              Permisos de <strong>{{ usuarioSeleccionado.nombre }}</strong>
              <template v-if="rolDelUsuario">({{ rolDelUsuario.nombre }})</template>
            </h2>
            <p>{{ usuarioSeleccionado.correo }}</p>
          </div>
          <button type="button" class="btn btn--suave" @click="cambiarUsuario">
            <ChevronLeft :size="16" aria-hidden="true" />
            Cambiar usuario
          </button>
        </header>

        <div class="metricas">
          <div class="metrica">
            <strong>{{ permisosAsignados.length }}</strong>
            <span>permisos activos</span>
          </div>
          <div class="metrica">
            <strong>{{ CATALOGO_PERMISOS.length }}</strong>
            <span>funciones posibles</span>
          </div>
          <div class="metrica metrica--clara">
            <strong>{{ plantillaSeleccionada.length }}</strong>
            <span>en su rol</span>
          </div>
        </div>

        <p class="nota" data-test="plantilla-rol">
          Referencia del rol: {{ plantillaSeleccionada.length }} permisos predefinidos. No se aplican
          automáticamente.
        </p>

        <p v-if="faltanEnBackend" class="aviso" data-test="permisos-pendientes">
          <KeyRound :size="15" aria-hidden="true" />
          Faltan {{ faltanEnBackend }} funciones en el catálogo del backend. Quedan marcadas como
          pendientes.
        </p>

        <div class="paso paso--segundo">
          <span class="paso__numero">2</span>
          <div>
            <h3>Funciones permitidas</h3>
            <p>Tildá lo que {{ usuarioSeleccionado.nombre }} puede hacer en cada área.</p>
          </div>
        </div>

        <div class="modulos" data-test="matriz-permisos">
          <article
            v-for="modulo in modulosConPermisos"
            :key="modulo.clave"
            class="modulo"
            :data-test="`modulo-${modulo.clave}`"
          >
            <header class="modulo__head" :data-test="`columna-${modulo.clave}`">
              <span class="modulo__icono"><component :is="modulo.icono" :size="17" /></span>
              <h4>{{ modulo.etiqueta }}</h4>
              <span class="modulo__conteo">
                {{ modulo.opciones.filter((opcion) => opcion.asignado).length }}/{{
                  modulo.opciones.length
                }}
              </span>
            </header>
            <ul class="modulo__lista">
              <li
                v-for="opcion in modulo.opciones"
                :key="opcion.clave"
                class="funcion"
                :class="{ 'funcion--activa': opcion.asignado, 'funcion--pendiente': !opcion.idBackend }"
              >
                <label class="check" :title="opcion.etiqueta">
                  <input
                    type="checkbox"
                    :checked="opcion.asignado"
                    :disabled="guardando || opcion.idBackend == null"
                    :data-test="`check-${opcion.clave}`"
                    :aria-label="`${opcion.etiqueta}${opcion.asignado ? ' (ya lo tiene)' : ''}`"
                    @change="togglePermiso(opcion)"
                  />
                  <span class="check__caja"><Check :size="12" aria-hidden="true" /></span>
                  <span class="check__texto">{{ opcion.accionEtiqueta }}</span>
                </label>
                <span v-if="!opcion.idBackend" class="pendiente">
                  <KeyRound :size="11" aria-hidden="true" />
                  pendiente
                </span>
              </li>
            </ul>
          </article>
        </div>

        <footer class="detalle__pie" data-test="permisos-actuales">
          <span>
            <strong>{{ permisosAsignados.length }} de {{ CATALOGO_PERMISOS.length }} permisos
              activos:</strong>
            {{ resumenPermisos }}
          </span>
          <small>Los cambios se guardan al instante.</small>
        </footer>
      </section>
    </Transition>
  </section>
</template>

<style scoped>
.permisos-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.hero {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  padding: 22px 24px;
  border: 1px solid #ddd6fe;
  border-radius: 16px;
  background: linear-gradient(120deg, #eef2ff 0%, #f5f3ff 55%, #faf5ff 100%);
}

.hero__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #4f46e5;
  color: #fff;
  box-shadow: 0 6px 16px rgb(79 70 229 / 25%);
}

.hero__text {
  flex: 1 1 320px;
}

h1 {
  margin: 0;
  font-size: 1.6rem;
  color: #312e81;
  letter-spacing: -0.02em;
}

.hero p,
.card p,
.estado,
.nota {
  margin: 4px 0 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.hero__badge {
  background: #fff;
  border: 1px solid #ddd6fe;
  color: #5b21b6;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 2px 10px rgb(15 23 42 / 4%);
}

.card--detalle {
  border-color: #c7d2fe;
  box-shadow: 0 8px 26px rgb(79 70 229 / 8%);
}

.paso {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.paso--segundo {
  margin: 22px 0 14px;
}

.paso__numero {
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #eef2ff;
  color: #4338ca;
  font-weight: 700;
  font-size: 0.9rem;
}

h2 {
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
}

h3 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

h4 {
  margin: 0;
  font-size: 0.9rem;
  color: #374151;
}

.buscador {
  position: relative;
  display: flex;
  align-items: center;
}

.buscador__icono {
  position: absolute;
  left: 14px;
  color: #818cf8;
  pointer-events: none;
}

.buscador input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d8dbe3;
  border-radius: 12px;
  padding: 13px 44px 13px 42px;
  font-size: 0.95rem;
  color: #1f2937;
  background: #fbfbfd;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
}

.buscador input:focus {
  background: #fff;
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgb(99 102 241 / 12%);
}

.buscador input::placeholder {
  color: #9ca3af;
}

.buscador__limpiar {
  position: absolute;
  right: 10px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 0;
  border-radius: 50%;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
}

.buscador__limpiar:hover {
  background: #e5e7eb;
}

.resultados {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 10px;
  margin-top: 16px;
}

.usuario {
  display: flex;
  align-items: center;
  gap: 10px;
  text-align: left;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  padding: 10px 12px;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease, background 0.15s ease,
    box-shadow 0.15s ease;
}

.usuario:hover {
  transform: translateY(-2px);
  border-color: #a5b4fc;
  box-shadow: 0 6px 14px rgb(15 23 42 / 6%);
}

.usuario--activo {
  background: #eef2ff;
  border-color: #6366f1;
}

.avatar {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e0e7ff;
  color: #4338ca;
  font-weight: 700;
  font-size: 0.85rem;
}

.avatar--grande {
  flex-basis: 52px;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
}

.usuario__datos {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.usuario__datos strong {
  font-size: 0.9rem;
  color: #1f2937;
}

.usuario__datos small {
  font-size: 0.76rem;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rol {
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  padding: 3px 9px;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
}

.usuario--activo .rol {
  background: #c7d2fe;
  color: #3730a3;
}

.estado--vacio {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 16px;
  padding: 22px;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
  color: #9ca3af;
  background: #fcfcfd;
}

.detalle__head {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  padding-bottom: 18px;
  border-bottom: 1px solid #eef2ff;
}

.detalle__titulo {
  flex: 1 1 240px;
}

.detalle__titulo p {
  color: #9ca3af;
  font-size: 0.85rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 10px;
  padding: 9px 13px;
  font-size: 0.85rem;
  cursor: pointer;
}

.btn--suave {
  border: 1px solid #c7d2fe;
  background: #fff;
  color: #4338ca;
  font-weight: 600;
}

.btn--suave:hover {
  background: #eef2ff;
}

.metricas {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.metrica {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px 16px;
  border-radius: 12px;
  background: #eef2ff;
  color: #3730a3;
}

.metrica strong {
  font-size: 1.4rem;
  line-height: 1;
}

.metrica span {
  font-size: 0.78rem;
  color: #6366f1;
}

.metrica--clara {
  background: #f5f3ff;
  color: #6d28d9;
}

.metrica--clara span {
  color: #8b5cf6;
}

.nota {
  margin-top: 12px;
  font-size: 0.82rem;
}

.aviso {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid #fde68a;
  border-radius: 10px;
  background: #fffbeb;
  color: #92400e;
  font-size: 0.84rem;
}

.modulos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(265px, 1fr));
  gap: 12px;
}

.modulo {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.modulo:hover {
  border-color: #c7d2fe;
  box-shadow: 0 4px 14px rgb(15 23 42 / 5%);
}

.modulo__head {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 12px 13px;
  background: #f9fafb;
  border-bottom: 1px solid #eef0f4;
}

.modulo__icono {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: #eef2ff;
  color: #4f46e5;
}

.modulo__head h4 {
  flex: 1;
}

.modulo__conteo {
  font-size: 0.75rem;
  font-weight: 700;
  color: #6366f1;
  background: #eef2ff;
  border-radius: 999px;
  padding: 3px 8px;
}

.modulo__lista {
  list-style: none;
  margin: 0;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.funcion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-radius: 9px;
  padding: 2px 6px;
  transition: background 0.15s ease;
}

.funcion:hover {
  background: #f9fafb;
}

.funcion--activa {
  background: #f5f6ff;
}

.check {
  position: relative;
  display: flex;
  align-items: center;
  gap: 9px;
  flex: 1;
  padding: 7px 4px;
  cursor: pointer;
  color: #6b7280;
  font-size: 0.86rem;
}

.check input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.check__caja {
  display: grid;
  place-items: center;
  flex: 0 0 19px;
  width: 19px;
  height: 19px;
  border: 1.5px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: transparent;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.check input:focus-visible + .check__caja {
  outline: 3px solid rgb(99 102 241 / 30%);
  outline-offset: 2px;
}

.check input:checked + .check__caja {
  background: #4f46e5;
  border-color: #4f46e5;
  color: #fff;
}

.check input:disabled + .check__caja {
  opacity: 0.45;
}

.funcion--activa .check__texto {
  color: #3730a3;
  font-weight: 600;
}

.funcion--pendiente {
  opacity: 0.6;
}

.pendiente {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.7rem;
  color: #92400e;
  white-space: nowrap;
}

.detalle__pie {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 20px;
  padding: 13px 15px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  font-size: 0.84rem;
  line-height: 1.5;
}

.detalle__pie small {
  color: #10b981;
  font-weight: 600;
  white-space: nowrap;
}

.panel-enter-active,
.panel-leave-active,
.alert-enter-active,
.alert-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.panel-enter-from,
.panel-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.alert-enter-from,
.alert-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 640px) {
  .hero,
  .card {
    padding: 16px;
  }

  .detalle__head {
    align-items: flex-start;
  }

  .detalle__pie small {
    white-space: normal;
  }
}

@media (prefers-reduced-motion: reduce) {
  .panel-enter-active,
  .panel-leave-active,
  .alert-enter-active,
  .alert-leave-active,
  .usuario,
  .modulo,
  .check__caja {
    transition: none;
  }
}
</style>
