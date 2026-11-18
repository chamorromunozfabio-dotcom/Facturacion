import api from './axios'
import { createCrudResource } from './crud'
import { mockSetPermisos } from './mocks'
import { resolveApiModes } from '../config/apiModes'

const { catalogsMocks } = resolveApiModes()
const crud = createCrudResource('roles')

/**
 * El backend guarda los permisos en el ROL, no en cada usuario.
 * PUT /roles/{id}/permisos con { permisos_ids } reemplaza todos los actuales:
 * lo que no esté en la lista se quita. Devuelve el rol actualizado.
 */
function setPermisos(rolId, permisosIds) {
  if (catalogsMocks) return mockSetPermisos(rolId, permisosIds)
  return api
    .put(`/roles/${rolId}/permisos`, { permisos_ids: permisosIds })
    .then((response) => response.data)
}

export default { ...crud, setPermisos }
