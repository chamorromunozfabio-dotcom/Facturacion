<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getErrorMessage, useAuthStore } from '../stores/auth'
import { MOCK_ACCOUNTS } from '../api/mocks'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const isMockMode = import.meta.env.VITE_USE_MOCKS === 'true'
const logoUrl = `${import.meta.env.BASE_URL}logo.png`

// Acordado con backend: POST /login con { correo, contrasena }
const credentials = ref({ correo: '', contrasena: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''

  if (!credentials.value.correo || !credentials.value.contrasena) {
    error.value = 'Ingresa correo y contraseña.'
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
        Correo electrónico
        <input v-model="credentials.correo" type="email" autocomplete="email" />
      </label>

      <label>
        Contraseña
        <input v-model="credentials.contrasena" type="password" autocomplete="current-password" />
      </label>

      <div v-if="error" class="error" role="alert">{{ error }}</div>

      <button type="submit" :disabled="loading">
        {{ loading ? 'Ingresando...' : 'Ingresar' }}
      </button>

      <p v-if="isMockMode && !loading" class="hint">
        Modo demo activo: elegí un rol o escribí cualquier correo.
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
  cursor: wait;
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
