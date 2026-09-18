import type {EditorFont, MonacoOptions} from '../types.ts'
import type {editor} from 'monaco-editor/editor/editor.api'

export const fontOptions = {
  antimono: {
    disableMonospaceOptimizations: true,
    fontFamily: 'Antimono, monospace',
  },
  dense: {
    disableMonospaceOptimizations: true,
    fontFamily: 'sans-serif',
  },
  mono: {
    disableMonospaceOptimizations: false,
    fontFamily: 'monospace',
  },
} satisfies Record<EditorFont, Pick<editor.IStandaloneEditorConstructionOptions, 'disableMonospaceOptimizations' | 'fontFamily'>>
export const defaultOptions = {
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
export const resolveMonacoOptions = (font: EditorFont = 'antimono', monaco?: MonacoOptions | true) => ({
  ...defaultOptions,
  ...monaco === true ? {} : monaco,
  ...fontOptions[font],
})
