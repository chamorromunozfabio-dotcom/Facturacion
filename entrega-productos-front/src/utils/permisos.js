/** Texto sin acentos ni mayúsculas, para buscar usuarios como la persona espera. */
export function normalizarTexto(texto) {
  return String(texto ?? '')
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Dos iniciales para el avatar: "María Pérez" -> "MP". */
export function iniciales(nombre) {
  return normalizarTexto(nombre)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}
