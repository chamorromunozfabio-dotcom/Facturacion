import { Capacitor } from '@capacitor/core'

/**
 * Punto único de lectura/escritura de la sesión (access, refresh y usuario).
 *
 * En navegador seguimos usando localStorage: la web y los tests no cambian.
 * En Capacitor, Preferences es async, así que mantenemos un cache en memoria
 * que se hidrata al arrancar (main.js) y seguimos exponiendo funciones
 * síncronas: ni axios ni el store cambian su forma de leer.
 * Las escrituras devuelven una Promesa para quien quiera esperar el persistido.
 */
export const TOKEN_KEYS = {
  access: 'token',
  refresh: 'refresh_token',
  user: 'user',
}

const cache = { token: '', refresh_token: '', user: '' }
let promesaPreferences = null

function esNativo() {
  return Capacitor.isNativePlatform()
}

function preferences() {
  if (!promesaPreferences) {
    promesaPreferences = import('@capacitor/preferences').then((modulo) => modulo.Preferences)
  }
  return promesaPreferences
}

function leer(clave) {
  if (!esNativo()) return localStorage.getItem(clave) || ''
  return cache[clave] || ''
}

function escribir(clave, valor) {
  if (!esNativo()) {
    if (valor === null) localStorage.removeItem(clave)
    else localStorage.setItem(clave, valor)
    return Promise.resolve()
  }

  // La cache se actualiza ya: la UI y axios ven el cambio sin esperar al disco.
  cache[clave] = valor === null ? '' : valor
  return preferences()
    .then((plugin) =>
      valor === null ? plugin.remove({ key: clave }) : plugin.set({ key: clave, value: valor }),
    )
    .catch(() => {})
}

/** Carga la sesión desde Preferences antes de crear el store (solo en móvil). */
export async function hydrateSession() {
  if (!esNativo()) {
    for (const clave of Object.values(TOKEN_KEYS)) cache[clave] = localStorage.getItem(clave) || ''
    return
  }

  const plugin = await preferences()
  const claves = Object.values(TOKEN_KEYS)
  const resultados = await Promise.all(claves.map((clave) => plugin.get({ key: clave })))
  claves.forEach((clave, indice) => {
    cache[clave] = resultados[indice]?.value || ''
  })
}

export function getAccessToken() {
  return leer(TOKEN_KEYS.access)
}

export function getRefreshToken() {
  return leer(TOKEN_KEYS.refresh)
}

export function getUser() {
  const crudo = leer(TOKEN_KEYS.user)
  if (!crudo) return null
  try {
    return JSON.parse(crudo)
  } catch {
    return null
  }
}

export function saveTokens({ accessToken, refreshToken } = {}) {
  const escrituras = []
  if (accessToken) escrituras.push(escribir(TOKEN_KEYS.access, accessToken))
  if (refreshToken) escrituras.push(escribir(TOKEN_KEYS.refresh, refreshToken))
  return Promise.all(escrituras)
}

export function saveUser(usuario) {
  return escribir(TOKEN_KEYS.user, JSON.stringify(usuario))
}

export function clearTokens() {
  return Promise.all([
    escribir(TOKEN_KEYS.access, null),
    escribir(TOKEN_KEYS.refresh, null),
  ])
}

/** Limpia tokens y usuario. Deja `sesion_vencida` para que el login lo muestre. */
export function clearSession() {
  return Promise.all([clearTokens(), escribir(TOKEN_KEYS.user, null)])
}
