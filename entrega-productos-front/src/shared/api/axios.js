import axios from 'axios'
import { marcarSesionVencida } from '../../modules/auth/config/sessionNotice'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from '../../modules/auth/config/sessionTokens'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Cliente HTTP único para todo el frontend.
 * - baseURL viene de .env (VITE_API_URL)
 * - el interceptor agrega el token JWT a cada petición
 * - ante un 401 renueva con POST /refresh una vez y reintenta la petición
 * - si el refresh falla, cierra sesión y vamos al login
 */
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Una sola renovación aunque vengan varios 401 al mismo tiempo.
let refreshEnCurso = null

function esRuta(url, tramo) {
  return String(url || '').includes(tramo)
}

api.interceptors.request.use((config) => {
  // /refresh se autentica con su propio token en el body, no con el Bearer viejo.
  if (esRuta(config.url, '/refresh')) return config

  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

async function renovarTokens() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) throw new Error('No hay refresh token guardado')

  const { data } = await api.post('/refresh', { refresh_token: refreshToken })
  const accessToken = data?.access_token || data?.token || data?.data?.access_token
  const refreshNuevo = data?.refresh_token || data?.data?.refresh_token

  if (!accessToken || !refreshNuevo) {
    throw new Error('El backend no devolvió los tokens renovados')
  }

  // El backend rota el refresh en cada llamada: hay que guardar siempre el último.
  await saveTokens({ accessToken, refreshToken: refreshNuevo })
  return accessToken
}

async function cerrarSesion(error, config) {
  // Un 401 del login son credenciales incorrectas, no una sesión vencida.
  const esLogin = esRuta(config?.url, '/login')
  if (!esLogin && getAccessToken()) {
    marcarSesionVencida()
  }

  await clearSession()

  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
  return Promise.reject(error)
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config || {}
    const es401 = error.response?.status === 401
    const puedeRenovar =
      es401 &&
      !esRuta(config.url, '/login') &&
      !esRuta(config.url, '/refresh') &&
      !config._reintentado

    if (puedeRenovar) {
      try {
        if (!refreshEnCurso) {
          refreshEnCurso = renovarTokens().finally(() => {
            refreshEnCurso = null
          })
        }
        const accessToken = await refreshEnCurso
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${accessToken}`
        config._reintentado = true
        return api(config)
      } catch (refreshError) {
        // El interceptor del propio /refresh ya marcó la sesión vencida si dio 401.
        if (refreshError.response?.status !== 401) {
          return cerrarSesion(error, config)
        }
        return Promise.reject(error)
      }
    }

    if (es401) return cerrarSesion(error, config)
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
 * Los 422 de facturas mantienen `detail` como texto y agregan `errores`
 * con un mensaje por campo. Lo devolvemos tal cual para que cada pantalla
 * lo traduzca a un texto amigable junto al control correspondiente.
 */
export function getFieldErrors(error) {
  const errores = error?.response?.data?.errores
  return errores && typeof errores === 'object' && !Array.isArray(errores) ? errores : {}
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
