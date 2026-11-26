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
    user: {
      id: 2,
      nombre: 'Luis Gómez',
      correo: 'luis@entrega.com',
      rol: 'bodeguero',
      empresa: { id: 1, razon_social: 'Distribuidora Andina S.A.S.', estado: 'activa' },
    },
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
function factura({
  id,
  numero,
  estado,
  cliente,
  trazabilidad = {},
  empresa = { id: 1, razon_social: 'Distribuidora Andina S.A.S.', nit: '900123456-1' },
}) {
  return {
    id,
    numero,
    numero_factura: numero,
    empresa_id: empresa.id,
    empresa_nombre: empresa.razon_social,
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
      total_bodegueros: 3,
      total_bodegas: 2,
      total_facturas: 45,
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
      total_bodegueros: 0,
      total_bodegas: 0,
      total_facturas: 0,
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
      total_bodegueros: 0,
      total_bodegas: 0,
      total_facturas: 0,
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
      total_bodegueros: 4,
      total_bodegas: 1,
      total_facturas: 120,
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
    // Otra empresa: cada una tiene su propia numeración (FE-0001 se repite).
    factura({
      id: 6,
      numero: 'FE-0001',
      estado: 'emitida',
      cliente: clienteJuan,
      empresa: { id: 2, razon_social: 'Comercializadora del Caribe S.A.S.', nit: '900987654-2' },
    }),
  ],
}

/** Aplica una acción de estado sobre una factura del modo demo. */
export function mockFacturaAction(id, patch) {
  const found = rowsByResource.facturas?.find((row) => String(row.id) === String(id))
  if (found) {
    Object.assign(found, patch)
    // El motivo del rechazo vive en la trazabilidad del detalle.
    if (patch.motivo_rechazo) {
      found.trazabilidad = { ...(found.trazabilidad ?? {}), motivo_rechazo: patch.motivo_rechazo }
    }
  }
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

  // Multiempresa: el admin filtra usuarios, bodegas, tipos y facturas por empresa.
  if (params.empresa_id) {
    filtered = filtered.filter(
      (row) => row.empresa_id === undefined || String(row.empresa_id) === String(params.empresa_id),
    )
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
      total_bodegueros: 0,
      total_bodegas: 0,
      total_facturas: 0,
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
  if (texto.length < 3) return { data: [], total: 0, page: 1, limit: 20 }

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
  let sesion = null
  try {
    sesion = JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    sesion = null
  }
  const rol = sesion?.rol ?? 'admin'

  const fecha_inicio = params.fecha_inicio || params.desde || '2026-11-01'
  const fecha_fin = params.fecha_fin || params.hasta || '2026-11-30'
  const periodo = { fecha_inicio, fecha_fin, desde: fecha_inicio, hasta: fecha_fin }

  // Factor simple por rango de fechas para que Hoy / 7 días / 30 días cambien las cifras.
  const dias = Math.max(
    1,
    Math.round((new Date(fecha_fin) - new Date(fecha_inicio)) / 86400000) + 1 || 30,
  )
  const factorRango = dias <= 1 ? 0.15 : dias <= 7 ? 0.45 : 1
  const escalar = (n) => Math.max(0, Math.round(n * factorRango))

  const temporalBase = [
    { fecha: '2026-11-01', completadas: 4, rechazadas: 0 },
    { fecha: '2026-11-02', completadas: 7, rechazadas: 1 },
    { fecha: '2026-11-03', completadas: 5, rechazadas: 0 },
    { fecha: '2026-11-04', completadas: 9, rechazadas: 1 },
    { fecha: '2026-11-05', completadas: 6, rechazadas: 0 },
  ]
  const temporal = dias <= 1 ? temporalBase.slice(-1) : dias <= 7 ? temporalBase.slice(-3) : temporalBase

  if (rol === 'cliente') {
    const proveedores = [
      { id: 1, empresa: 'Distribuidora Andina S.A.S.', total: 12, aceptadas: 9, pendientes: 2, rechazadas: 1, facturado: 8450000 },
      { id: 2, empresa: 'Comercializadora del Caribe S.A.S.', total: 5, aceptadas: 4, pendientes: 1, rechazadas: 0, facturado: 3200000 },
    ]
    const filtrados = params.empresa_id
      ? proveedores.filter((p) => String(p.id) === String(params.empresa_id))
      : proveedores

    const aceptadas = escalar(filtrados.reduce((acc, p) => acc + p.aceptadas, 0))
    const pendientes = escalar(filtrados.reduce((acc, p) => acc + p.pendientes, 0))
    const rechazadas = escalar(filtrados.reduce((acc, p) => acc + p.rechazadas, 0))
    const facturado = escalar(filtrados.reduce((acc, p) => acc + p.facturado, 0))

    const datosEstado = [
      { etiqueta: 'Entregada', valor: pendientes },
      { etiqueta: 'Firmada', valor: aceptadas },
      { etiqueta: 'Rechazada', valor: rechazadas },
    ].filter((d) => {
      if (params.estado === 'pendientes') return d.etiqueta === 'Entregada'
      if (params.estado === 'aceptadas') return d.etiqueta === 'Firmada'
      if (params.estado === 'rechazadas') return d.etiqueta === 'Rechazada'
      return true
    })

    return {
      periodo,
      generado_para: 'cliente',
      filtros_disponibles: {
        empresas: proveedores.map((p) => ({ id: p.id, razon_social: p.empresa })),
        bodegas: [],
        bodegueros: [],
        tipos: [],
        estados: ['todas', 'pendientes', 'aceptadas', 'rechazadas'],
      },
      kpis: [
        { clave: 'pendientes_accion', titulo: 'Pendientes por firmar', valor: pendientes, formato: 'numero', alerta: pendientes > 0 },
        { clave: 'recibidas_total', titulo: 'Facturas aceptadas', valor: aceptadas, formato: 'numero', alerta: false },
        { clave: 'facturado_cliente', titulo: 'Total comprado', valor: facturado, formato: 'moneda', alerta: false },
        { clave: 'empresas_proveedoras', titulo: 'Empresas proveedoras', valor: filtrados.length, formato: 'numero', alerta: false },
      ],
      desglose_principal: {
        titulo: 'Resumen por Empresa Proveedora',
        columnas: ['Empresa', 'Facturas', 'Aceptadas', 'Pendientes', 'Rechazadas'],
        filas: filtrados.map((p) => ({
          empresa: p.empresa,
          total: escalar(p.total),
          aceptadas: escalar(p.aceptadas),
          pendientes: escalar(p.pendientes),
          rechazadas: escalar(p.rechazadas),
        })),
      },
      serie_temporal: temporal.slice(0, 3),
      alertas_detalle: rechazadas > 0
        ? [{ numero_factura: 'FE-0009', motivo_rechazo: 'Producto diferente al solicitado', fecha: '2026-11-20' }]
        : [],
      series: [
        { clave: 'por_estado', titulo: 'Mis entregas por estado', tipo: 'barras', datos: datosEstado },
      ],
    }
  }

  if (rol === 'bodeguero') {
    const productos = [
      { id: 1, tipo: 'Alimentos', emitidas: 15, completadas: 10, rechazadas: 1 },
      { id: 2, tipo: 'Bebidas', emitidas: 9, completadas: 4, rechazadas: 0 },
      { id: 3, tipo: 'Aseo', emitidas: 6, completadas: 5, rechazadas: 0 },
    ]
    const filtrados = params.tipo_id
      ? productos.filter((p) => String(p.id) === String(params.tipo_id))
      : productos

    const porDespachar = escalar(filtrados.reduce((acc, p) => acc + Math.max(1, p.emitidas - p.completadas - p.rechazadas), 0))
    const sinFirma = escalar(params.tipo_id ? 2 : 6)
    const completadas = escalar(filtrados.reduce((acc, p) => acc + p.completadas, 0))
    const rechazadas = escalar(filtrados.reduce((acc, p) => acc + p.rechazadas, 0))

    return {
      periodo,
      generado_para: 'bodeguero',
      filtros_disponibles: {
        empresas: [],
        bodegas: [],
        bodegueros: [],
        tipos: productos.map((p) => ({ id: p.id, nombre: p.tipo })),
        estados: ['todas', 'pendientes', 'completadas', 'rechazadas'],
      },
      kpis: [
        { clave: 'por_despachar', titulo: 'Por despachar', valor: porDespachar, formato: 'numero', alerta: porDespachar > 5 },
        { clave: 'sin_firma', titulo: 'Esperando firma', valor: sinFirma, formato: 'numero', alerta: sinFirma > 0 },
        { clave: 'completadas', titulo: 'Completadas', valor: completadas, formato: 'numero', alerta: false },
        { clave: 'rechazadas', titulo: 'Rechazadas', valor: rechazadas, formato: 'numero', alerta: rechazadas > 0 },
      ],
      desglose_principal: {
        titulo: 'Actividad por Tipo de Producto',
        columnas: ['Tipo Producto', 'Emitidas', 'Completadas', 'Rechazadas'],
        filas: filtrados.map((p) => ({
          tipo: p.tipo,
          emitidas: escalar(p.emitidas),
          completadas: escalar(p.completadas),
          rechazadas: escalar(p.rechazadas),
        })),
      },
      serie_temporal: temporal,
      alertas_detalle: rechazadas > 0
        ? [{ numero_factura: 'FE-0018', motivo_rechazo: 'Caja averiada en transporte', fecha: '2026-11-22' }]
        : [],
      series: [
        {
          clave: 'por_estado',
          titulo: 'Cola operativa de mi bodega',
          tipo: 'barras',
          datos: [
            { etiqueta: 'Emitida', valor: porDespachar },
            { etiqueta: 'Entregada', valor: sinFirma },
            { etiqueta: 'Completada', valor: completadas },
            { etiqueta: 'Rechazada', valor: rechazadas },
          ],
        },
      ],
    }
  }

  if (rol === 'empresa') {
    const bodegas = [
      { id: 1, bodeguero_id: 2, nombre: 'Bodega Norte', emitidas: 90, completadas: 86, rechazadas: 4, efectividad: '95.5%', facturado: 14250000 },
      { id: 2, bodeguero_id: 7, nombre: 'Bodega Centro', emitidas: 68, completadas: 54, rechazadas: 4, efectividad: '93.1%', facturado: 8550000 },
    ]
    let filtradas = bodegas
    if (params.bodega_id) filtradas = filtradas.filter((b) => String(b.id) === String(params.bodega_id))
    if (params.bodeguero_id) filtradas = filtradas.filter((b) => String(b.bodeguero_id) === String(params.bodeguero_id))

    const totalFacturas = escalar(filtradas.reduce((acc, b) => acc + b.emitidas, 0))
    const completadas = escalar(filtradas.reduce((acc, b) => acc + b.completadas, 0))
    const rechazadas = escalar(filtradas.reduce((acc, b) => acc + b.rechazadas, 0))
    const pendientes = Math.max(0, totalFacturas - completadas - rechazadas)
    const tasaAceptacion = totalFacturas ? Number(((completadas / totalFacturas) * 100).toFixed(1)) : 0
    const tasaRechazo = totalFacturas ? Number(((rechazadas / totalFacturas) * 100).toFixed(1)) : 0
    const facturado = escalar(filtradas.reduce((acc, b) => acc + b.facturado, 0))

    return {
      periodo,
      generado_para: 'empresa',
      filtros_disponibles: {
        empresas: [],
        bodegas: bodegas.map((b) => ({ id: b.id, nombre: b.nombre })),
        bodegueros: [{ id: 2, nombre: 'Luis Gómez' }, { id: 7, nombre: 'Carlos Ruiz' }],
        tipos: [{ id: 1, nombre: 'Alimentos' }, { id: 2, nombre: 'Bebidas' }],
        estados: [],
      },
      kpis: [
        { clave: 'total_facturas', titulo: 'Facturas del periodo', valor: totalFacturas, formato: 'numero', alerta: false },
        { clave: 'facturado_empresa', titulo: 'Facturado empresa', valor: facturado, formato: 'moneda', alerta: false },
        { clave: 'pendientes_cierre', titulo: 'Pendientes de firma', valor: pendientes, formato: 'numero', alerta: pendientes > 0 },
        { clave: 'tasa_aceptacion', titulo: 'Tasa de aceptación', valor: tasaAceptacion, formato: 'porcentaje', alerta: false },
        { clave: 'tasa_rechazo', titulo: 'Tasa de rechazo', valor: tasaRechazo, formato: 'porcentaje', alerta: tasaRechazo > 10 },
      ],
      desglose_principal: {
        titulo: 'Rendimiento por Bodega',
        columnas: ['Bodega', 'Emitidas', 'Completadas', 'Rechazadas', 'Efectividad'],
        filas: filtradas.map((b) => ({
          nombre: b.nombre,
          emitidas: escalar(b.emitidas),
          completadas: escalar(b.completadas),
          rechazadas: escalar(b.rechazadas),
          efectividad: b.efectividad,
        })),
      },
      serie_temporal: temporal,
      alertas_detalle: [
        { numero_factura: 'FE-0042', motivo_rechazo: 'Caja golpeada al momento de la entrega', fecha: '2026-11-23' },
        { numero_factura: 'FE-0039', motivo_rechazo: 'Faltaron dos unidades en el despacho', fecha: '2026-11-21' },
      ],
      series: [
        {
          clave: 'por_bodega',
          titulo: 'Facturado por bodega',
          tipo: 'barras',
          datos: filtradas.map((b) => ({ etiqueta: b.nombre, valor: escalar(b.facturado) })),
        },
      ],
    }
  }

  // Rol: admin (visión global de plataforma SaaS)
  const empresasData = [
    { id: 1, nombre: 'Distribuidora Andina S.A.S.', estado: 'activa', bodegas: 2, facturas: 148, rechazadas: 8, efectividad: '94.6%', facturado: 27105000 },
    { id: 2, nombre: 'Comercializadora del Caribe S.A.S.', estado: 'pendiente', bodegas: 1, facturas: 45, rechazadas: 2, efectividad: '95.5%', facturado: 18495000 },
    { id: 3, nombre: 'Logística Nacional S.A.S.', estado: 'suspendida', bodegas: 1, facturas: 22, rechazadas: 4, efectividad: '81.8%', facturado: 6400000 },
  ]
  let empresasFiltradas = empresasData
  if (params.empresa_id) empresasFiltradas = empresasFiltradas.filter((e) => String(e.id) === String(params.empresa_id))
  if (params.estado) empresasFiltradas = empresasFiltradas.filter((e) => e.estado === params.estado)

  const activas = empresasFiltradas.filter((e) => e.estado === 'activa').length
  const pendientesAprobacion = empresasFiltradas.filter((e) => e.estado === 'pendiente').length
  const facturadoGlobal = escalar(empresasFiltradas.reduce((acc, e) => acc + e.facturado, 0))

  return {
    periodo,
    generado_para: 'admin',
    filtros_disponibles: {
      empresas: empresasData.map((e) => ({ id: e.id, razon_social: e.nombre })),
      bodegas: [],
      bodegueros: [],
      tipos: [],
      estados: ['activa', 'pendiente', 'suspendida'],
    },
    kpis: [
      { clave: 'empresas_activas', titulo: 'Empresas activas', valor: activas, formato: 'numero', alerta: false },
      { clave: 'empresas_pendientes', titulo: 'Empresas pendientes', valor: pendientesAprobacion, formato: 'numero', alerta: pendientesAprobacion > 0 },
      { clave: 'clientes_globales', titulo: 'Clientes registrados', valor: 42, formato: 'numero', alerta: false },
      { clave: 'facturado_global', titulo: 'Facturado global', valor: facturadoGlobal, formato: 'moneda', alerta: false },
      { clave: 'tasa_entrega_global', titulo: 'Tasa de entrega global', valor: 88.4, formato: 'porcentaje', alerta: false },
    ],
    desglose_principal: {
      titulo: 'Top Empresas por Volumen',
      columnas: ['Empresa', 'Bodegas', 'Facturas', 'Rechazadas', 'Efectividad'],
      filas: empresasFiltradas.map((e) => ({
        nombre: e.nombre,
        bodegas: e.bodegas,
        facturas: escalar(e.facturas),
        rechazadas: escalar(e.rechazadas),
        efectividad: e.efectividad,
      })),
    },
    serie_temporal: temporal,
    alertas_detalle: [],
    series: [
      {
        clave: 'por_estado',
        titulo: 'Facturas globales por estado',
        tipo: 'barras',
        datos: [
          { etiqueta: 'Emitida', valor: escalar(18) },
          { etiqueta: 'Entregada', valor: escalar(34) },
          { etiqueta: 'Firmada', valor: escalar(56) },
          { etiqueta: 'Rechazada', valor: escalar(14) },
          { etiqueta: 'Recibida', valor: escalar(20) },
        ],
      },
    ],
  }
}
