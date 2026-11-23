/**
 * Punto único de lectura/escritura de la sesión.
 *
 * Hoy vive en localStorage. Al migrar a Capacitor Preferences en el celular,
 * este archivo mantiene un cache en memoria que se hidrata al arrancar y sigue
 * exponiendo estas mismas funciones síncronas: ni axios ni el store cambian.
 */
export const TOKEN_KEYS = {
  access: 'token',
  refresh: 'refresh_token',
  user: 'user',
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEYS.access) || ''
}

export function getRefreshToken() {
  return localStorage.getItem(TOKEN_KEYS.refresh) || ''
}

/** Guarda los tokens recibidos. El access y el refresh pueden venir juntos. */
export function saveTokens({ accessToken, refreshToken } = {}) {
  if (accessToken) localStorage.setItem(TOKEN_KEYS.access, accessToken)
  if (refreshToken) localStorage.setItem(TOKEN_KEYS.refresh, refreshToken)
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.access)
  localStorage.removeItem(TOKEN_KEYS.refresh)
}

/** Limpia tokens y usuario. Deja `sesion_vencida` para que el login lo muestre. */
export function clearSession() {
  clearTokens()
  localStorage.removeItem(TOKEN_KEYS.user)
}
