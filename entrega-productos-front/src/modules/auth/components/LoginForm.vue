<script setup>
import { IonButton, IonContent, IonInput, IonPage } from '@ionic/vue'
import { RouterLink } from 'vue-router'
import { MOCK_ACCOUNTS } from '../../../shared/api/mocks'
import { MENSAJE_SESION_VENCIDA } from '../config/sessionNotice'
import { useLogin } from '../composables/useLogin'

const {
  isMockMode,
  logoUrl,
  avisoSesionVencida,
  credentials,
  touched,
  errores,
  puedeEnviar,
  error,
  loading,
  avisoBoton,
  mostrarError,
  submit,
  usarCuenta,
} = useLogin()
</script>

<template>
  <IonPage>
    <IonContent>
      <div class="login-page">
        <form class="login-card" @submit.prevent="submit">
          <img :src="logoUrl" alt="Logo de Entrega de Productos" class="login-card__logo" />
          <h1>Iniciar sesión</h1>
          <p class="subtitle">Entrega de Productos</p>

          <div
            v-if="avisoSesionVencida"
            data-test="sesion-vencida"
            class="aviso-sesion"
            role="status"
            aria-live="polite"
          >
            <span>{{ MENSAJE_SESION_VENCIDA }}</span>
            <button
              type="button"
              class="aviso-sesion__cerrar"
              aria-label="Cerrar aviso de sesión vencida"
              @click="avisoSesionVencida = false"
            >
              ×
            </button>
          </div>

          <label>
            Correo o número de documento <span class="required">*</span>
            <IonInput
              v-model="credentials.correo"
              data-test="correo"
              type="text"
              autocomplete="username"
              placeholder="nombre@correo.com o documento"
              :aria-invalid="mostrarError('correo')"
              :aria-describedby="mostrarError('correo') ? 'error-correo' : undefined"
              @ion-blur="touched.correo = true"
            />
            <span v-if="mostrarError('correo')" id="error-correo" class="field-error">
              {{ errores.correo }}
            </span>
          </label>

          <label>
            Contraseña <span class="required">*</span>
            <IonInput
              v-model="credentials.contrasena"
              data-test="clave"
              type="password"
              autocomplete="current-password"
              placeholder="Mínimo 8 caracteres"
              :aria-invalid="mostrarError('contrasena')"
              :aria-describedby="mostrarError('contrasena') ? 'error-contrasena' : undefined"
              @ion-blur="touched.contrasena = true"
            />
            <span v-if="mostrarError('contrasena')" id="error-contrasena" class="field-error">
              {{ errores.contrasena }}
            </span>
          </label>

          <div v-if="error" class="error" role="alert">{{ error }}</div>

          <IonButton
            type="submit"
            data-test="ingresar"
            :disabled="!puedeEnviar"
            :title="avisoBoton || undefined"
          >
            {{ loading ? 'Ingresando...' : 'Ingresar' }}
          </IonButton>

          <p v-if="!puedeEnviar && !loading" class="hint hint--button">{{ avisoBoton }}</p>

          <p v-if="isMockMode && !loading" class="hint">
            Modo demo activo: elige un rol o escribe cualquier correo.
          </p>

          <div v-if="isMockMode && !loading" class="demo-accounts">
            <IonButton
              v-for="cuenta in MOCK_ACCOUNTS"
              :key="cuenta.correo"
              type="button"
              data-test="cuenta"
              class="demo-accounts__btn"
              @click="usarCuenta(cuenta)"
            >
              {{ cuenta.pista }}
            </IonButton>
          </div>

          <p class="register-link">
            ¿No tienes cuenta?
            <RouterLink :to="{ name: 'register' }">Regístrate aquí</RouterLink>
          </p>
        </form>
      </div>
    </IonContent>
  </IonPage>
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

/* Ionic pinta el input dentro de shadow DOM: se configuran variables CSS. */
ion-input {
  --background: #fff;
  --color: #1f2937;
  --placeholder-color: #9ca3af;
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 10px;
  --padding-bottom: 10px;
  --border-color: #d1d5db;
  --border-radius: 8px;
  --highlight-color-focused: #2563eb;
  min-height: 44px;
}

ion-input[aria-invalid='true'] {
  --border-color: #dc2626;
  --background: #fef2f2;
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

ion-button {
  --background: #2563eb;
  --color: #fff;
  --border-radius: 8px;
  --box-shadow: none;
  text-transform: none;
}

ion-button:disabled,
ion-button[disabled] {
  opacity: 0.6;
}

.aviso-sesion {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  color: #92400e;
  border-radius: 8px;
  padding: 10px;
  font-size: 0.85rem;
}

.aviso-sesion__cerrar {
  margin-left: auto;
  background: transparent;
  color: inherit;
  font-size: 1.1rem;
  line-height: 1;
  padding: 0 2px;
  cursor: pointer;
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
  --background: #eff6ff;
  --color: #1d4ed8;
  --border-color: #bfdbfe;
  --border-width: 1px;
  --border-style: solid;
  --border-radius: 999px;
  --box-shadow: none;
  font-size: 0.8rem;
  text-transform: none;
}

.register-link {
  margin: 4px 0 0;
  text-align: center;
  color: #6b7280;
  font-size: 0.85rem;
}

.register-link a {
  color: #1d4ed8;
  font-weight: 600;
}

@media (max-width: 480px) {
  .login-card {
    padding: 22px 18px;
  }

  .login-card__logo {
    width: 60px;
    height: 60px;
  }
}
</style>
