/** Reglas puras compartidas por los listados CRUD. No usan Vue ni la API. */
import { getErrorMessage, isDuplicateError } from '../api/axios'

/** Compara el payload con la fila editada y devuelve solo lo que cambió. */
export function changedFields(payload, actual, normalizar = (_key, valor) => valor) {
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) => normalizar(key, value) !== normalizar(key, actual?.[key]),
    ),
  )
}

/** Quita campos vacíos, útil cuando el backend los considera opcionales. */
export function quitarVacios(payload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== '' && value !== null),
  )
}

/** Arma los parámetros del listado sin repetir la paginación en cada vista. */
export function paramsLista({ q, page, limit, extra = {} }) {
  return { q, page, limit, ...extra }
}

/** Prioriza el mensaje de duplicado del módulo y cae al error del backend. */
export function errorMessage(error, fallback, duplicateMessage) {
  if (duplicateMessage && isDuplicateError(error)) return duplicateMessage
  return getErrorMessage(error) || fallback
}
