import api from '../../../shared/api/axios'
import { createCrudResource } from '../../catalogos/api/crud'
import { mockBuscarClientes, mockFacturaAction, mockList, wait } from '../../../shared/api/mocks'
import { resolveApiModes } from '../../../shared/config/apiModes'
import { abrirPdfNativo, esPlataformaNativa } from '../utils/pdfNativo'

const USE_MOCKS = resolveApiModes().facturasMocks
const FIRMA_PREFIX = 'data:image/png;base64,'

/** Peticiones de bajo nivel: se exportan para poder probarlas sin mocks. */
export function postAccion(id, path, body) {
  return api.post(`/facturas/${id}/${path}`, body).then((response) => response.data)
}

export function getFacturaPdf(id) {
  return api.get(`/facturas/${id}/pdf`, { responseType: 'blob' })
}

/** Clientes activos para el selector de facturas (admin y bodeguero). */
export function listClientes(params = {}) {
  if (USE_MOCKS) return mockList('facturasClientes', params)
  return api.get('/facturas/clientes', { params }).then((response) => response.data)
}

/**
 * Búsqueda de clientes para facturar. Contrato acordado:
 * `GET /clientes/buscar?q=&page=&limit=` con `q` obligatorio (mínimo 3
 * caracteres); busca por nombre, documento y correo.
 */
export function buscarClientes(q, params = {}) {
  if (USE_MOCKS) return mockBuscarClientes(q)
  return api
    .get('/clientes/buscar', { params: { q, page: 1, limit: 20, ...params } })
    .then((response) => response.data)
}

/** Valida la firma igual que el backend: prefijo, base64 y tamaño. */
export function validateFirma(dataUrl, maxSizeKb = 500) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith(FIRMA_PREFIX)) {
    return 'La firma debe ser una imagen PNG (data:image/png;base64,...).'
  }

  const base64 = dataUrl.slice(FIRMA_PREFIX.length)
  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64) || base64.length % 4 !== 0) {
    return 'La firma no tiene un formato base64 válido.'
  }

  if (dataUrl.length > maxSizeKb * 1024) {
    return `La firma supera los ${maxSizeKb} KB.`
  }

  return ''
}

/** Lee el nombre de archivo del header Content-Disposition. */
export function filenameFromDisposition(disposition, fallback = 'factura.pdf') {
  const match = String(disposition || '').match(/filename="?([^";]+)"?/i)
  return match?.[1]?.trim() || fallback
}

/** Crea el <a> temporal que dispara la descarga en el navegador. */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const PATCHES = {
  entregar: { estado: 'entregada' },
  aceptar: { estado: 'firmada' },
  rechazar: { estado: 'rechazada' },
  recibir: { estado: 'recibida' },
}

async function accion(id, path, body) {
  if (USE_MOCKS) {
    await wait()
    // El demo guarda también el motivo del rechazo para verlo en el detalle.
    const patch = { ...PATCHES[path] }
    if (path === 'rechazar') patch.motivo_rechazo = body?.motivo_rechazo
    return mockFacturaAction(id, patch)
  }
  return postAccion(id, path, body)
}

export const facturasApi = {
  ...createCrudResource('facturas', { mocks: USE_MOCKS }),

  listClientes,
  buscarClientes,

  entregar(id) {
    return accion(id, 'entregar')
  },

  aceptar(id, firma) {
    return accion(id, 'aceptar', { firma })
  },

  // Contrato migrado: el rechazo viaja con `motivo_rechazo` (10 a 255).
  rechazar(id, motivo) {
    return accion(id, 'rechazar', { motivo_rechazo: motivo })
  },

  recibir(id) {
    return accion(id, 'recibir')
  },

  async descargarPdf(id, numero = 'factura') {
    if (USE_MOCKS) return `${numero}.pdf`

    const response = await getFacturaPdf(id)
    const filename = filenameFromDisposition(
      response.headers['content-disposition'],
      `${numero}.pdf`,
    )
    if (esPlataformaNativa()) {
      await abrirPdfNativo(response.data, filename)
    } else {
      triggerDownload(response.data, filename)
    }
    return filename
  },
}

export default facturasApi
