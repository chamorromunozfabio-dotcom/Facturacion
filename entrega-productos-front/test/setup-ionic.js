import { vi } from 'vitest'

// Ionic Vue registra web components con shadow DOM. En jsdom no se hidratan,
// así que los reemplazamos por equivalentes livianos: los tests siguen usando
// `input[type=email]`, `setValue` y `aria-invalid` como antes.
vi.mock('@ionic/vue', async () => {
  const { defineComponent, h } = await import('vue')

  const simple = (tag, name) =>
    defineComponent({
      name,
      setup(_, { attrs, slots }) {
        return () => h(tag, attrs, slots.default?.())
      },
    })

  const IonInput = defineComponent({
    name: 'IonInput',
    inheritAttrs: false,
    props: {
      modelValue: { type: [String, Number], default: '' },
      type: { type: String, default: 'text' },
      placeholder: { type: String, default: undefined },
      autocomplete: { type: String, default: undefined },
    },
    emits: ['update:modelValue', 'ionBlur', 'ionInput'],
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          type: props.type,
          placeholder: props.placeholder,
          autocomplete: props.autocomplete,
          value: props.modelValue,
          onInput: (event) => {
            emit('update:modelValue', event.target.value)
            emit('ionInput', event)
          },
          onBlur: (event) => emit('ionBlur', event),
        })
    },
  })

  const IonButton = defineComponent({
    name: 'IonButton',
    inheritAttrs: false,
    props: {
      type: { type: String, default: 'button' },
      disabled: { type: Boolean, default: false },
    },
    setup(props, { attrs, slots }) {
      return () =>
        h(
          'button',
          { ...attrs, type: props.type, disabled: props.disabled },
          slots.default?.(),
        )
    },
  })

  return {
    IonicVue: { install() {} },
    IonApp: simple('div', 'IonApp'),
    IonPage: simple('div', 'IonPage'),
    IonContent: simple('div', 'IonContent'),
    IonInput,
    IonButton,
    IonIcon: simple('span', 'IonIcon'),
  }
})
