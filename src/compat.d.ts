declare module '*.css'
declare module 'monaco-editor/esm/vs/editor/editor.api' {
  export * from 'monaco-editor/editor/editor.api'
}
declare namespace JSX {
  type Element = import('react').JSX.Element
}
declare module '*?worker' {
  const WorkerFactory: new (options?: WorkerOptions) => Worker
  export default WorkerFactory
}
// The helper retains the worker options expected by monaco-yaml.
declare module 'monaco-editor/internal/common/workers' {
  export function createWebWorker<T extends object>(options: {
    createData?: unknown
    label?: string
    moduleId: string
  }): import('monaco-editor/editor/editor.api').editor.MonacoWebWorker<T>
}
