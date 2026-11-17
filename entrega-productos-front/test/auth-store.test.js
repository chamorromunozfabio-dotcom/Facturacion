import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../src/stores/auth'

describe('Test 2 — store de autenticación', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('guarda el token y el usuario en localStorage', () => {
    const auth = useAuthStore()

    auth.saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    expect(auth.token).toBe('token-123')
    expect(auth.isAuthenticated).toBe(true)
    expect(auth.userName).toBe('Ana')
    expect(auth.role).toBe('admin')
    expect(localStorage.getItem('token')).toBe('token-123')
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ nombre: 'Ana', rol: 'admin' })
  })

  it('cierra sesión y limpia localStorage', () => {
    const auth = useAuthStore()
    auth.saveSession('token-123', { nombre: 'Ana', rol: 'admin' })

    auth.logout()

    expect(auth.token).toBe('')
    expect(auth.isAuthenticated).toBe(false)
    expect(auth.userName).toBe('')
    expect(auth.role).toBe('')
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('acepta el rol como objeto { id, nombre }', () => {
    localStorage.setItem('token', 'token-123')
    localStorage.setItem('user', JSON.stringify({ nombre: 'Cliente', rol: { id: 3, nombre: 'cliente' } }))

    const auth = useAuthStore()

    expect(auth.role).toBe('cliente')
  })

  it('recupera la sesión guardada al crear el store', () => {
    localStorage.setItem('token', 'token-guardado')
    localStorage.setItem('user', JSON.stringify({ nombre: 'Luis', role: 'bodeguero' }))
    setActivePinia(createPinia())

    const auth = useAuthStore()

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.userName).toBe('Luis')
    expect(auth.role).toBe('bodeguero')
  })
})
