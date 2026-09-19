<center><a href="https://npmjs.com/package/monacozen"><img src="https://shieldcn.dev/npm/v/monacozen.svg?variant=secondary&logo=npm&label=latest+version" alt="Latest version on npm"/></a> <a href="https://github.com/Jaid/monacozen/raw/HEAD/license.txt"><img src="https://shieldcn.dev/github/license/Jaid/monacozen.svg?variant=secondary" alt="License"/></a> <a href="https://bun.sh"><picture><source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/badge/Bun-fbf0df.svg?variant=outline&logo=bun&logoColor=fbf0df&mode=dark"><img src="https://shieldcn.dev/badge/Bun-fbf0df.svg?variant=outline&logo=bun&logoColor=fbf0df&mode=light" alt="Bun"/></picture></a></center>

# Monacozen

text editor component with batteries included and UI clutter removed

## installation

<a href="https://npmjs.com/package/monacozen"><img src="https://shieldcn.dev/badge/npm-monacozen-C23039.svg?variant=secondary&logo=npm" alt="monacozen on npm"/></a>

```sh
npm install --save monacozen
```

## example

```tsx
import {useState} from 'react'
import Monacozen from 'monacozen'

const [text, setText] = useState<string>('')

<Monacozen
  language='typescript'
  value={text}
  onChange={value => setText(value ?? '')}
/>
```

## usage

### Monaco editor

`monaco` replaces the former `options` prop. Omit it to use the shared defaults or pass an options object to override them. `fontFamily` and `disableMonospaceOptimizations` are excluded because the `font` prop controls them. Padding is not part of the shared defaults.

The existing Monaco props, including `beforeMount`, `onMount`, `onChange`, `onValidate`, model paths, language settings and view-state options, remain available in Monaco mode. Ordinary DOM events such as `onFocus`, `onBlur`, `onKeyDown`, `onPaste` and `onContextMenu` are handled on the enclosing element and bubble from the editor. `wrapperProps` provides additional wrapper attributes.

The common `readOnly`, `disabled`, `placeholder`, `autoFocus` and `aria-label` props work in both modes. Explicit common props take precedence over the corresponding Monaco options.

### native editor

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

### appearance

`dark` defaults to `true`. Monaco uses the bundled, modified `vs-dark` theme with a black background. `dark={false}` selects its light theme. The native editor uses white text on black or black text on white.

`font` defaults to `antimono` and also accepts `mono` for the system monospace font or `dense` for the system sans-serif font. Both backends support `height`, `width`, `className` and `style`.

## advanced usage

### loading

Importing Monacozen does not initialize Monaco or load either stylesheet. Rendering the Monaco backend starts the React adapter and Monaco imports concurrently. A Suspense boundary displays the `loading` prop while they load. Monaco’s stylesheet belongs to its lazy chunks rather than the public entry, so it is fetched before the editor mounts.

Antimono has a separate stylesheet and lazy import. It is loaded only when a mounted editor selects `font='antimono'`, including when that selection comes from the default. Selecting `mono` or `dense` alone does not load it. Once the font finishes loading, mounted Monaco editors remeasure their font metrics.

Modules and styles are reused across instances and mode changes. Styles are not removed when a component unmounts. Language workers are constructed on demand; an existing `MonacoEnvironment` worker configuration is respected. Loading errors can be handled by the application’s React error boundary.

### additional languages

Set `language` to one of these IDs:

| ID | Language | Extension |
|---|---|---|
| `logsql` | VictoriaLogs LogsQL | `.logsql` |
| `metricsql` | VictoriaMetrics MetricsQL | `.metricsql` |
| `clank` | Clank, as emitted by `stringify-clank` | `.clank` |

Each definition has its own lazy chunk. Registration metadata is available when Monaco loads; the tokenizer and editor configuration load when that language is used.

The definitions provide syntax highlighting and basic editing configuration, not query execution, schema validation or a language server. LogsQL and MetricsQL cover their query operators, keywords, field or label names, calls, numeric values, durations, comments and quoted strings. Clank follows its whitespace-delimited format, including bare strings, special values, raw single-quoted strings and escaped double-quoted strings. It does not invent JSON commas, colons or comments.

The Monaco build continues to exclude `abap`, `apex`, `lexon`, `sb` and `flow9`.

## props

option | type | default | info
--- | --- | --- | ---
`className` | `string` |  | class name for the active editor element or Monaco wrapper
`aria-label` | `string` |  | accessible label for both backends; mapped to Monaco’s ariaLabel option
`autoFocus` | `boolean` | `false` | Focuses the active editor after mounting.
`beforeMount` | `(monaco: MonacoApi) => void` |  | callback after Monaco loads and before editor creation
`dark` | `boolean` | `true` | dark or light appearance
`defaultLanguage` | `string` |  | language for newly created Monaco models
`defaultPath` | `string` |  | path for newly created Monaco models
`defaultValue` | `string` | `''` | initial value for uncontrolled usage and backend switching
`disabled` | `boolean` | `false` | Disables editing; Monaco also receives domReadOnly.
`font` | `'antimono' \| 'dense' \| 'mono'` | `'antimono'` | Antimono, system sans-serif or system monospace font
`height` | `number \| string` | `'100%'`
`keepCurrentModel` | `boolean` | `false` | Keeps the current Monaco model alive after unmounting.
`language` | `string` |  | current Monaco model language
`line` | `number` |  | line to reveal in Monaco
`loading` | `ReactNode` | `'Loading…'` | Suspense fallback while the Monaco backend loads
`monaco` | `MonacoOptions \| boolean` |  | Omit for the Monaco backend with shared defaults; false uses DummyEditor and true is shorthand for an empty Monaco options object.
`overrideServices` | `Monaco.editor.IEditorOverrideServices` | `{}` | Monaco editor service overrides passed to [@monaco-editor/react](https://npmx.dev/package/@monaco-editor/react)
`path` | `string` |  | current Monaco model path
`placeholder` | `string` |  | placeholder text supported by both backends
`readOnly` | `boolean` | `false` | editor read-only state
`saveViewState` | `boolean` | `true` | Saves and restores Monaco model view state between model changes.
`style` | `CSSProperties` |  | inline styles applied after the width and height defaults
`value` | `string` |  | controlled editor value
`width` | `number \| string` | `'100%'`
`wrapperProps` | `HTMLAttributes<HTMLDivElement>` |  | attributes for the enclosing wrapper element
`ref` | `Ref<HTMLTextAreaElement>` |  | native textarea ref when monaco is false
`onChange` | `(value: string \| undefined, event: ChangeEvent<HTMLTextAreaElement> \| Monaco.editor.IModelContentChangedEvent) => void` |  | Called when the editor value changes; the native backend always provides a string.
`onMount` | `(editor: HTMLTextAreaElement \| Monaco.editor.IStandaloneCodeEditor, monaco?: MonacoApi) => void` |  | Called after the active backend mounts.
`onValidate` | `(markers: Monaco.editor.IMarker[]) => void` |  | callback when validation markers for the current model change

## development

### setting up

```sh
git clone git@github.com:Jaid/monacozen.git
cd monacozen
bun install
```

### linting

```sh
bun run lint
```

### type checking

```sh
bun run typecheck
```

### testing

```sh
bun run test
```

## license

[MIT License](https://github.com/Jaid/monacozen/raw/HEAD/license.txt)<br>
Copyright © 2026, Jaid \<jaid.jsx@gmail.com> (https://github.com/jaid)

<!---
Readme generated with tldw v8.0.3 from ./docs/tldw
https://github.com/Jaid/tldw
-->
