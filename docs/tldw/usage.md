# Monaco editor

`monaco` replaces the former `options` prop. Omit it to use the shared defaults or pass an options object to override them. `fontFamily` and `disableMonospaceOptimizations` are excluded because the `font` prop controls them. Padding is not part of the shared defaults.

The existing Monaco props, including `beforeMount`, `onMount`, `onChange`, `onValidate`, model paths, language settings and view-state options, remain available in Monaco mode. Ordinary DOM events such as `onFocus`, `onBlur`, `onKeyDown`, `onPaste` and `onContextMenu` are handled on the enclosing element and bubble from the editor. `wrapperProps` provides additional wrapper attributes.

The common `readOnly`, `disabled`, `placeholder`, `autoFocus` and `aria-label` props work in both modes. Explicit common props take precedence over the corresponding Monaco options.

# native editor

```tsx
<Monacozen
  monaco={false}
  font='mono'
  name='query'
  placeholder='Enter text'
  value={text}
  onChange={value => setText(value)}
  onKeyDown={event => {
    if (event.key === 'Escape') event.currentTarget.blur()
  }}
/>
```

`monaco={false}` renders `DummyEditor`, a multiline `<textarea>`. It does not load Monaco JavaScript, Monaco CSS or workers. Native input props such as `name`, `required`, `maxLength`, `readOnly`, `disabled` and `ref` are supported.

The native component is also a named export:

```tsx
import {DummyEditor} from 'monacozen'

<DummyEditor defaultValue='Hello' onMount={textarea => textarea.select()} />
```

Native `onChange` receives `(value, event)`, with a string value and the actual React textarea change event. Native `onMount` receives the textarea itself. Focus, keyboard, input, selection, composition, clipboard, pointer, mouse and other native `on*` handlers are forwarded to that element. Monaco-only lifecycle callbacks are not synthesized for a textarea.

A dynamically selected mode is supported too:

```tsx
<Monacozen
  monaco={useMonaco ? {wordWrap: 'on'} : false}
  value={text}
  onChange={value => setText(value ?? '')}
/>
```

Uncontrolled text is retained when switching modes. For controlled input, keep supplying `value`. The callback types reflect the backend: a dynamically selected mode has a change-event union and an `onMount` callback that may receive either editor kind. Use `SwitchableEditorProps` when explicitly typing a dynamically selected mode.

# appearance

`dark` defaults to `true`. Monaco uses the bundled, modified `vs-dark` theme with a black background. `dark={false}` selects its light theme. The native editor uses white text on black or black text on white.

`font` defaults to `antimono` and also accepts `mono` for the system monospace font or `dense` for the system sans-serif font. Both backends support `height`, `width`, `className` and `style`.
