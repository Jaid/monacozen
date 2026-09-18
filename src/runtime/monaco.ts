import * as monaco from 'monaco-editor'

const getWorkerModule = (label: string) => {
  switch (label) {
    case 'json': {
      return import('monaco-editor/languages/features/json/json.worker?worker')
    }
    case 'css':
    case 'scss':
    case 'less': {
      return import('monaco-editor/languages/features/css/css.worker?worker')
    }
    case 'html':
    case 'handlebars':
    case 'razor': {
      return import('monaco-editor/languages/features/html/html.worker?worker')
    }
    case 'typescript':
    case 'javascript': {
      return import('monaco-editor/languages/features/typescript/ts.worker?worker')
    }
    default: {
      return import('monaco-editor/editor/common/services/editorWebWorkerMain?worker')
    }
  }
}
const environment = globalThis.MonacoEnvironment
if (!environment?.getWorker && !environment?.getWorkerUrl) {
  globalThis.MonacoEnvironment = {
    ...environment,
    async getWorker(_id, label) {
      const {default: WorkerFactory} = await getWorkerModule(label)
      return new WorkerFactory({name: label})
    },
  }
}

export default monaco
