import type {editor} from 'monaco-editor/editor/editor.api'
import type {ReactNode} from 'react'

import 'antimono/css/antimono-static.css'

import {loader, Editor as MonacoEditor} from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

export type MonacozenProps = Omit<MonacoEditorProps, 'options' | 'theme'> & {
  dark?: boolean
  font?: 'antimono' | 'dense' | 'mono'
  options?: Omit<MonacoOptions, 'disableMonospaceOptimizations' | 'fontFamily'>
}

type Monaco = typeof import('monaco-editor/editor/editor.api')
type MonacoOptions = editor.IStandaloneEditorConstructionOptions
type MonacoEditorProps = {
  beforeMount?: (monaco: Monaco) => void
  className?: string
  defaultLanguage?: string
  defaultPath?: string
  defaultValue?: string
  height?: number | string
  keepCurrentModel?: boolean
  language?: string
  line?: number
  loading?: ReactNode
  onChange?: (value: string | undefined, event: editor.IModelContentChangedEvent) => void
  onMount?: (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => void
  onValidate?: (markers: Array<editor.IMarker>) => void
  options?: MonacoOptions
  overrideServices?: editor.IEditorOverrideServices
  path?: string
  saveViewState?: boolean
  theme?: string
  value?: string
  width?: number | string
  wrapperProps?: object
}

const defaultOptions = {
  accessibilitySupport: 'off',
  contextmenu: true,
  dragAndDrop: false,
  folding: false,
  fontSize: 14,
  guides: {indentation: false},
  largeFileOptimizations: false,
  lineHeight: 16,
  lineNumbers: 'off',
  minimap: {enabled: false},
  overviewRulerBorder: false,
  renderControlCharacters: true,
  renderLineHighlight: 'none',
  renderWhitespace: 'trailing',
  scrollbar: {
    horizontal: 'auto',
    vertical: 'auto',
  },
  stickyScroll: {enabled: false},
  tabSize: 2,
  wordWrap: 'on',
} satisfies MonacoOptions
const fontOptions = {
  antimono: {
    disableMonospaceOptimizations: true,
    fontFamily: 'Antimono',
  },
  dense: {
    disableMonospaceOptimizations: true,
    fontFamily: 'sans-serif',
  },
  mono: {
    disableMonospaceOptimizations: false,
    fontFamily: 'monospace',
  },
} satisfies Record<NonNullable<MonacozenProps['font']>, Pick<MonacoOptions, 'disableMonospaceOptimizations' | 'fontFamily'>>
loader.config({monaco})
const Monacozen = ({dark = true, font = 'antimono', options, ...props}: MonacozenProps) => {
  return <MonacoEditor
    {...props}
    options={{
      ...defaultOptions,
      ...options,
      ...fontOptions[font],
    }}
    theme={dark ? 'vs-dark' : 'vs'}
  />
}

export default Monacozen
