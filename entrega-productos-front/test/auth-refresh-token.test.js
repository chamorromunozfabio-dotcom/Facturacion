import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const apiMock = vi.hoisted(() => ({ post: vi.fn(), get: vi.fn() }))

vi.mock('../src/shared/api/axios', () => ({
  default: apiMock,
  getErrorMessage: vi.fn((error) => error?.message || 'Error'),
}))

vi.mock('../src/shared/config/apiModes', () => ({
  resolveApiModes: () => ({ authMocks: false, catalogsMocks: false, facturasMocks: false }),
}))

import { useAuthStore } from '../src/modules/auth/store/auth'

const CREDENCIALES = { correo: 'admin@entrega.com', contrasena: 'Admin123*' }

describe('Refresh token en el store de autenticación', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('guarda el refresh_token que devuelve /login', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        token_type: 'bearer',
        user: { nombre: 'Administrador', rol: 'admin', permisos: [] },
      },
    })

    const auth = useAuthStore()
    await auth.login(CREDENCIALES)

    expect(apiMock.post).toHaveBeenCalledWith('/login', CREDENCIALES)
    expect(auth.token).toBe('access-1')
    expect(auth.refreshToken).toBe('refresh-1')
    expect(localStorage.getItem('token')).toBe('access-1')
    expect(localStorage.getItem('refresh_token')).toBe('refresh-1')
  })

  it('acepta un backend anterior que aún no devuelve refresh_token', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        access_token: 'access-1',
        token_type: 'bearer',
        user: { nombre: 'Administrador', rol: 'admin' },
      },
    })

    const auth = useAuthStore()
    await auth.login(CREDENCIALES)

    expect(auth.token).toBe('access-1')
    expect(auth.refreshToken).toBe('')
    expect(localStorage.getItem('refresh_token')).toBeNull()
  })

  it('logout limpia el access y el refresh token', async () => {
    apiMock.post.mockResolvedValue({
      data: {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        user: { nombre: 'Administrador', rol: 'admin' },
      },
    })

    const auth = useAuthStore()
    await auth.login(CREDENCIALES)
    auth.logout()

    expect(auth.refreshToken).toBe('')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('refresh_token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})
