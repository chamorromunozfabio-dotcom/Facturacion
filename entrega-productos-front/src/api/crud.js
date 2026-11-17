import api from './axios'
import { mockList, mockGet, mockCreate, mockUpdate, mockRemove } from './mocks'

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

/**
 * Fábrica de funciones CRUD para un recurso.
 * Devuelve siempre los datos ya parseados (response.data),
 * con la forma acordada: { data, total, page, limit } en listados.
 */
export function createCrudResource(resource) {
  return {
    list(params = {}) {
      if (USE_MOCKS) return mockList(resource, params)
      return api.get(`/${resource}`, { params }).then((response) => response.data)
    },
    get(id) {
      if (USE_MOCKS) return mockGet(resource, id)
      return api.get(`/${resource}/${id}`).then((response) => response.data)
    },
    create(payload) {
      if (USE_MOCKS) return mockCreate(resource, payload)
      return api.post(`/${resource}`, payload).then((response) => response.data)
    },
    update(id, payload) {
      if (USE_MOCKS) return mockUpdate(resource, id, payload)
      return api.put(`/${resource}/${id}`, payload).then((response) => response.data)
    },
    remove(id) {
      if (USE_MOCKS) return mockRemove(resource, id)
      return api.delete(`/${resource}/${id}`).then((response) => response.data)
    },
  }
}
