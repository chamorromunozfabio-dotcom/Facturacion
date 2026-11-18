import api from './axios'
import { createCrudResource } from './crud'
import { mockFacturaAction, wait } from './mocks'
import { resolveApiModes } from '../config/apiModes'

const USE_MOCKS = resolveApiModes().facturasMocks
const FIRMA_PREFIX = 'data:image/png;base64,'

/** Peticiones de bajo nivel: se exportan para poder probarlas sin mocks. */
export function postAccion(id, path, body) {
  return api.post(`/facturas/${id}/${path}`, body).then((response) => response.data)
}

export function getFacturaPdf(id) {
  return api.get(`/facturas/${id}/pdf`, { responseType: 'blob' })
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
    return mockFacturaAction(id, PATCHES[path])
  }
  return postAccion(id, path, body)
}

export const facturasApi = {
  ...createCrudResource('facturas', { mocks: USE_MOCKS }),

  entregar(id) {
    return accion(id, 'entregar')
  },

  aceptar(id, firma) {
    return accion(id, 'aceptar', { firma })
  },

  rechazar(id, motivo) {
    return accion(id, 'rechazar', { motivo })
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
    triggerDownload(response.data, filename)
    return filename
  },
}

export default facturasApi
