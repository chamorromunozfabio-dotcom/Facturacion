import { getFieldErrors } from '../../../shared/api/axios'

/** Reglas puras del registro público. No usan Vue ni llaman a la API. */

export const TIPOS_DOCUMENTO = [
  { value: 'CC', label: 'CC' },
  { value: 'CE', label: 'CE' },
  { value: 'NIT', label: 'NIT' },
  { value: 'PA', label: 'Pasaporte' },
]

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TELEFONO_RE = /^[0-9]{7,15}$/
const DOCUMENTO_RE = /^[0-9]+$/
// NIT con dígito de verificación separado por guion, como 900123456-1.
const NIT_RE = /^[0-9]+-[0-9]$/

const CAMPOS_COMUNES = [
  {
    key: 'correo',
    label: 'Correo electrónico',
    type: 'email',
    required: true,
    noSpaces: true,
    maxLength: 120,
    hint: 'Ej. nombre@empresa.com.',
  },
  {
    key: 'contrasena',
    label: 'Contraseña',
    type: 'password',
    required: true,
    minLength: 8,
    maxLength: 72,
    sinTrim: true,
    hint: 'De 8 a 72 caracteres.',
  },
  {
    key: 'confirmar',
    label: 'Confirmar contraseña',
    type: 'password',
    required: true,
    minLength: 8,
    maxLength: 72,
    equals: 'contrasena',
    sinTrim: true,
    mensajeIguales: 'Las contraseñas no coinciden.',
    hint: 'Repite la misma contraseña.',
  },
]

const CAMPOS_CLIENTE = [
  {
    key: 'nombre',
    label: 'Nombre completo',
    required: true,
    maxLength: 100,
    hint: 'Como aparece en tu documento.',
  },
  {
    key: 'tipo_documento',
    label: 'Tipo de documento',
    type: 'select',
    required: true,
    options: TIPOS_DOCUMENTO,
    mensajeRequerido: 'Elige el tipo de documento.',
  },
  {
    key: 'numero_documento',
    label: 'Número de documento',
    required: true,
    digitsOnly: true,
    maxLength: 20,
    pattern: DOCUMENTO_RE,
    message: 'Solo números, sin puntos, guiones ni espacios.',
    hint: 'Solo números, sin puntos ni guiones.',
  },
  {
    key: 'telefono',
    label: 'Teléfono',
    required: true,
    digitsOnly: true,
    maxLength: 15,
    pattern: TELEFONO_RE,
    message: 'Solo dígitos: entre 7 y 15.',
    hint: 'Solo números, entre 7 y 15.',
  },
  ...CAMPOS_COMUNES,
]

const CAMPOS_EMPRESA = [
  {
    key: 'razon_social',
    label: 'Razón social',
    required: true,
    maxLength: 100,
    hint: 'Nombre legal de la empresa.',
  },
  {
    key: 'nit',
    label: 'NIT',
    required: true,
    nitOnly: true,
    maxLength: 20,
    pattern: NIT_RE,
    message: 'Formato de NIT: 900123456-1 (con dígito de verificación).',
    hint: 'Ej. 900123456-1.',
  },
  {
    key: 'telefono',
    label: 'Teléfono corporativo',
    required: true,
    digitsOnly: true,
    maxLength: 15,
    pattern: TELEFONO_RE,
    message: 'Solo dígitos: entre 7 y 15.',
    hint: 'Solo números, entre 7 y 15.',
  },
  {
    key: 'direccion',
    label: 'Dirección',
    required: true,
    maxLength: 200,
    hint: 'Dirección principal de la empresa.',
  },
  {
    key: 'representante',
    label: 'Nombre del representante',
    required: true,
    maxLength: 100,
    hint: 'Persona que representa a la empresa.',
  },
  ...CAMPOS_COMUNES,
]

export function camposDe(tipo) {
  return tipo === 'empresa' ? CAMPOS_EMPRESA : CAMPOS_CLIENTE
}

/** Filtra en vivo: el dato inválido no llega al modelo. */
export function limpiarValor(campo, valor) {
  let texto = String(valor ?? '')
  if (campo.digitsOnly) texto = texto.replace(/[^0-9]/g, '')
  if (campo.nitOnly) texto = texto.replace(/[^0-9-]/g, '').replace(/-+/g, '-')
  if (campo.noSpaces) texto = texto.replace(/\s+/g, '')
  if (!campo.sinTrim) texto = texto.trimStart()
  if (campo.maxLength) texto = texto.slice(0, campo.maxLength)
  return texto
}

/** Bloquea la tecla antes de que aparezca en un campo restringido. */
export function bloquearTecla(campo, evento) {
  if (!campo || evento.ctrlKey || evento.metaKey || evento.altKey) return
  if (evento.key.length !== 1) return
  if (campo.digitsOnly && !/[0-9]/.test(evento.key)) evento.preventDefault()
  else if (campo.nitOnly && !/[0-9-]/.test(evento.key)) evento.preventDefault()
  else if (campo.noSpaces && /\s/.test(evento.key)) evento.preventDefault()
}

export function validarCampo(campo, form = {}) {
  const texto = campo.sinTrim
    ? String(form[campo.key] ?? '')
    : String(form[campo.key] ?? '').trim()
  if (campo.required && !texto) {
    return campo.mensajeRequerido || `Escribe ${campo.label.toLowerCase()}.`
  }
  if (!texto) return ''
  if (campo.maxLength && texto.length > campo.maxLength) {
    return `Máximo ${campo.maxLength} caracteres.`
  }
  if (campo.minLength && texto.length < campo.minLength) {
    return `Mínimo ${campo.minLength} caracteres.`
  }
  if (campo.type === 'email' && !EMAIL_RE.test(texto)) {
    return 'Escribe un correo válido, como nombre@empresa.com.'
  }
  if (campo.pattern && !campo.pattern.test(texto)) {
    return campo.message || 'Revisa el formato de este dato.'
  }
  if (campo.equals && texto !== String(form[campo.equals] ?? '')) {
    return campo.mensajeIguales || 'Los valores no coinciden.'
  }
  return ''
}

export function erroresDe(tipo, form) {
  return Object.fromEntries(
    camposDe(tipo)
      .map((campo) => [campo.key, validarCampo(campo, form)])
      .filter(([, mensaje]) => Boolean(mensaje)),
  )
}

export function puedeRegistrar(tipo, form) {
  return Object.keys(erroresDe(tipo, form)).length === 0
}

/** Lo que se envía al backend: sin `confirmar` ni campos que no existen. */
export function payloadDe(tipo, form) {
  const base = {
    tipo,
    correo: String(form.correo ?? '').trim().toLowerCase(),
    contrasena: String(form.contrasena ?? ''),
  }

  if (tipo === 'empresa') {
    return {
      ...base,
      razon_social: String(form.razon_social ?? '').trim(),
      nit: String(form.nit ?? '').trim(),
      telefono: String(form.telefono ?? '').trim(),
      direccion: String(form.direccion ?? '').trim(),
      representante: String(form.representante ?? '').trim(),
    }
  }

  return {
    ...base,
    nombre: String(form.nombre ?? '').trim(),
    tipo_documento: form.tipo_documento,
    numero_documento: String(form.numero_documento ?? '').trim(),
    telefono: String(form.telefono ?? '').trim(),
  }
}

/**
 * Traduce un 422 de FastAPI a errores por campo. FastAPI manda `detail` como
 * lista; el backend también puede mandar `{ errores: { campo: mensaje } }`.
 */
export function erroresDelBackend(error) {
  const errores = { ...getFieldErrors(error) }
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) {
    for (const item of detail) {
      const campo = Array.isArray(item?.loc)
        ? item.loc.filter((parte) => parte !== 'body' && parte !== '__root__').join('.')
        : ''
      if (campo && item?.msg) errores[campo] = item.msg
    }
  } else if (detail && typeof detail === 'object') {
    // Algunos endpoints devuelven { detail: { campo: "mensaje" } }.
    for (const [campo, mensaje] of Object.entries(detail)) {
      if (typeof mensaje === 'string') errores[campo] = mensaje
    }
  }
  return errores
}
