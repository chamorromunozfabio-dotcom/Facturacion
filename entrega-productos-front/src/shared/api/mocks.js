/**
 * Datos falsos para poder desarrollar hoy sin esperar al backend.
 * Se activan con VITE_USE_MOCKS=true en .env.
 * Campos ajustados a lo que respondió el backend.
 * Roles: admin, empresa, bodeguero y cliente.
 */

export const wait = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

export const PROVISIONAL_ROLES = ['admin', 'empresa', 'bodeguero', 'cliente']

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
  {
    correo: 'empresa@entrega.com',
    contrasena: 'Empresa123*',
    pista: 'Empresa',
    user: {
      id: 4,
      nombre: 'Distribuidora Andina',
      correo: 'empresa@entrega.com',
      rol: 'empresa',
      empresa_id: 1,
      empresa: {
        id: 1,
        razon_social: 'Distribuidora Andina S.A.S.',
        nit: '900123456-1',
        estado: 'activa',
      },
    },
  },
]

/** Genera una factura completa (detalle) a partir de los datos mínimos. */
function factura({ id, numero, estado, cliente, trazabilidad = {} }) {
  return {
    id,
    numero,
    numero_factura: numero,
    empresa_id: 1,
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
  empresas: [
    {
      id: 1,
      razon_social: 'Distribuidora Andina S.A.S.',
      nit: '900123456-1',
      correo: 'empresa@entrega.com',
      telefono: '3001234567',
      direccion: 'Calle 10 # 20-30',
      representante: 'Ana Torres',
      estado: 'activa',
      motivo_rechazo: null,
      fecha_registro: '2026-11-10T09:00:00',
      total_usuarios: 3,
      total_bodegas: 2,
    },
    {
      id: 2,
      razon_social: 'Comercializadora del Caribe S.A.S.',
      nit: '900987654-2',
      correo: 'contacto@caribe.com',
      telefono: '3059876543',
      direccion: 'Avenida 20 # 30-40',
      representante: 'Luis Prado',
      estado: 'pendiente',
      motivo_rechazo: null,
      fecha_registro: '2026-11-20T14:30:00',
      total_usuarios: 0,
      total_bodegas: 0,
    },
    {
      id: 3,
      razon_social: 'Suministros del Pacífico S.A.S.',
      nit: '901222333-4',
      correo: 'gerencia@suministros.com',
      telefono: '3125557788',
      direccion: 'Carrera 5 # 10-15',
      representante: 'Sofía Ramírez',
      estado: 'rechazada',
      motivo_rechazo: 'El NIT no coincide con la cámara de comercio.',
      fecha_registro: '2026-11-15T11:00:00',
      total_usuarios: 0,
      total_bodegas: 0,
    },
    {
      id: 4,
      razon_social: 'Logística Nacional S.A.S.',
      nit: '900444555-6',
      correo: 'operaciones@logisticanacional.com',
      telefono: '3184445566',
      direccion: 'Calle 80 # 50-20',
      representante: 'Jorge Medina',
      estado: 'suspendida',
      motivo_rechazo: null,
      fecha_registro: '2026-10-05T08:00:00',
      total_usuarios: 4,
      total_bodegas: 1,
    },
  ],
  tipos: [
    { id: 1, nombre: 'Alimentos', bodega_id: 1, bodega_nombre: 'Bodega Central', empresa_id: 1 },
    { id: 2, nombre: 'Bebidas', bodega_id: 1, bodega_nombre: 'Bodega Central', empresa_id: 1 },
    { id: 3, nombre: 'Limpieza', bodega_id: 2, bodega_nombre: 'Bodega Norte', empresa_id: 2 },
  ],
  bodegas: [
    {
      id: 1,
      empresa_id: 1,
      empresa_nombre: 'Distribuidora Andina S.A.S.',
      nombre: 'Bodega Central',
      codigo: 'BOG-01',
      direccion: 'Calle Principal 123',
      ciudad: 'Bogotá',
      departamento: 'Cundinamarca',
      telefono: '3001234567',
      correo: 'bodega@entrega.com',
      bodeguero_id: 2,
      bodeguero_nombre: 'Luis Gómez',
      recibe_nombre: 'María Rodríguez',
      recibe_documento: '1020304050',
      recibe_cargo: 'Jefe de bodega',
      recibe_telefono: '3109876543',
    },
    {
      id: 2,
      empresa_id: 2,
      empresa_nombre: 'Comercializadora del Caribe S.A.S.',
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
  facturasClientes: [
    {
      id: clienteJuan.id,
      nombre: clienteJuan.nombre,
      tipo_documento: clienteJuan.tipo_documento,
      numero_documento: clienteJuan.numero_documento,
    },
    {
      id: 5,
      nombre: 'María López',
      tipo_documento: 'CC',
      numero_documento: '1098765432',
      telefono: '3105557788',
      direccion: 'Calle 45 # 12-10',
      correo: 'maria@cliente.com',
    },
    {
      id: 6,
      nombre: 'Comercial Sur S.A.S.',
      tipo_documento: 'NIT',
      numero_documento: '900555111-2',
      telefono: '3204445566',
      direccion: 'Avenida 68 # 20-30',
      correo: 'compras@comercialsur.com',
    },
    {
      id: 7,
      nombre: 'Carlos Ruiz',
      tipo_documento: 'CE',
      numero_documento: '778899',
      telefono: '3012223344',
      direccion: 'Calle 12 # 4-5',
      correo: 'carlos@cliente.com',
    },
  ],
  usuarios: [
    { id: 1, nombre: 'Ana Pérez', correo: 'ana@entrega.com', rol: 'admin', rol_id: 1, permisos: [] },
    {
      id: 2,
      nombre: 'Luis Gómez',
      correo: 'luis@entrega.com',
      rol: 'bodeguero',
      rol_id: 2,
      empresa_id: 1,
      empresa_nombre: 'Distribuidora Andina S.A.S.',
      permisos: [],
    },
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
    {
      id: 4,
      nombre: 'Distribuidora Andina',
      correo: 'empresa@entrega.com',
      rol: 'empresa',
      rol_id: 4,
      empresa_id: 1,
      empresa_nombre: 'Distribuidora Andina S.A.S.',
      tipo_documento: 'NIT',
      numero_documento: '900123456-1',
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
    { id: 1, nombre: 'admin', descripcion: 'Acceso total', permisos: [] },
    { id: 2, nombre: 'bodeguero', descripcion: 'Gestión de bodega y órdenes', permisos: [] },
    { id: 3, nombre: 'cliente', descripcion: 'Consulta de órdenes y factura', permisos: [] },
    { id: 4, nombre: 'empresa', descripcion: 'Administra bodegas y equipo de su empresa', permisos: [] },
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
          ? `${row.numero_factura ?? row.numero} ${row.cliente_nombre}`
              .toLowerCase()
              .includes(q)
          : JSON.stringify(row).toLowerCase().includes(q),
      )
    : all

  // Cada bodega tiene su propio catálogo de tipos.
  if (params.bodega_id) {
    filtered = filtered.filter(
      (row) => row.bodega_id === undefined || String(row.bodega_id) === String(params.bodega_id),
    )
  }

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

/**
 * Registro público simulado.
 * El backend real decide si el cliente queda activo y si la empresa queda
 * pendiente; acá reproducimos ese comportamiento para probar la UI.
 */
export async function mockRegister(payload = {}) {
  await wait(350)
  const tipo = payload.tipo === 'empresa' ? 'empresa' : 'cliente'
  const correo = String(payload.correo ?? '').trim().toLowerCase()
  const existe =
    rowsByResource.usuarios.some((row) => String(row.correo).toLowerCase() === correo) ||
    rowsByResource.empresas.some((row) => String(row.correo).toLowerCase() === correo)
  if (existe) throw new Error('Ya existe una cuenta con ese correo.')

  if (tipo === 'empresa') {
    const empresa = {
      id: Date.now(),
      razon_social: String(payload.razon_social ?? '').trim(),
      nit: String(payload.nit ?? '').trim(),
      correo,
      telefono: String(payload.telefono ?? '').trim(),
      direccion: String(payload.direccion ?? '').trim(),
      representante: String(payload.representante ?? '').trim(),
      estado: 'pendiente',
      motivo_rechazo: null,
      fecha_registro: new Date().toISOString(),
      total_usuarios: 0,
      total_bodegas: 0,
    }
    rowsByResource.empresas.unshift(empresa)
    return {
      message: 'Empresa registrada. Queda pendiente de aprobación.',
      estado: 'pendiente',
      empresa,
    }
  }

  const usuario = {
    id: Date.now(),
    nombre: String(payload.nombre ?? '').trim(),
    correo,
    rol: 'cliente',
    rol_id: 3,
    tipo_documento: payload.tipo_documento ?? 'CC',
    numero_documento: payload.numero_documento ?? '',
    telefono: payload.telefono ?? '',
    permisos: [],
  }
  rowsByResource.usuarios.unshift(usuario)
  return { message: 'Cuenta creada. Ya puedes iniciar sesión.', user: usuario }
}

/** Búsqueda puntual de clientes para facturar (mínimo 5 caracteres). */
export async function mockBuscarClientes(q = '') {
  await wait(250)
  const texto = String(q ?? '').trim().toLowerCase()
  if (texto.length < 5) return { data: [], total: 0, page: 1, limit: 20 }

  const data = rowsByResource.facturasClientes.filter((cliente) =>
    [cliente.nombre, cliente.numero_documento, cliente.correo]
      .filter(Boolean)
      .some((valor) => String(valor).toLowerCase().includes(texto)),
  )
  return { data, total: data.length, page: 1, limit: 20 }
}

/** Aprueba, rechaza, suspende o reactiva una empresa en el modo demo. */
export async function mockCambiarEstadoEmpresa(id, payload = {}) {
  await wait()
  const empresa = rowsByResource.empresas.find((row) => String(row.id) === String(id))
  if (!empresa) throw new Error('Empresa no encontrada')
  empresa.estado = payload.estado ?? empresa.estado
  if (Object.hasOwn(payload, 'motivo_rechazo')) {
    empresa.motivo_rechazo = payload.motivo_rechazo || null
  }
  return { ...empresa }
}

function usuarioDemo(usuarioId) {
  const usuario = rowsByResource.usuarios.find((row) => row.id === Number(usuarioId))
  if (!usuario) throw new Error('Usuario no encontrado')
  return usuario
}

function permisosResumen(valores) {
  return valores
    .map((valor) => (typeof valor === 'object' ? valor.id : valor))
    .map((id) => rowsByResource.permisos.find((permiso) => permiso.id === Number(id)))
    .filter(Boolean)
    .map(({ id, nombre }) => ({ id, nombre }))
}

/** Permisos de un usuario en modo demo. */
export async function mockListPermisos(usuarioId) {
  await wait()
  const usuario = usuarioDemo(usuarioId)
  return { data: permisosResumen(usuario.permisos ?? []) }
}

/** Reemplaza todos los permisos de un usuario (PUT real). */
export async function mockSetPermisosUsuario(usuarioId, permisosIds = []) {
  await wait()
  const usuario = usuarioDemo(usuarioId)
  const ids = [...new Set(permisosIds.map(Number))]
  if (ids.some((id) => !rowsByResource.permisos.some((permiso) => permiso.id === id))) {
    throw new Error('Uno o más permisos no existen')
  }
  usuario.permisos = permisosResumen(ids)
  return { ...usuario }
}

/** Agrega un permiso a un usuario (POST real). */
export async function mockAddPermiso(usuarioId, permisoId) {
  await wait()
  const usuario = usuarioDemo(usuarioId)
  if (!rowsByResource.permisos.some((permiso) => permiso.id === Number(permisoId))) {
    throw new Error('Permiso no encontrado')
  }
  const ids = [...new Set([...(usuario.permisos ?? []).map((p) => p.id), Number(permisoId)])]
  usuario.permisos = permisosResumen(ids)
  return { ...usuario }
}

/** Quita un permiso a un usuario (DELETE real). */
export async function mockRemovePermiso(usuarioId, permisoId) {
  await wait()
  const usuario = usuarioDemo(usuarioId)
  if (!rowsByResource.permisos.some((permiso) => permiso.id === Number(permisoId))) {
    throw new Error('Permiso no encontrado')
  }
  usuario.permisos = (usuario.permisos ?? []).filter((p) => p.id !== Number(permisoId))
  return { ...usuario }
}

/** Reemplaza los permisos de un rol en modo demo (igual que el backend). */
export async function mockSetPermisos(rolId, permisosIds = []) {
  await wait()
  const rol = rowsByResource.roles.find((row) => row.id === Number(rolId))
  if (!rol) throw new Error('Rol no encontrado')
  const ids = [...new Set(permisosIds.map(Number))]
  rol.permisos = ids
    .map((id) => rowsByResource.permisos.find((permiso) => permiso.id === id))
    .filter(Boolean)
    .map(({ id, nombre }) => ({ id, nombre }))
  return { ...rol }
}

/** Serie temporal del modo demo: mismos nombres y tipos que usa el backend real. */
function seriePorFecha(periodo, valores) {
  const desde = new Date(`${periodo.desde}T00:00:00`)
  const hasta = new Date(`${periodo.hasta}T00:00:00`)
  const rango = Math.max(0, hasta.getTime() - desde.getTime())
  const iso = (fecha) =>
    `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(
      fecha.getDate(),
    ).padStart(2, '0')}`

  return {
    clave: 'por_fecha',
    titulo: 'Facturas en el periodo',
    tipo: 'linea',
    datos: valores.map((valor, index) => ({
      etiqueta: iso(
        new Date(desde.getTime() + (rango * index) / Math.max(1, valores.length - 1)),
      ),
      valor,
    })),
  }
}

/**
 * Resumen de estadísticas para el modo demo.
 * El backend filtra con el token; acá leemos el rol guardado para que las tres
 * cuentas de prueba vean un panel distinto sin depender de que exista el endpoint.
 * Las claves, etiquetas y tipos son los que devuelve el backend real.
 */
export async function mockResumenEstadisticas(params = {}) {
  let rol = 'admin'
  try {
    rol = JSON.parse(localStorage.getItem('user') || 'null')?.rol ?? 'admin'
  } catch {
    rol = 'admin'
  }

  const periodo = {
    desde: params.desde || '2026-11-01',
    hasta: params.hasta || '2026-11-30',
  }

  if (rol === 'cliente') {
    return {
      periodo,
      generado_para: 'cliente',
      tarjetas: [
        { clave: 'facturas', etiqueta: 'Mis facturas', valor: 4, sufijo: '' },
        { clave: 'facturado', etiqueta: 'Total de mis facturas', valor: 8450000, sufijo: '$' },
        { clave: 'pendientes', etiqueta: 'Por firmar', valor: 1, sufijo: '' },
        { clave: 'rechazadas', etiqueta: 'Rechazadas', valor: 0, sufijo: '' },
      ],
      series: [
        {
          clave: 'por_estado',
          titulo: 'Mis facturas por estado',
          tipo: 'barras',
          datos: [
            { etiqueta: 'Entregada', valor: 1 },
            { etiqueta: 'Firmada', valor: 3 },
          ],
        },
        seriePorFecha(periodo, [0, 1, 0, 2, 1, 0]),
      ],
    }
  }

  if (rol === 'bodeguero') {
    return {
      periodo,
      generado_para: 'bodeguero',
      tarjetas: [
        { clave: 'facturas', etiqueta: 'Facturas', valor: 24, sufijo: '' },
        { clave: 'facturado', etiqueta: 'Facturado', valor: 8450000, sufijo: '$' },
        { clave: 'pendientes', etiqueta: 'Pendientes de firma', valor: 3, sufijo: '' },
        { clave: 'rechazadas', etiqueta: 'Rechazadas', valor: 1, sufijo: '' },
        { clave: 'bodegas', etiqueta: 'Mis bodegas', valor: 2, sufijo: '' },
        { clave: 'tipos', etiqueta: 'Tipos en mis bodegas', valor: 20, sufijo: '' },
      ],
      series: [
        {
          clave: 'por_estado',
          titulo: 'Facturas por estado',
          tipo: 'barras',
          datos: [
            { etiqueta: 'Emitida', valor: 4 },
            { etiqueta: 'Entregada', valor: 6 },
            { etiqueta: 'Firmada', valor: 11 },
            { etiqueta: 'Rechazada', valor: 1 },
            { etiqueta: 'Recibida', valor: 3 },
          ],
        },
        seriePorFecha(periodo, [0, 2, 4, 3, 7, 5]),
        {
          clave: 'por_bodega',
          titulo: 'Facturado por bodega',
          tipo: 'barras',
          datos: [
            { etiqueta: 'Plaza satelite', valor: 5310500 },
            { etiqueta: 'Plaza central', valor: 3139500 },
          ],
        },
        {
          clave: 'top_productos',
          titulo: 'Productos más vendidos',
          tipo: 'barras',
          datos: [
            { etiqueta: 'Papa', valor: 18 },
            { etiqueta: 'Yuca', valor: 12 },
            { etiqueta: 'Manzana', valor: 9 },
          ],
        },
      ],
    }
  }

  if (rol === 'empresa') {
    return {
      periodo,
      generado_para: 'empresa',
      tarjetas: [
        { clave: 'facturas', etiqueta: 'Facturas de la empresa', valor: 64, sufijo: '' },
        { clave: 'facturado', etiqueta: 'Facturado', valor: 22800000, sufijo: '$' },
        { clave: 'pendientes', etiqueta: 'Pendientes de firma', valor: 6, sufijo: '' },
        { clave: 'rechazadas', etiqueta: 'Rechazadas', valor: 1, sufijo: '' },
        { clave: 'bodegas', etiqueta: 'Bodegas', valor: 2, sufijo: '' },
        { clave: 'usuarios', etiqueta: 'Bodegueros', valor: 3, sufijo: '' },
      ],
      series: [
        {
          clave: 'por_estado',
          titulo: 'Facturas de la empresa por estado',
          tipo: 'barras',
          datos: [
            { etiqueta: 'Emitida', valor: 9 },
            { etiqueta: 'Entregada', valor: 17 },
            { etiqueta: 'Firmada', valor: 28 },
            { etiqueta: 'Rechazada', valor: 1 },
            { etiqueta: 'Recibida', valor: 9 },
          ],
        },
        seriePorFecha(periodo, [0, 2, 5, 4, 8, 6]),
        {
          clave: 'por_bodega',
          titulo: 'Facturado por bodega',
          tipo: 'barras',
          datos: [
            { etiqueta: 'Bodega Central', valor: 14250000 },
            { etiqueta: 'Bodega Norte', valor: 8550000 },
          ],
        },
      ],
    }
  }

  return {
    periodo,
    generado_para: 'admin',
    tarjetas: [
      { clave: 'facturas', etiqueta: 'Facturas', valor: 128, sufijo: '' },
      { clave: 'facturado', etiqueta: 'Facturado', valor: 45600000, sufijo: '$' },
      { clave: 'pendientes', etiqueta: 'Pendientes de firma', valor: 12, sufijo: '' },
      { clave: 'rechazadas', etiqueta: 'Rechazadas', valor: 2, sufijo: '' },
      { clave: 'usuarios_activos', etiqueta: 'Usuarios activos', valor: 6, sufijo: '' },
      { clave: 'bodegas_activas', etiqueta: 'Bodegas activas', valor: 2, sufijo: '' },
    ],
    series: [
      {
        clave: 'por_estado',
        titulo: 'Facturas por estado',
        tipo: 'barras',
        datos: [
          { etiqueta: 'Emitida', valor: 18 },
          { etiqueta: 'Entregada', valor: 34 },
          { etiqueta: 'Firmada', valor: 56 },
          { etiqueta: 'Rechazada', valor: 2 },
          { etiqueta: 'Recibida', valor: 20 },
        ],
      },
      seriePorFecha(periodo, [0, 3, 6, 4, 9, 7]),
      {
        clave: 'por_bodega',
        titulo: 'Facturado por bodega',
        tipo: 'barras',
        datos: [
          { etiqueta: 'Plaza satelite', valor: 27105000 },
          { etiqueta: 'Plaza central', valor: 18495000 },
        ],
      },
      {
        clave: 'top_productos',
        titulo: 'Productos más vendidos',
        tipo: 'barras',
        datos: [
          { etiqueta: 'Papa', valor: 120 },
          { etiqueta: 'Yuca', valor: 110 },
          { etiqueta: 'Manzana', valor: 50 },
          { etiqueta: 'Arroz', valor: 35 },
          { etiqueta: 'Pera', valor: 20 },
        ],
      },
    ],
  }
}
