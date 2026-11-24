import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

/**
 * Accesibilidad mínima para modales:
 * - mueve el foco al panel cuando se abren,
 * - cierra con Escape,
 * - limpia el listener al desmontar.
 *
 * `isOpen` debe ser un Ref<boolean>. `close` es la función que lo pone en false.
 */
export function useModalA11y(isOpen, close) {
  const panelRef = ref(null)

  function onKeydown(event) {
    if (event.key !== 'Escape' || !isOpen.value) return
    event.preventDefault()
    close()
  }

  watch(
    isOpen,
    async (open) => {
      if (!open) return
      await nextTick()
      panelRef.value?.focus()
    },
    { immediate: true },
  )

  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', onKeydown)
    onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
  }

  return { panelRef }
}
