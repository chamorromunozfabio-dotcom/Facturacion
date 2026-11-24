<script setup>
import { ref } from 'vue'
import { scalePoint } from '../../modules/facturas/utils/signature'

/**
 * Lienzo para dibujar la firma con mouse o dedo.
 * No valida el formato PNG: eso lo hace `validateFirma()` en api/facturas.js.
 * Acá solo controlamos el tamaño máximo para no superar el límite del backend.
 */
const props = defineProps({
  modelValue: { type: String, default: '' },
  maxSizeKb: { type: Number, default: 500 },
})
const emit = defineEmits(['update:modelValue'])

const canvasRef = ref(null)
const drawing = ref(false)
const error = ref('')

let ctx = null

function context() {
  if (ctx) return ctx
  const canvas = canvasRef.value
  if (!canvas?.getContext) return null
  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#111827'
  }
  return ctx
}

function point(event) {
  const canvas = canvasRef.value
  const rect = canvas?.getBoundingClientRect?.() ?? { left: 0, top: 0, width: 0, height: 0 }
  const relativo = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  return scalePoint(relativo, canvas, rect)
}

function start(event) {
  const c = context()
  if (!c) return
  const p = point(event)
  c.beginPath()
  c.moveTo(p.x, p.y)
  drawing.value = true
  error.value = ''
}

function move(event) {
  if (!drawing.value) return
  const c = context()
  if (!c) return
  const p = point(event)
  c.lineTo(p.x, p.y)
  c.stroke()
}

function finish() {
  if (!drawing.value) return
  drawing.value = false

  const canvas = canvasRef.value
  if (!canvas?.toDataURL) return

  const dataUrl = canvas.toDataURL('image/png')
  if (dataUrl.length > props.maxSizeKb * 1024) {
    error.value = `La firma es demasiado grande (máximo ${props.maxSizeKb} KB).`
    return
  }

  error.value = ''
  emit('update:modelValue', dataUrl)
}

function clear() {
  const canvas = canvasRef.value
  const c = context()
  if (canvas && c) c.clearRect(0, 0, canvas.width, canvas.height)
  drawing.value = false
  error.value = ''
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="signature">
    <canvas
      ref="canvasRef"
      data-test="signature-canvas"
      role="img"
      aria-label="Área para dibujar la firma con el mouse o el dedo"
      width="480"
      height="180"
      @pointerdown.prevent="start"
      @pointermove.prevent="move"
      @pointerup.prevent="finish"
      @pointerleave="finish"
    ></canvas>

    <div class="signature__footer">
      <button data-test="signature-clear" type="button" class="btn" @click="clear">Limpiar</button>
      <p v-if="error" data-test="signature-error" class="error">{{ error }}</p>
      <p v-else-if="!modelValue" class="hint">Firma con el mouse o el dedo dentro del recuadro.</p>
      <img v-else data-test="signature-preview" :src="modelValue" alt="Firma dibujada" />
    </div>
  </div>
</template>

<style scoped>
.signature {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

canvas {
  width: 100%;
  height: 180px;
  border: 1px dashed #9ca3af;
  border-radius: 8px;
  background: #fff;
  touch-action: none;
  cursor: crosshair;
}

.signature__footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.hint {
  margin: 0;
  color: #6b7280;
  font-size: 0.85rem;
}

.error {
  margin: 0;
  color: #b91c1c;
  font-size: 0.85rem;
}

img {
  height: 48px;
  max-width: 180px;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
}

.btn {
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
}
</style>
