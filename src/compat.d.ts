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
// Narrow types for the pinned Monaco runtime's completion bridge.
declare module 'monaco-editor/editor/common/services/languageFeatures' {
  export const ILanguageFeaturesService: unique symbol
}
declare module 'monaco-editor/editor/standalone/browser/standaloneServices' {
  export const StandaloneServices: {
    get: (service: typeof import('monaco-editor/editor/common/services/languageFeatures').ILanguageFeaturesService) => {
      completionProvider: {
        ordered: (model: import('monaco-editor/editor/editor.api').editor.ITextModel) => Array<import('monaco-editor/editor/editor.api').languages.CompletionItemProvider>
      }
    }
  }
}
declare module 'monaco-editor/editor/contrib/snippet/browser/snippetParser' {
  export class SnippetParser {
    parse(value: string): {toString: () => string}
  }
}
