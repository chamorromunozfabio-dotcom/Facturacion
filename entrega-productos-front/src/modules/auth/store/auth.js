import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api, { getErrorMessage } from '../../../shared/api/axios'
import { MOCK_ACCOUNTS, mockUser, wait } from '../../../shared/api/mocks'
import { resolveApiModes } from '../../../shared/config/apiModes'
import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  getUser,
  saveTokens,
  saveUser,
} from '../config/sessionTokens'

const authMocks = resolveApiModes().authMocks

function pickToken(data) {
  return data?.access_token || data?.token || data?.data?.access_token || null
}

function pickRefreshToken(data) {
  return data?.refresh_token || data?.refreshToken || data?.data?.refresh_token || null
}

function pickUser(data) {
  return data?.user || data?.usuario || data?.data?.user || null
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(getAccessToken())
  const refreshToken = ref(getRefreshToken())
  const user = ref(getUser())

  const isAuthenticated = computed(() => Boolean(token.value))

  // El backend puede enviar "rol": "admin" o "rol": { id, nombre }
  const role = computed(() => {
    const raw = user.value?.rol ?? user.value?.role
    if (!raw) return ''
    return typeof raw === 'string' ? raw : raw.nombre ?? raw.name ?? ''
  })

  const userName = computed(
    () => user.value?.nombre ?? user.value?.name ?? user.value?.correo ?? user.value?.usuario ?? '',
  )

  // Contrato multiempresa: /login y /me traen `user.empresa` ({ id, razon_social,
  // estado }) para empresa y bodeguero, y null para admin y cliente. No existen
  // empresa_id ni empresa_nombre sueltos; si no llega la empresa, no hay badge.
  const empresaNombre = computed(() => user.value?.empresa?.razon_social ?? '')

  const empresaId = computed(() => user.value?.empresa?.id ?? null)

  // El backend devuelve `permisos` en /login y /me. El menú, los botones y las
  // rutas usan esta lista real; la matriz por rol queda solo como respaldo.
  const permisos = computed(() => user.value?.permisos ?? [])

  function saveSession(newToken, newUser, newRefreshToken = '') {
    token.value = newToken
    refreshToken.value = newRefreshToken
    user.value = newUser
    return Promise.all([
      saveTokens({ accessToken: newToken, refreshToken: newRefreshToken }),
      saveUser(newUser),
    ])
  }

  async function login(credentials) {
    if (authMocks) {
      await wait(300)
      const correo = String(credentials?.correo ?? '').trim().toLowerCase()
      const cuenta = MOCK_ACCOUNTS.find(
        (item) => item.correo.toLowerCase() === correo && item.contrasena === credentials?.contrasena,
      )
      // Si no coincide con una cuenta de prueba, seguimos entrando como admin demo.
      const demoUser = cuenta?.user ?? mockUser
      await saveSession(`token-demo-${demoUser.rol}`, demoUser, `refresh-demo-${demoUser.rol}`)
      return demoUser
    }

    const { data } = await api.post('/login', credentials)
    const newToken = pickToken(data)
    if (!newToken) throw new Error('El backend no devolvió un token')

    await saveSession(
      newToken,
      pickUser(data) || { nombre: credentials.correo, correo: credentials.correo, rol: '' },
      pickRefreshToken(data) || '',
    )
    return user.value
  }

  /**
   * Recupera el usuario al recargar la página usando GET /me.
   * Si el access token venció, el interceptor renueva con /refresh y reintenta;
   * si el refresh falla, cierra la sesión con el aviso acostumbrado.
   */
  async function fetchMe() {
    if (!token.value) return null

    if (authMocks) {
      await wait(150)
      // Respetamos el rol guardado para no volver a admin al recargar.
      user.value = getUser() || mockUser
      await saveUser(user.value)
      return user.value
    }

    const { data } = await api.get('/me')
    const me = pickUser(data) || data
    user.value = me
    await saveUser(me)
    return user.value
  }

  async function logout() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    await clearSession()
  }

  return {
    token,
    refreshToken,
    user,
    isAuthenticated,
    role,
    userName,
    empresaNombre,
    empresaId,
    permisos,
    login,
    fetchMe,
    logout,
    saveSession,
  }
})

export { getErrorMessage }
