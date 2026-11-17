import { describe, expect, it } from 'vitest'
import { getErrorMessage } from '../src/api/axios'

describe('Test 1 — getErrorMessage', () => {
  it('usa el detail que envía FastAPI', () => {
    const error = { response: { data: { detail: 'Credenciales incorrectas' } } }

    expect(getErrorMessage(error)).toBe('Credenciales incorrectas')
  })

  it('usa message del cuerpo cuando no hay detail', () => {
    const error = { response: { data: { message: 'No tiene permiso' } } }

    expect(getErrorMessage(error)).toBe('No tiene permiso')
  })

  it('usa error.message cuando no hay respuesta del servidor', () => {
    const error = new Error('Network Error')

    expect(getErrorMessage(error)).toBe('Network Error')
  })

  it('devuelve un mensaje genérico si no hay información', () => {
    expect(getErrorMessage({})).toBe('Error inesperado. Intenta de nuevo.')
  })
})
