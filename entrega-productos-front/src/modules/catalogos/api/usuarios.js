import api from '../../../shared/api/axios'
import { createCrudResource } from './crud'
import {
  mockListPermisos,
  mockSetPermisosUsuario,
  mockAddPermiso,
  mockRemovePermiso,
} from '../../../shared/api/mocks'
import { resolveApiModes } from '../../../shared/config/apiModes'

const { catalogsMocks } = resolveApiModes()
const crud = createCrudResource('usuarios')

/** Los permisos son del usuario; el rol solo es la plantilla al crearlo. */
function listPermisos(usuarioId) {
  if (catalogsMocks) return mockListPermisos(usuarioId)
  return api.get(`/usuarios/${usuarioId}/permisos`).then((response) => response.data)
}

/** Reemplaza todos los permisos. `[]` quita todos. */
function setPermisos(usuarioId, permisosIds) {
  if (catalogsMocks) return mockSetPermisosUsuario(usuarioId, permisosIds)
  return api
    .put(`/usuarios/${usuarioId}/permisos`, { permisos_ids: permisosIds })
    .then((response) => response.data)
}

function addPermiso(usuarioId, permisoId) {
  if (catalogsMocks) return mockAddPermiso(usuarioId, permisoId)
  return api.post(`/usuarios/${usuarioId}/permisos/${permisoId}`).then((response) => response.data)
}

function removePermiso(usuarioId, permisoId) {
  if (catalogsMocks) return mockRemovePermiso(usuarioId, permisoId)
  return api.delete(`/usuarios/${usuarioId}/permisos/${permisoId}`).then((response) => response.data)
}

export default { ...crud, listPermisos, setPermisos, addPermiso, removePermiso }
