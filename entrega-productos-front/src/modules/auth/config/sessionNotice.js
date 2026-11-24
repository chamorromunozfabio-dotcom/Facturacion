import { ref } from 'vue'

/**
 * Aviso de sesión vencida.
 * El interceptor 401 lo enciende y el login lo muestra y limpia al entrar.
 * Usamos localStorage + un ref para cubrir también el caso de que el login ya
 * estuviera montado cuando vence el token (por ejemplo, al recargar /login).
 */
const KEY = 'sesion_vencida'

export const MENSAJE_SESION_VENCIDA =
  'Tu sesión venció por seguridad (después de 60 minutos). Volvé a ingresar para continuar.'

export const avisoSesionVencida = ref(false)

export function marcarSesionVencida() {
  localStorage.setItem(KEY, '1')
  avisoSesionVencida.value = true
}

/** Al entrar al login, recogemos un aviso pendiente y limpiamos el guardado. */
export function prepararAvisoSesionVencida() {
  const pendiente = localStorage.getItem(KEY) === '1'
  localStorage.removeItem(KEY)
  avisoSesionVencida.value = pendiente
}
