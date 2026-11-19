import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api, { getErrorMessage } from '../api/axios'
import { MOCK_ACCOUNTS, mockUser, wait } from '../api/mocks'
import { resolveApiModes } from '../config/apiModes'

const TOKEN_KEY = 'token'
const USER_KEY = 'user'
const authMocks = resolveApiModes().authMocks

function readStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null
  } catch {
    return null
  }
}

function pickToken(data) {
  return data?.access_token || data?.token || data?.data?.access_token || null
}

function pickUser(data) {
  return data?.user || data?.usuario || data?.data?.user || null
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const user = ref(readStoredUser())

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

  // El backend devuelve `permisos` en /login y /me. El menú, los botones y las
  // rutas usan esta lista real; la matriz por rol queda solo como respaldo.
  const permisos = computed(() => user.value?.permisos ?? [])

  function saveSession(newToken, newUser) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem(TOKEN_KEY, newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
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
      saveSession(`token-demo-${demoUser.rol}`, demoUser)
      return demoUser
    }

    const { data } = await api.post('/login', credentials)
    const newToken = pickToken(data)
    if (!newToken) throw new Error('El backend no devolvió un token')

    saveSession(newToken, pickUser(data) || { nombre: credentials.correo, correo: credentials.correo, rol: '' })
    return user.value
  }

  /**
   * Recupera el usuario al recargar la página usando GET /me.
   * El token dura 60 min: si venció, el interceptor 401 cierra la sesión.
   */
  async function fetchMe() {
    if (!token.value) return null

    if (authMocks) {
      await wait(150)
      // Respetamos el rol guardado para no volver a admin al recargar.
      user.value = readStoredUser() || mockUser
      localStorage.setItem(USER_KEY, JSON.stringify(user.value))
      return user.value
    }

    const { data } = await api.get('/me')
    const me = pickUser(data) || data
    user.value = me
    localStorage.setItem(USER_KEY, JSON.stringify(me))
    return user.value
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, isAuthenticated, role, userName, permisos, login, fetchMe, logout, saveSession }
})

export { getErrorMessage }
