/** Reglas puras de campos del formulario de Bodegas. Sin Vue ni API. */

const PHONE_PATTERN = /^[0-9]{7,20}$/
const PHONE_MESSAGE = 'Solo dígitos: entre 7 y 20.'

// El backend exige los 11 datos. `codigo`, `recibe_documento` y `recibe_cargo`
// tenían un largo distinto en el front; aquí van con el límite del contrato.
export const BODEGA_FIELDS = [
  { key: 'nombre', label: 'Nombre', required: true, maxLength: 100 },
  { key: 'codigo', label: 'Código', required: true, maxLength: 30 },
  { key: 'direccion', label: 'Dirección', required: true, maxLength: 200 },
  { key: 'ciudad', label: 'Ciudad', required: true, maxLength: 100 },
  { key: 'departamento', label: 'Departamento', required: true, maxLength: 100 },
  {
    key: 'telefono',
    label: 'Teléfono',
    required: true,
    digitsOnly: true,
    maxLength: 20,
    pattern: PHONE_PATTERN,
    message: PHONE_MESSAGE,
    hint: 'Ej. 3001234567',
  },
  {
    key: 'correo',
    label: 'Correo de la bodega',
    required: true,
    type: 'email',
    maxLength: 100,
    noSpaces: true,
    hint: 'Ej. bodega@empresa.com.',
  },
  { key: 'recibe_nombre', label: 'Nombre de quien recibe', required: true, maxLength: 100 },
  {
    key: 'recibe_documento',
    label: 'Documento de quien recibe',
    required: true,
    digitsOnly: true,
    maxLength: 30,
    hint: 'Solo números, sin puntos ni guiones.',
  },
  { key: 'recibe_cargo', label: 'Cargo de quien recibe', required: true, maxLength: 100 },
  {
    key: 'recibe_telefono',
    label: 'Teléfono de quien recibe',
    required: true,
    digitsOnly: true,
    maxLength: 20,
    pattern: PHONE_PATTERN,
    message: PHONE_MESSAGE,
    hint: 'Ej. 3109876543',
  },
]
