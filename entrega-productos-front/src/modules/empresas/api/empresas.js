import api from '../../../shared/api/axios'
import { mockCambiarEstadoEmpresa } from '../../../shared/api/mocks'
import { resolveApiModes } from '../../../shared/config/apiModes'
import { createCrudResource } from '../../catalogos/api/crud'

const { catalogsMocks } = resolveApiModes()
const crud = createCrudResource('empresas')

/**
 * Empresas: listado y aprobación. El alta la hace el registro público.
 * `PATCH /empresas/{id}/estado` cambia entre pendiente, activa, rechazada y
 * suspendida; el rechazo viaja con `motivo_rechazo`.
 */
export const empresasApi = {
  ...crud,

  listActivas(params = {}) {
    return crud.list({ estado: 'activa', page: 1, limit: 100, ...params })
  },

  cambiarEstado(id, payload) {
    if (catalogsMocks) return mockCambiarEstadoEmpresa(id, payload)
    return api.patch(`/empresas/${id}/estado`, payload).then((response) => response.data)
  },
}

export default empresasApi
