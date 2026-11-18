/**
 * Modo de integración actual.
 *
 * El backend ya publicó los CRUD de catálogos (tipos, bodegas, usuarios,
 * roles y permisos), pero todavía no `/facturas`. Por eso se puede trabajar
 * con la API real en casi todo y dejar solo Facturas con datos falsos.
 *
 * - VITE_USE_MOCKS=true  → todo usa mocks (modo demo y tests unitarios).
 * - VITE_USE_MOCKS=false → catálogos y login usan la API real.
 * - VITE_FACTURAS_MOCKS=true → Facturas sigue con mocks aunque lo anterior
 *   esté en false. Se puede quitar cuando el backend publique `/facturas`.
 */
export function resolveApiModes(env = import.meta.env) {
  const globalMocks = env.VITE_USE_MOCKS === 'true'

  return {
    authMocks: globalMocks,
    catalogsMocks: globalMocks,
    facturasMocks: globalMocks || env.VITE_FACTURAS_MOCKS === 'true',
  }
}
