/**
 * Modo de integración actual.
 *
 * El backend ya publicó todo lo que consume el front: login/me, catálogos
 * (tipos, bodegas, usuarios, roles y permisos), facturas con sus acciones y
 * PDF, y `/estadisticas/resumen`.
 *
 * - VITE_USE_MOCKS=true  → todo usa mocks (modo demo y tests unitarios).
 * - VITE_USE_MOCKS=false → todo contra la API real.
 * - VITE_FACTURAS_MOCKS=true → solo Facturas con mocks, para trabajar sin
 *   backend. En integración normal debe estar en false.
 */
export function resolveApiModes(env = import.meta.env) {
  const globalMocks = env.VITE_USE_MOCKS === 'true'

  return {
    authMocks: globalMocks,
    catalogsMocks: globalMocks,
    facturasMocks: globalMocks || env.VITE_FACTURAS_MOCKS === 'true',
  }
}
