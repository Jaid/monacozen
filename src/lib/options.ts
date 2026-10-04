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
  guides: {
    indentation: false,
    bracketPairs: 'active',
  },
  largeFileOptimizations: false,
  lineHeight: 16,
  lineNumbers: 'off',
  minimap: {
    enabled: false,
  },
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
  autoSurround: 'never',
  acceptSuggestionOnEnter: 'off',
  suggest: {
    showWords: false,
  },
  autoClosingBrackets: 'never',
  autoClosingComments: 'never',
  autoClosingDelete: 'never',
  autoClosingQuotes: 'never',
  autoClosingOvertype: 'never',
  cursorSmoothCaretAnimation: 'explicit',
  mouseWheelZoom: true,
  copyWithSyntaxHighlighting: false,
  scrollOnMiddleClick: true,
  find: {
    seedSearchStringFromSelection: 'never',
  },
  wrappingIndent: 'deepIndent',
  wrappingStrategy: 'advanced',
  lightbulb: {
    enabled: 'off',
  },
  hover: {
    delay: 100,
  },
  maxTokenizationLineLength: 100_000,
  unicodeHighlight: {
    allowedCharacters: {
      '’': true,
      '•': true,
      '→': true,
      '✔': true,
      '“': true,
      '”': true,
      '¬': true,
      '≤': true,
      '≥': true,
      '≠': true,
      '°': true,
      '©': true,
    },
  },
} satisfies MonacoOptions
export const resolveMonacoOptions = (font: EditorFont = 'antimono', monaco?: MonacoOptions | true) => ({
  ...defaultOptions,
  ...monaco === true ? {} : monaco,
  ...fontOptions[font],
})
