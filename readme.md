# monacozen

An opinionated React editor with a lazily loaded Monaco backend and a lightweight native alternative.

## Install

```sh
npm install monacozen
```

React and React DOM are peer dependencies. Monaco, its workers and Antimono are included in the built package. Use a browser bundler that supports CSS imports, dynamic imports and worker asset URLs. The production package is tested through a separate Vite consumer build.

## Monaco editor

```tsx
import Monacozen from 'monacozen'

<Monacozen
  language='typescript'
  monaco={{padding: {top: 6}, readOnly: false}}
  value={text}
  onChange={value => setText(value ?? '')}
/>
```

`monaco` replaces the former `options` prop. Omit it to use the shared defaults or pass an options object to override them. `fontFamily` and `disableMonospaceOptimizations` are excluded because the `font` prop controls them. Padding is not part of the shared defaults.

The existing Monaco props, including `beforeMount`, `onMount`, `onChange`, `onValidate`, model paths, language settings and view-state options, remain available in Monaco mode. Ordinary DOM events such as `onFocus`, `onBlur`, `onKeyDown`, `onPaste` and `onContextMenu` are handled on the enclosing element and bubble from the editor. `wrapperProps` provides additional wrapper attributes.

The common `readOnly`, `disabled`, `placeholder`, `autoFocus` and `aria-label` props work in both modes. Explicit common props take precedence over the corresponding Monaco options.

## Native editor

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

## Appearance

`dark` defaults to `true`. Monaco uses the bundled, modified `vs-dark` theme with a black background. `dark={false}` selects its light theme. The native editor uses white text on black or black text on white.

`font` defaults to `antimono` and also accepts `mono` for the system monospace font or `dense` for the system sans-serif font. Both backends support `height`, `width`, `className` and `style`.

## Loading

Importing Monacozen does not initialize Monaco or load either stylesheet. Rendering the Monaco backend starts the React adapter and Monaco imports concurrently. A Suspense boundary displays the `loading` prop while they load. Monaco's stylesheet belongs to its lazy chunks rather than the public entry, so it is fetched before the editor mounts.

Antimono has a separate stylesheet and lazy import. It is loaded only when a mounted editor selects `font='antimono'`, including when that selection comes from the default. Selecting `mono` or `dense` alone does not load it. Once the font finishes loading, mounted Monaco editors remeasure their font metrics.

Modules and styles are reused across instances and mode changes. Styles are not removed when a component unmounts. Language workers are constructed on demand; an existing `MonacoEnvironment` worker configuration is respected. Loading errors can be handled by the application's React error boundary.

## Additional languages

Set `language` to one of these IDs:

| ID | Language | Extension |
|---|---|---|
| `logsql` | VictoriaLogs LogsQL | `.logsql` |
| `metricsql` | VictoriaMetrics MetricsQL | `.metricsql` |
| `clank` | Clank, as emitted by `stringify-clank` | `.clank` |

Each definition has its own lazy chunk. Registration metadata is available when Monaco loads; the tokenizer and editor configuration load when that language is used.

The definitions provide syntax highlighting and basic editing configuration, not query execution, schema validation or a language server. LogsQL and MetricsQL cover their query operators, keywords, field or label names, calls, numeric values, durations, comments and quoted strings. Clank follows its whitespace-delimited format, including bare strings, special values, raw single-quoted strings and escaped double-quoted strings. It does not invent JSON commas, colons or comments.

The Monaco build continues to exclude `abap`, `apex`, `lexon`, `sb` and `flow9`.

## Build

```sh
bun install
bun run build
```

Vite compiles the JSX with React Compiler, produces `out/intermediate/src/main.js` and preserves lazy chunks and styles under `out/intermediate/assets`. `build_lib` packages that project without recombining its runtime chunks. The result is in `dist/monacozen/production`.

The intermediate plugin attaches CSS imports to the chunks that own them. Monaco CSS and Antimono CSS remain separate. Runtime files keep the same relative layout through both build stages, including worker URLs. Monaco's public declarations are inlined into `lib.d.ts`; consumers do not need a separate `monaco-editor` installation for types.

The workspace plugins handle intermediate packaging, built-in theme overrides, language omission and additional lazy language registration. Additional language modules export `{language, configuration}`, using Monaco's Monarch tokenizer and language-configuration types.

## Verification

```sh
bun run typecheck
bun run lint
bun run test
bun run test:browser
```

The browser test requires Chromium. It uses Chrome's standard Windows installation by default; set `CHROME_PATH` for another installation. It creates a clean consumer without `monaco-editor`, checks its types with strict library checking, builds it with Vite and verifies actual requests and editor behavior in Chromium.
