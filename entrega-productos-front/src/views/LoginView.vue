<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getErrorMessage, useAuthStore } from '../stores/auth'
import { MOCK_ACCOUNTS } from '../api/mocks'
import { resolveApiModes } from '../config/apiModes'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const isMockMode = resolveApiModes().authMocks
const logoUrl = `${import.meta.env.BASE_URL}logo.png`

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 8

// Acordado con backend: POST /login con { correo, contrasena }
const credentials = ref({ correo: '', contrasena: '' })
const touched = ref({ correo: false, contrasena: false })
const intentado = ref(false)
const error = ref('')
const loading = ref(false)

/** Un mensaje por campo: el usuario sabe cuál corregir sin adivinar. */
const errores = computed(() => ({
  correo: !credentials.value.correo.trim()
    ? 'El correo es obligatorio.'
    : !EMAIL_RE.test(credentials.value.correo.trim())
      ? 'Ingresa un correo válido (ejemplo: nombre@correo.com).'
      : '',
  contrasena: !credentials.value.contrasena
    ? 'La contraseña es obligatoria.'
    : credentials.value.contrasena.length < MIN_PASSWORD
      ? `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`
      : '',
}))

const puedeEnviar = computed(
  () => !errores.value.correo && !errores.value.contrasena && !loading.value,
)

const avisoBoton = computed(() => {
  if (loading.value || puedeEnviar.value) return ''
  if (!credentials.value.correo.trim() || !credentials.value.contrasena) {
    return 'Completa correo y contraseña para continuar.'
  }
  return 'Corrige los campos marcados para continuar.'
})

function mostrarError(campo) {
  return (touched.value[campo] || intentado.value) && Boolean(errores.value[campo])
}

async function submit() {
  intentado.value = true
  error.value = ''

  if (!credentials.value.correo || !credentials.value.contrasena) {
    error.value = 'Ingresa correo y contraseña.'
    return
  }
  if (!puedeEnviar.value) {
    error.value = 'Corrige los campos marcados para continuar.'
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
</script>

<template>
  <div class="login-page">
    <form class="login-card" @submit.prevent="submit">
      <img :src="logoUrl" alt="Logo de Entrega de Productos" class="login-card__logo" />
      <h1>Iniciar sesión</h1>
      <p class="subtitle">Entrega de Productos</p>

      <label>
        Correo electrónico <span class="required">*</span>
        <input
          v-model="credentials.correo"
          type="email"
          autocomplete="email"
          placeholder="nombre@correo.com"
          :aria-invalid="mostrarError('correo')"
          :aria-describedby="mostrarError('correo') ? 'error-correo' : undefined"
          @blur="touched.correo = true"
        />
        <span v-if="mostrarError('correo')" id="error-correo" class="field-error">
          {{ errores.correo }}
        </span>
      </label>

      <label>
        Contraseña <span class="required">*</span>
        <input
          v-model="credentials.contrasena"
          type="password"
          autocomplete="current-password"
          placeholder="Mínimo 8 caracteres"
          :aria-invalid="mostrarError('contrasena')"
          :aria-describedby="mostrarError('contrasena') ? 'error-contrasena' : undefined"
          @blur="touched.contrasena = true"
        />
        <span v-if="mostrarError('contrasena')" id="error-contrasena" class="field-error">
          {{ errores.contrasena }}
        </span>
      </label>

      <div v-if="error" class="error" role="alert">{{ error }}</div>

      <button type="submit" :disabled="!puedeEnviar" :title="avisoBoton || undefined">
        {{ loading ? 'Ingresando...' : 'Ingresar' }}
      </button>

      <p v-if="!puedeEnviar && !loading" class="hint hint--button">{{ avisoBoton }}</p>

      <p v-if="isMockMode && !loading" class="hint">
        Modo demo activo: elige un rol o escribe cualquier correo.
      </p>

      <div v-if="isMockMode && !loading" class="demo-accounts">
        <button
          v-for="cuenta in MOCK_ACCOUNTS"
          :key="cuenta.correo"
          type="button"
          class="demo-accounts__btn"
          @click="usarCuenta(cuenta)"
        >
          {{ cuenta.pista }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 20px 40px rgb(0 0 0 / 20%);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-card__logo {
  width: 72px;
  height: 72px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

h1 {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
}

.subtitle {
  margin: -8px 0 8px;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.9rem;
  font-weight: 600;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
}

input:focus {
  outline: 2px solid #93c5fd;
  border-color: #2563eb;
}

input[aria-invalid='true'] {
  border-color: #dc2626;
  background: #fef2f2;
}

.required {
  color: #dc2626;
}

.field-error {
  color: #b91c1c;
  font-size: 0.78rem;
  font-weight: 500;
}

.hint--button {
  color: #b45309;
}

button {
  background: #2563eb;
  color: #fff;
  border: 0;
  border-radius: 8px;
  padding: 11px;
  font-weight: 600;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px;
  font-size: 0.85rem;
}

.hint {
  margin: 0;
  text-align: center;
  color: #9ca3af;
  font-size: 0.75rem;
}

.demo-accounts {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.demo-accounts__btn {
  background: #eff6ff;
  color: #1d4ed8;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 6px 12px;
  font-size: 0.8rem;
  font-weight: 600;
}

.demo-accounts__btn:hover {
  background: #dbeafe;
}
</style>
