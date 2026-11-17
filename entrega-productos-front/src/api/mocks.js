/**
 * Datos falsos para poder desarrollar hoy sin esperar al backend.
 * Se activan con VITE_USE_MOCKS=true en .env.
 * Campos ajustados a lo que respondió el backend.
 * Roles provisionales: admin, bodeguero, cliente (confirmar con el líder).
 */

export const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

export const PROVISIONAL_ROLES = ['admin', 'bodeguero', 'cliente']

export const mockUser = {
  id: 1,
  nombre: 'Usuario Demo (frontend)',
  correo: 'demo@entrega.com',
  rol: 'admin',
}

const rowsByResource = {
  tipos: [
    { id: 1, nombre: 'Alimentos' },
    { id: 2, nombre: 'Bebidas' },
    { id: 3, nombre: 'Limpieza' },
  ],
  bodegas: [
    { id: 1, nombre: 'Bodega Central', direccion: 'Calle Principal 123' },
    { id: 2, nombre: 'Bodega Norte', direccion: null },
  ],
  usuarios: [
    { id: 1, nombre: 'Ana Pérez', correo: 'ana@entrega.com', rol: 'admin' },
    { id: 2, nombre: 'Luis Gómez', correo: 'luis@entrega.com', rol: 'bodeguero' },
  ],
  permisos: [
    { id: 1, nombre: 'Crear órdenes', descripcion: 'Permite registrar órdenes' },
    { id: 2, nombre: 'Firmar recepción', descripcion: 'Permite recibir y firmar' },
  ],
  roles: [
    { id: 1, nombre: 'admin', descripcion: 'Acceso total' },
    { id: 2, nombre: 'bodeguero', descripcion: 'Gestión de bodega y órdenes' },
    { id: 3, nombre: 'cliente', descripcion: 'Consulta de órdenes y factura' },
  ],
}

function rowsFor(resource) {
  return rowsByResource[resource] ?? [{ id: 1, nombre: 'Registro de ejemplo' }]
}

export async function mockList(resource, params = {}) {
  await wait()
  const page = Number(params.page ?? 1)
  const limit = Number(params.limit ?? 10)
  const q = String(params.q ?? params.search ?? '').toLowerCase()
  const all = rowsFor(resource)
  const filtered = q ? all.filter((row) => JSON.stringify(row).toLowerCase().includes(q)) : all

  return {
    data: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    page,
    limit,
  }
}

export async function mockGet(resource, id) {
  await wait()
  const found = rowsFor(resource).find((row) => String(row.id) === String(id))
  if (!found) throw new Error('Registro no encontrado')
  return found
}

export async function mockCreate(resource, payload) {
  await wait()
  return { id: Date.now(), ...payload }
}

export async function mockUpdate(resource, id, payload) {
  await wait()
  return { id: Number(id), ...payload }
}

export async function mockRemove() {
  await wait()
  return { detail: 'Eliminado (modo demo)' }
}
