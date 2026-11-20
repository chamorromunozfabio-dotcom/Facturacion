import api from './axios'
import { mockResumenEstadisticas } from './mocks'
import { resolveApiModes } from '../config/apiModes'

const { catalogsMocks } = resolveApiModes()

/**
 * Resumen del panel de estadísticas.
 * Un solo endpoint: el backend decide qué secciones devolver según el token.
 * En modo demo (y en tests) respondemos con datos falsos por rol.
 */
export function getResumen(params = {}) {
  if (catalogsMocks) return mockResumenEstadisticas(params)
  return api.get('/estadisticas/resumen', { params }).then((response) => response.data)
}

export default { getResumen }
