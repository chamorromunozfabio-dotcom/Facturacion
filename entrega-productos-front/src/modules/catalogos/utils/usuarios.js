/** Reglas puras del módulo Usuarios. Sin Vue, sin store y sin API. */

export const ROLES_POR_DEFECTO = [
  { value: 1, label: 'admin' },
  { value: 2, label: 'bodeguero' },
  { value: 3, label: 'cliente' },
]

export const IDS_POR_DEFECTO = Object.fromEntries(
  ROLES_POR_DEFECTO.map((rol) => [rol.label, rol.value]),
)

export const DOCUMENT_OPTIONS = ['CC', 'NIT', 'CE', 'PA'].map((value) => ({ value, label: value }))

const PHONE_PATTERN = /^[0-9]{7,15}$/
const DOCUMENT_PATTERNS = { numerico: /^[0-9]+$/, pasaporte: /^[A-Za-z0-9]+$/ }

export function rolNombreDe(row) {
  if (!row) return ''
  return typeof row.rol === 'object' ? row.rol?.nombre ?? '' : row.rol ?? ''
}

export function resolveRolId(row, roleOptions = []) {
  if (row?.rol_id !== undefined && row?.rol_id !== null && row?.rol_id !== '') {
    return Number(row.rol_id)
  }
  if (typeof row?.rol === 'object' && row?.rol?.id != null) return Number(row.rol.id)
  const nombre = rolNombreDe(row)
  return roleOptions.find((rol) => rol.label === nombre)?.value ?? IDS_POR_DEFECTO[nombre] ?? ''
}

export function normalizarUsuarioFila(usuario, roleOptions = [], empresaOpciones = []) {
  const empresaId = usuario.empresa_id ?? usuario.empresa?.id ?? ''
  const empresaNombre =
    usuario.empresa_nombre ||
    usuario.empresa?.razon_social ||
    empresaOpciones.find((item) => String(item.value) === String(empresaId))?.label ||
    ''
  return {
    ...usuario,
    rol: rolNombreDe(usuario),
    rol_id: resolveRolId(usuario, roleOptions),
    empresa_id: empresaId,
    empresa_nombre: empresaNombre || (empresaId ? `Empresa #${empresaId}` : 'Sin empresa'),
  }
}

export function camposCliente(tipoDocumento) {
  const esPasaporte = String(tipoDocumento ?? '').toUpperCase() === 'PA'
  return [
    {
      key: 'tipo_documento',
      label: 'Tipo de documento',
      type: 'select',
      options: DOCUMENT_OPTIONS,
    },
    {
      key: 'numero_documento',
      label: 'Número de documento',
      maxLength: 20,
      digitsOnly: !esPasaporte,
      lettersDigitsOnly: esPasaporte,
      pattern: esPasaporte ? DOCUMENT_PATTERNS.pasaporte : DOCUMENT_PATTERNS.numerico,
      message: esPasaporte
        ? 'Solo letras y números, sin símbolos.'
        : 'Solo números, sin puntos, guiones ni espacios.',
      hint: esPasaporte ? 'Letras y números, sin símbolos.' : 'Solo números, sin puntos ni guiones.',
    },
    {
      key: 'telefono',
      label: 'Teléfono',
      digitsOnly: true,
      maxLength: 15,
      pattern: PHONE_PATTERN,
      message: 'Solo dígitos: entre 7 y 15.',
      hint: 'Solo números, entre 7 y 15.',
    },
    { key: 'direccion', label: 'Dirección' },
    { key: 'ciudad', label: 'Ciudad' },
  ]
}
