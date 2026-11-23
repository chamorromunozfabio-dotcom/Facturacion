import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  isNativePlatform: vi.fn(),
  writeFile: vi.fn(),
  getUri: vi.fn(),
  share: vi.fn(),
}))

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: mocks.isNativePlatform },
}))

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Cache: 'CACHE' },
  Filesystem: { writeFile: mocks.writeFile, getUri: mocks.getUri },
}))

vi.mock('@capacitor/share', () => ({
  Share: { share: mocks.share },
}))

import { abrirPdfNativo, blobABase64, esPlataformaNativa } from '../src/utils/pdfNativo'

describe('PDF nativo (Capacitor)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.isNativePlatform.mockReturnValue(true)
    mocks.writeFile.mockResolvedValue({ uri: 'file:///cache/FE-0001.pdf' })
    mocks.getUri.mockResolvedValue({ uri: 'file:///cache/FE-0001.pdf' })
    mocks.share.mockResolvedValue({})
  })

  it('detecta cuándo corre dentro del WebView nativo', () => {
    expect(esPlataformaNativa()).toBe(true)
    mocks.isNativePlatform.mockReturnValue(false)
    expect(esPlataformaNativa()).toBe(false)
  })

  it('convierte el blob del backend a base64 sin el prefijo data URL', async () => {
    const base64 = await blobABase64(new Blob(['%PDF-1.4'], { type: 'application/pdf' }))
    expect(atob(base64)).toBe('%PDF-1.4')
  })

  it('guarda el PDF en el cache y abre el visor del sistema', async () => {
    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })

    const uri = await abrirPdfNativo(blob, 'FE-0001.pdf')

    expect(mocks.writeFile).toHaveBeenCalledWith({
      path: 'FE-0001.pdf',
      data: expect.any(String),
      directory: 'CACHE',
    })
    expect(mocks.getUri).toHaveBeenCalledWith({ path: 'FE-0001.pdf', directory: 'CACHE' })
    expect(mocks.share).toHaveBeenCalledWith({
      files: ['file:///cache/FE-0001.pdf'],
      title: 'FE-0001.pdf',
      dialogTitle: 'Abrir PDF',
    })
    expect(uri).toBe('file:///cache/FE-0001.pdf')
  })

  it('reutiliza la apertura en curso si se toca PDF dos veces', async () => {
    let resolverShare
    mocks.share.mockImplementation(() => new Promise((resolve) => { resolverShare = resolve }))

    const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    const primera = abrirPdfNativo(blob, 'FE-0001.pdf')
    const segunda = abrirPdfNativo(blob, 'FE-0001.pdf')

    expect(segunda).toBe(primera)
    await vi.waitFor(() => expect(mocks.share).toHaveBeenCalledTimes(1))
    expect(mocks.writeFile).toHaveBeenCalledTimes(1)

    resolverShare()
    await Promise.all([primera, segunda])

    // Una vez cerrado el visor, un clic nuevo sí debe abrir el PDF otra vez.
    mocks.share.mockResolvedValue({})
    await abrirPdfNativo(blob, 'FE-0001.pdf')
    expect(mocks.share).toHaveBeenCalledTimes(2)
  })
})
