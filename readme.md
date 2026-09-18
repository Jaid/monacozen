# monacozen

An opinionated React wrapper around Monaco Editor.

## Install

```sh
npm install monacozen
```

## Usage

```tsx
import Monacozen from 'monacozen'

<Monacozen
  value={text}
  onChange={value => setText(value ?? '')}
/>
```

Monacozen loads Monaco locally, bundles Antimono and applies a compact set of editor defaults. It defaults to the custom black theme and Antimono.

Set `dark={false}` to use Monaco’s light theme.

The `font` prop accepts `antimono`, `mono` or `dense`. `antimono` is the default. Monaco’s `fontFamily` and `disableMonospaceOptimizations` options are controlled by this prop and therefore omitted from `options`.

Other `@monaco-editor/react` props are forwarded.
