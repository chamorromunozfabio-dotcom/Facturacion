<script setup>
import { computed, onUnmounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import CampoNative from '../../../shared/ui/CampoNative.vue'
import { getErrorMessage } from '../../../shared/api/axios'
import { registrar } from '../api/register'
import {
  bloquearTecla,
  camposDe,
  erroresDelBackend,
  limpiarValor,
  payloadDe,
  puedeRegistrar,
  validarCampo,
} from '../utils/registro'

const router = useRouter()
const logoUrl = `${import.meta.env.BASE_URL}logo.png`

const tipo = ref('cliente')
const form = reactive({
  nombre: '',
  tipo_documento: 'CC',
  numero_documento: '',
  telefono: '',
  razon_social: '',
  nit: '',
  direccion: '',
  representante: '',
  correo: '',
  contrasena: '',
  confirmar: '',
})
const errores = reactive({})
const tocados = reactive({})
const intentado = ref(false)
const enviando = ref(false)
const errorGeneral = ref('')
const exito = ref(null)
let redirectTimer

const campos = computed(() => camposDe(tipo.value))
const puedeEnviar = computed(() => puedeRegistrar(tipo.value, form) && !enviando.value)

function limpiarErrores() {
  Object.keys(errores).forEach((clave) => delete errores[clave])
  Object.keys(tocados).forEach((clave) => delete tocados[clave])
}

function cambiarTipo(nuevo) {
  if (tipo.value === nuevo || enviando.value) return
  tipo.value = nuevo
  exito.value = null
  errorGeneral.value = ''
  intentado.value = false
  limpiarErrores()
  Object.assign(form, {
    nombre: '',
    tipo_documento: 'CC',
    numero_documento: '',
    telefono: '',
    razon_social: '',
    nit: '',
    direccion: '',
    representante: '',
    correo: '',
    contrasena: '',
    confirmar: '',
  })
}

function mostrarError(campo) {
  return (tocados[campo.key] || intentado.value) && Boolean(errores[campo.key])
}

function setValor(campo, valor) {
  form[campo.key] = limpiarValor(campo, valor)
  tocados[campo.key] = true
  const aviso = validarCampo(campo, form)
  if (aviso) errores[campo.key] = aviso
  else delete errores[campo.key]

  // Al cambiar la contraseña, la confirmación se revalida en vivo.
  if (campo.key === 'contrasena' && tocados.confirmar) {
    const confirmar = campos.value.find((item) => item.key === 'confirmar')
    const avisoConfirmar = validarCampo(confirmar, form)
    if (avisoConfirmar) errores.confirmar = avisoConfirmar
    else delete errores.confirmar
  }
}

async function submit() {
  intentado.value = true
  errorGeneral.value = ''
  if (!puedeRegistrar(tipo.value, form)) {
    for (const campo of campos.value) {
      const aviso = validarCampo(campo, form)
      if (aviso) errores[campo.key] = aviso
    }
    return
  }

  enviando.value = true
  try {
    const data = await registrar(payloadDe(tipo.value, form))
    exito.value = {
      tipo: tipo.value,
      mensaje:
        data?.message ??
        (tipo.value === 'empresa'
          ? 'Empresa registrada. Queda pendiente de aprobación.'
          : 'Cuenta creada. Ya puedes iniciar sesión.'),
      empresa: data?.empresa ?? null,
    }

    if (tipo.value === 'cliente') {
      // La notificación se ve un momento y luego vuelve al login.
      clearTimeout(redirectTimer)
      redirectTimer = window.setTimeout(
        () => router.push({ name: 'login', query: { registered: '1' } }),
        1200,
      )
    }
  } catch (e) {
    const delBackend = erroresDelBackend(e)
    if (Object.keys(delBackend).length) {
      Object.assign(errores, delBackend)
      // Si el backend señaló campos concretos, no repetimos el mismo texto
      // como error general: el aviso queda debajo de cada campo.
      errorGeneral.value = ''
    } else {
      errorGeneral.value = getErrorMessage(e)
    }
  } finally {
    enviando.value = false
  }
}

watch(tipo, () => {
  if (exito.value?.tipo !== tipo.value) exito.value = null
})

onUnmounted(() => clearTimeout(redirectTimer))
</script>

<template>
  <main class="register-page">
    <section class="register-card" aria-labelledby="register-title">
      <img :src="logoUrl" alt="Logo de Entrega de Productos" class="register-card__logo" />
      <h1 id="register-title">Crear cuenta</h1>
      <p class="subtitle">Entrega de Productos</p>

      <div v-if="exito" data-test="registro-exito" class="exito" role="status">
        <h2>
          {{ exito.tipo === 'empresa' ? 'Solicitud enviada' : '¡Cuenta creada!' }}
        </h2>
        <p>{{ exito.mensaje }}</p>

        <div v-if="exito.tipo === 'empresa'" data-test="empresa-pendiente" class="pendiente">
          <strong>Estado: Pendiente de aprobación</strong>
          <p>
            Podrás ingresar cuando un administrador active tu empresa. Te avisaremos al correo
            registrado.
          </p>
        </div>

        <RouterLink class="btn btn--primary" :to="{ name: 'login' }">
          Ir a iniciar sesión
        </RouterLink>
      </div>

      <template v-else>
        <div class="tipo-selector" role="tablist" aria-label="Tipo de cuenta">
          <button
            type="button"
            role="tab"
            data-test="tipo-cliente"
            :aria-selected="tipo === 'cliente'"
            :class="{ activo: tipo === 'cliente' }"
            @click="cambiarTipo('cliente')"
          >
            Soy Cliente
          </button>
          <button
            type="button"
            role="tab"
            data-test="tipo-empresa"
            :aria-selected="tipo === 'empresa'"
            :class="{ activo: tipo === 'empresa' }"
            @click="cambiarTipo('empresa')"
          >
            Soy Empresa
          </button>
        </div>

        <form class="register-form" novalidate @submit.prevent="submit">
          <div v-for="campo in campos" :key="campo.key" class="field">
            <label :for="`register-${campo.key}`">
              {{ campo.label }} <span class="required">*</span>
            </label>

            <select
              v-if="campo.type === 'select'"
              :id="`register-${campo.key}`"
              :data-test="`field-${campo.key}`"
              :value="form[campo.key] ?? ''"
              :aria-invalid="mostrarError(campo)"
              @change="setValor(campo, $event.target.value)"
            >
              <option v-for="option in campo.options" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>

            <CampoNative
              v-else
              :id="`register-${campo.key}`"
              :data-test="`field-${campo.key}`"
              :type="campo.type || 'text'"
              :model-value="form[campo.key] ?? ''"
              :placeholder="campo.placeholder || ''"
              :inputmode="campo.digitsOnly || campo.nitOnly ? 'numeric' : undefined"
              :aria-invalid="mostrarError(campo)"
              @update:model-value="setValor(campo, $event)"
              @keydown="bloquearTecla(campo, $event)"
            />

            <small v-if="mostrarError(campo)" :data-test="`error-${campo.key}`" class="field-error">
              {{ errores[campo.key] }}
            </small>
            <small v-else-if="campo.hint" :data-test="`hint-${campo.key}`" class="field-hint">
              {{ campo.hint }}
            </small>
          </div>

          <p v-if="errorGeneral" data-test="register-error" class="error" role="alert">
            {{ errorGeneral }}
          </p>

          <button data-test="registrar" type="submit" class="btn btn--primary" :disabled="!puedeEnviar">
            {{ enviando ? 'Creando cuenta...' : 'Crear cuenta' }}
          </button>
          <small v-if="!puedeEnviar && !enviando" data-test="register-hint" class="field-hint">
            Completa los campos marcados para registrarte.
          </small>
        </form>

        <p class="login-link">
          ¿Ya tienes cuenta?
          <RouterLink :to="{ name: 'login' }">Inicia sesión</RouterLink>
        </p>
      </template>
    </section>
  </main>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px 16px;
  background: linear-gradient(135deg, #1e3a8a, #2563eb);
}

.register-card {
  width: 100%;
  max-width: 560px;
  background: #fff;
  border-radius: 16px;
  padding: 28px 32px 32px;
  box-shadow: 0 20px 40px rgb(0 0 0 / 20%);
}

.register-card__logo {
  width: 64px;
  height: 64px;
  object-fit: contain;
  display: block;
  margin: 0 auto 8px;
}

h1 {
  margin: 0;
  text-align: center;
  font-size: 1.5rem;
}

.subtitle {
  margin: 4px 0 20px;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

.tipo-selector {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 4px;
  background: #f3f4f6;
  border-radius: 10px;
  margin-bottom: 18px;
}

.tipo-selector button {
  border: 0;
  background: transparent;
  border-radius: 8px;
  padding: 10px;
  font: inherit;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
}

.tipo-selector button.activo {
  background: #fff;
  color: #1d4ed8;
  box-shadow: 0 1px 4px rgb(0 0 0 / 12%);
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #374151;
}

.field input,
.field select {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 9px 10px;
  font: inherit;
  background: #fff;
}

.field input[aria-invalid='true'],
.field select[aria-invalid='true'] {
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

.field-hint {
  color: #6b7280;
  font-size: 0.75rem;
}

.btn {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 10px 14px;
  font: inherit;
  cursor: pointer;
  text-align: center;
  text-decoration: none;
}

.btn--primary {
  background: #2563eb;
  border-color: #2563eb;
  color: #fff;
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.error {
  margin: 0;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 10px;
  font-size: 0.85rem;
}

.exito {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
}

.exito h2 {
  margin: 0;
  font-size: 1.2rem;
}

.exito p {
  margin: 0;
  color: #4b5563;
}

.pendiente {
  text-align: left;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 12px;
  color: #92400e;
}

.pendiente p {
  margin-top: 4px;
  color: #92400e;
  font-size: 0.9rem;
}

.login-link {
  margin: 18px 0 0;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

.login-link a {
  color: #1d4ed8;
  font-weight: 600;
}

@media (max-width: 480px) {
  .register-card {
    padding: 22px 18px;
  }
}
</style>
