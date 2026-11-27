/**
 * Reglas puras del login: sin Vue, sin store y sin router.
 * Así se pueden probar y reutilizar desde el composable o desde otro formulario.
 */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const DOCUMENTO_RE = /^[A-Za-z0-9]{5,20}$/
export const MIN_PASSWORD = 8

export function validarCorreo(valor) {
  const identificador = String(valor ?? '').trim()
  if (!identificador) return 'El correo es obligatorio.'
  if (!identificador.includes('@') && DOCUMENTO_RE.test(identificador)) return ''
  if (!EMAIL_RE.test(identificador)) {
    return 'Ingresa un correo válido (ejemplo: nombre@correo.com).'
  }
  return ''
}

export function validarContrasena(valor) {
  const contrasena = String(valor ?? '')
  if (!contrasena) return 'La contraseña es obligatoria.'
  if (contrasena.length < MIN_PASSWORD) {
    return `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
  }
  return ''
}

export function validarCredenciales(credentials) {
  return {
    correo: validarCorreo(credentials?.correo),
    contrasena: validarContrasena(credentials?.contrasena),
  }
}

export function puedeEnviar(errores, loading) {
  return !errores.correo && !errores.contrasena && !loading
}

/** Texto del título/hint del botón mientras el formulario no es válido. */
export function avisoBoton(credentials, errores, listo, loading) {
  if (loading || listo) return ''
  if (!String(credentials?.correo ?? '').trim() || !credentials?.contrasena) {
    return 'Completa correo y contraseña para continuar.'
  }
  return 'Corrige los campos marcados para continuar.'
}

/** Mensaje de error al intentar enviar un formulario incompleto. */
export function mensajeValidacion(credentials) {
  if (!credentials?.correo || !credentials?.contrasena) return 'Ingresa correo y contraseña.'
  return 'Corrige los campos marcados para continuar.'
}
