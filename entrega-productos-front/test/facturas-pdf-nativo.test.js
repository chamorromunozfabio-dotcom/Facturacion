import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  isNativePlatform: vi.fn(),
  abrirPdfNativo: vi.fn(),
}))

vi.mock('../src/shared/api/axios', () => ({
  default: { get: mocks.get, post: vi.fn(), put: vi.fn(), delete: vi.fn() },
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
  isDuplicateError: vi.fn(() => false),
}))

vi.mock('../src/shared/config/apiModes', () => ({
  resolveApiModes: () => ({ facturasMocks: false, catalogsMocks: false }),
}))

vi.mock('../src/modules/facturas/utils/pdfNativo', () => ({
  esPlataformaNativa: mocks.isNativePlatform,
  abrirPdfNativo: mocks.abrirPdfNativo,
}))

import facturasApi from '../src/modules/facturas/api/facturas'

describe('descargarPdf en plataforma nativa', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.get.mockResolvedValue({
      data: new Blob(['%PDF-1.4'], { type: 'application/pdf' }),
      headers: { 'content-disposition': 'attachment; filename="FE-0001.pdf"' },
    })
    mocks.abrirPdfNativo.mockResolvedValue('file:///cache/FE-0001.pdf')
  })

  it('usa el visor nativo y no el <a download> del navegador', async () => {
    const createObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL

    const filename = await facturasApi.descargarPdf(1, 'FE-0001')

    expect(filename).toBe('FE-0001.pdf')
    expect(mocks.get).toHaveBeenCalledWith('/facturas/1/pdf', { responseType: 'blob' })
    expect(mocks.abrirPdfNativo).toHaveBeenCalledWith(expect.any(Blob), 'FE-0001.pdf')
    expect(createObjectURL).not.toHaveBeenCalled()
  })
})
