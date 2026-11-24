import api from '../../../shared/api/axios'
import { mockRegister } from '../../../shared/api/mocks'
import { resolveApiModes } from '../../../shared/config/apiModes'

const { authMocks } = resolveApiModes()

/**
 * Registro público de clientes y empresas.
 *
 * Contrato propuesto al backend:
 *   POST /register
 *   { tipo: 'cliente' | 'empresa', ...datos }
 *
 * El cliente recibe 201 y puede iniciar sesión. La empresa recibe 201 con
 * estado `pendiente` y solo podrá entrar cuando el admin la apruebe.
 */
export function registrar(payload) {
  if (authMocks) return mockRegister(payload)
  return api.post('/register', payload).then((response) => response.data)
}

export default registrar
