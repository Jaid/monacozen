declare module '*.css'
declare module 'monaco-editor/esm/vs/editor/editor.api' {
  export * from 'monaco-editor/editor/editor.api'
}
declare namespace JSX {
  type Element = import('react').JSX.Element
}
