import { describe, expect, it, vi } from 'vitest'

const axiosMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('../src/shared/api/axios', () => ({
  default: axiosMock,
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  isDuplicateError: vi.fn(() => false),
}))

import facturasApi, {
  filenameFromDisposition,
  getFacturaPdf,
  postAccion,
  triggerDownload,
  validateFirma,
} from '../src/modules/facturas/api/facturas'

const VALIDA = 'data:image/png;base64,YWJj'

describe('Test 21 — API de Facturas', () => {
  it('acepta una firma PNG válida', () => {
    expect(validateFirma(VALIDA)).toBe('')
  })

  it('rechaza una firma sin el prefijo PNG', () => {
    expect(validateFirma('data:image/jpeg;base64,YWJj')).toContain('imagen PNG')
    expect(validateFirma('')).toContain('imagen PNG')
  })

  it('rechaza un base64 inválido', () => {
    expect(validateFirma('data:image/png;base64,***')).toContain('base64')
  })

  it('rechaza una firma mayor a 500 KB', () => {
    const grande = 'data:image/png;base64,' + 'A'.repeat(600 * 1024)
    expect(validateFirma(grande)).toContain('500 KB')
  })

  it('postAccion usa la ruta y el cuerpo correctos', async () => {
    axiosMock.post.mockResolvedValue({ data: { id: 1, estado: 'firmada' } })

    await postAccion(1, 'aceptar', { firma: VALIDA })

    expect(axiosMock.post).toHaveBeenCalledWith('/facturas/1/aceptar', { firma: VALIDA })
  })

  it('getFacturaPdf pide la respuesta como blob', async () => {
    axiosMock.get.mockResolvedValue({ data: new Blob(['pdf']), headers: {} })

    await getFacturaPdf(1)

    expect(axiosMock.get).toHaveBeenCalledWith('/facturas/1/pdf', { responseType: 'blob' })
  })

  it('lee el nombre del archivo del Content-Disposition', () => {
    expect(filenameFromDisposition('attachment; filename="FE-0001.pdf"')).toBe('FE-0001.pdf')
    expect(filenameFromDisposition('', 'FE-0002.pdf')).toBe('FE-0002.pdf')
  })

  it('triggerDownload dispara la descarga con el nombre correcto', () => {
    let link
    URL.createObjectURL = vi.fn(() => 'blob:firma')
    URL.revokeObjectURL = vi.fn()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      link = this
    })

    triggerDownload(new Blob(['x']), 'FE-0001.pdf')

    expect(link.download).toBe('FE-0001.pdf')
    expect(click).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:firma')
    click.mockRestore()
  })

  it('el modo demo cambia el estado con entregar, aceptar, rechazar y recibir', async () => {
    expect((await facturasApi.entregar(2)).estado).toBe('entregada')
    expect((await facturasApi.aceptar(2, VALIDA)).estado).toBe('firmada')
    expect((await facturasApi.rechazar(4, 'No era lo pedido')).estado).toBe('rechazada')
    expect((await facturasApi.recibir(3)).estado).toBe('recibida')
  })

  it('el listado filtra por número, por nombre de cliente y por estado', async () => {
    const porNumero = await facturasApi.list({ q: 'FE-0001', page: 1, limit: 10 })
    expect(porNumero.total).toBe(1)
    expect(porNumero.data[0].numero).toBe('FE-0001')

    const porCliente = await facturasApi.list({ q: 'juan', page: 1, limit: 10 })
    expect(porCliente.total).toBe(5)

    const porEstado = await facturasApi.list({ estado: 'emitida', page: 1, limit: 10 })
    expect(porEstado.total).toBe(1)
    expect(porEstado.data[0].estado).toBe('emitida')
  })

  it('el detalle trae totales, detalle y trazabilidad', async () => {
    const detalle = await facturasApi.get(1)

    expect(detalle.numero).toBe('FE-0001')
    expect(detalle.totales.total).toBe(36750)
    expect(detalle.detalle[0].descripcion).toBe('Arroz 500 g')
    expect(detalle.trazabilidad).toHaveProperty('firma')
  })

  it('descargarPdf devuelve el nombre esperado en modo demo', async () => {
    expect(await facturasApi.descargarPdf(1, 'FE-0001')).toBe('FE-0001.pdf')
  })
})
