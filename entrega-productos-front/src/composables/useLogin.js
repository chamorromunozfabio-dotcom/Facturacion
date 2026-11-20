import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getErrorMessage, useAuthStore } from '../stores/auth'
import { resolveApiModes } from '../config/apiModes'
import { avisoSesionVencida, prepararAvisoSesionVencida } from '../config/sessionNotice'
import { avisoBoton, mensajeValidacion, puedeEnviar, validarCredenciales } from '../utils/login'

/**
 * Estado y acciones de la pantalla de ingreso.
 * La presentación vive en components/auth/LoginForm.vue; las reglas puras, en utils/login.js.
 */
export function useLogin() {
  const auth = useAuthStore()
  const route = useRoute()
  const router = useRouter()
  const isMockMode = resolveApiModes().authMocks
  const logoUrl = `${import.meta.env.BASE_URL}logo.png`

  // Recogemos el aviso que dejó el 401. Se limpia al entrar al login.
  prepararAvisoSesionVencida()

  // Acordado con backend: POST /login con { correo, contrasena }
  const credentials = ref({ correo: '', contrasena: '' })
  const touched = ref({ correo: false, contrasena: false })
  const intentado = ref(false)
  const error = ref('')
  const loading = ref(false)

  const errores = computed(() => validarCredenciales(credentials.value))
  const listo = computed(() => puedeEnviar(errores.value, loading.value))
  const avisoBotonTexto = computed(() =>
    avisoBoton(credentials.value, errores.value, listo.value, loading.value),
  )

  function mostrarError(campo) {
    return (touched.value[campo] || intentado.value) && Boolean(errores.value[campo])
  }

  async function submit() {
    intentado.value = true
    error.value = ''

    if (!credentials.value.correo || !credentials.value.contrasena) {
      error.value = mensajeValidacion(credentials.value)
      return
    }
    if (!listo.value) {
      error.value = mensajeValidacion(credentials.value)
      return
    }

    loading.value = true
    try {
      await auth.login({ ...credentials.value })
      await router.push(route.query.redirect || '/')
    } catch (e) {
      error.value = getErrorMessage(e)
    } finally {
      loading.value = false
    }
  }

  function usarCuenta(cuenta) {
    credentials.value = { correo: cuenta.correo, contrasena: cuenta.contrasena }
    touched.value = { correo: true, contrasena: true }
    intentado.value = false
    error.value = ''
  }

  return {
    auth,
    isMockMode,
    logoUrl,
    avisoSesionVencida,
    credentials,
    touched,
    errores,
    puedeEnviar: listo,
    intentado,
    error,
    loading,
    avisoBoton: avisoBotonTexto,
    mostrarError,
    submit,
    usarCuenta,
  }
}
