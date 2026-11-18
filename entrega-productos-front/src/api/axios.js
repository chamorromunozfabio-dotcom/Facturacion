import axios from 'axios'

const TOKEN_KEY = 'token'

/**
 * Cliente HTTP único para todo el frontend.
 * - baseURL viene de .env (VITE_API_URL)
 * - el interceptor agrega el token JWT a cada petición
 * - si el backend responde 401, cerramos sesión y vamos al login
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('user')

      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

/**
 * FastAPI normalmente manda detail como string, pero los 422 vienen como lista.
 * Unificamos ambos casos para que la UI siempre muestre un texto.
 */
function formatDetail(detail) {
  if (typeof detail === 'string') return detail

  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item
        if (item?.msg) {
          const loc = Array.isArray(item.loc)
            ? item.loc.filter((part) => part !== 'body').join('.')
            : ''
          return loc ? `${loc}: ${item.msg}` : item.msg
        }
        return ''
      })
      .filter(Boolean)
      .join(' · ')
  }

  if (detail?.msg) return detail.msg
  if (detail?.message) return detail.message

  return ''
}

/** Mensaje listo para mostrar al usuario a partir de cualquier error de Axios. */
export function getErrorMessage(error) {
  return (
    formatDetail(error.response?.data?.detail) ||
    error.response?.data?.message ||
    error.message ||
    'Error inesperado. Intenta de nuevo.'
  )
}

/**
 * El backend devuelve 400 cuando un nombre ya existe (y 409 si lo unifican).
 * Lo detectamos por código y por texto para mostrar un mensaje más claro.
 */
export function isDuplicateError(error) {
  const status = error.response?.status
  if (status !== 400 && status !== 409) return false

  const detail = formatDetail(error.response?.data?.detail).toLowerCase()
  return (
    detail.includes('ya existe') ||
    detail.includes('repetido') ||
    detail.includes('duplicado') ||
    detail.includes('duplicate')
  )
}

export default api
