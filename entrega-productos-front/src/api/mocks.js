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

/** Cuentas de prueba para entrar con cada rol sin esperar al backend. */
export const MOCK_ACCOUNTS = [
  {
    correo: 'admin@entrega.com',
    contrasena: 'Admin123*',
    pista: 'Admin',
    user: { id: 1, nombre: 'Ana Pérez', correo: 'admin@entrega.com', rol: 'admin' },
  },
  {
    correo: 'luis@entrega.com',
    contrasena: 'Bodega123*',
    pista: 'Bodeguero',
    user: { id: 2, nombre: 'Luis Gómez', correo: 'luis@entrega.com', rol: 'bodeguero' },
  },
  {
    correo: 'juan@cliente.com',
    contrasena: 'Cliente123*',
    pista: 'Cliente',
    user: {
      id: 3,
      nombre: 'Juan Pérez',
      correo: 'juan@cliente.com',
      rol: 'cliente',
      cliente_id: 3,
    },
  },
]

/** Genera una factura completa (detalle) a partir de los datos mínimos. */
function factura({ id, numero, estado, cliente, trazabilidad = {} }) {
  return {
    id,
    numero,
    estado,
    fecha_emision: '2026-11-18T10:30:00',
    fecha_vencimiento: null,
    cliente_id: cliente.id,
    cliente_nombre: cliente.nombre,
    total: 36750,
    forma_pago: 'contado',
    medio_pago: 'transferencia',
    moneda: 'COP',
    emisor: {
      razon_social: 'Entrega de Productos S.A.S.',
      nit: '900123456-1',
      direccion: 'Calle 1 # 2-3',
      telefono: '3000000000',
      correo: 'facturacion@entrega.com',
    },
    adquiriente: {
      id: cliente.id,
      nombre: cliente.nombre,
      tipo_documento: cliente.tipo_documento ?? 'CC',
      numero_documento: cliente.numero_documento ?? '',
      direccion: cliente.direccion ?? '',
      telefono: cliente.telefono ?? '',
      correo: cliente.correo ?? '',
    },
    bodega: { id: 1, nombre: 'Bodega Central', recibe_nombre: 'María Rodríguez' },
    detalle: [
      {
        linea: 1,
        tipo_id: 5,
        descripcion: 'Arroz 500 g',
        cantidad: 10,
        precio_unitario: 3500,
        descuento_porcentaje: 0,
        iva_porcentaje: 5,
        subtotal: 35000,
        valor_descuento: 0,
        valor_iva: 1750,
        total_linea: 36750,
      },
    ],
    totales: {
      subtotal: 35000,
      total_descuento: 0,
      base_gravable: 35000,
      total_iva: 1750,
      total: 36750,
    },
    observaciones: 'Entregar en portería',
    pie_pagina: '',
    validacion_electronica: { cufe: '', qr: '', fecha_validacion: '' },
    software: { nombre: 'Entrega de Productos', version: '1.0.0', fabricante: '' },
    trazabilidad: {
      creada_por: 'Ana Pérez',
      fecha_entrega: null,
      fecha_respuesta: null,
      motivo_rechazo: null,
      firma: null,
      fecha_recepcion: null,
      ...trazabilidad,
    },
  }
}

const clienteJuan = {
  id: 3,
  nombre: 'Juan Pérez',
  tipo_documento: 'CC',
  numero_documento: '1020304050',
  direccion: 'Calle 10 # 20-30',
  telefono: '3001234567',
  correo: 'juan@cliente.com',
}

const rowsByResource = {
  tipos: [
    { id: 1, nombre: 'Alimentos' },
    { id: 2, nombre: 'Bebidas' },
    { id: 3, nombre: 'Limpieza' },
  ],
  bodegas: [
    {
      id: 1,
      nombre: 'Bodega Central',
      codigo: 'BOG-01',
      direccion: 'Calle Principal 123',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      telefono: '3001234567',
      correo: 'bodega@entrega.com',
      recibe_nombre: 'María Rodríguez',
      recibe_documento: '1020304050',
      recibe_cargo: 'Jefe de bodega',
      recibe_telefono: '3109876543',
    },
    {
      id: 2,
      nombre: 'Bodega Norte',
      codigo: null,
      direccion: null,
      ciudad: 'Medellín',
      departamento: null,
      telefono: null,
      correo: null,
      recibe_nombre: 'Carlos López',
      recibe_documento: null,
      recibe_cargo: null,
      recibe_telefono: null,
    },
  ],
  usuarios: [
    { id: 1, nombre: 'Ana Pérez', correo: 'ana@entrega.com', rol: 'admin', rol_id: 1 },
    { id: 2, nombre: 'Luis Gómez', correo: 'luis@entrega.com', rol: 'bodeguero', rol_id: 2 },
    {
      id: 3,
      nombre: 'Juan Pérez',
      correo: 'juan@cliente.com',
      rol: 'cliente',
      rol_id: 3,
      tipo_documento: 'CC',
      numero_documento: '1020304050',
      telefono: '3001234567',
      direccion: 'Calle 10 # 20-30',
      ciudad: 'Bogotá',
    },
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
  facturas: [
    factura({ id: 1, numero: 'FE-0001', estado: 'emitida', cliente: clienteJuan }),
    factura({
      id: 2,
      numero: 'FE-0002',
      estado: 'entregada',
      cliente: clienteJuan,
      trazabilidad: { fecha_entrega: '2026-11-18T11:00:00' },
    }),
    factura({
      id: 3,
      numero: 'FE-0003',
      estado: 'firmada',
      cliente: clienteJuan,
      trazabilidad: { firma: 'data:image/png;base64,YWJj' },
    }),
    factura({
      id: 4,
      numero: 'FE-0004',
      estado: 'rechazada',
      cliente: clienteJuan,
      trazabilidad: { motivo_rechazo: 'La cantidad no es la pedida' },
    }),
    factura({
      id: 5,
      numero: 'FE-0005',
      estado: 'recibida',
      cliente: clienteJuan,
      trazabilidad: { fecha_recepcion: '2026-11-18T15:00:00' },
    }),
  ],
}

/** Aplica una acción de estado sobre una factura del modo demo. */
export function mockFacturaAction(id, patch) {
  const found = rowsByResource.facturas?.find((row) => String(row.id) === String(id))
  if (found) Object.assign(found, patch)
  return { id: Number(id), ...patch }
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
  let filtered = q
    ? all.filter((row) =>
        resource === 'facturas'
          ? `${row.numero} ${row.cliente_nombre}`.toLowerCase().includes(q)
          : JSON.stringify(row).toLowerCase().includes(q),
      )
    : all

  // El backend fuerza rol=cliente para bodeguero y permite cualquier rol al admin.
  if (params.rol) {
    filtered = filtered.filter((row) => row.rol === params.rol)
  }

  // El listado de facturas filtra por un estado exacto.
  if (params.estado) {
    filtered = filtered.filter((row) => row.estado === params.estado)
  }

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
