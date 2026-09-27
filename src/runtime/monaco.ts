import type {EditorSchema} from '../types.ts'
import type {editor, IDisposable} from 'monaco-editor/editor/editor.api'

import * as monaco from 'monaco-editor'
import {createWebWorker} from 'monaco-editor/internal/common/workers'
import {jsonDefaults} from 'monaco-editor/languages/features/json/register'
import {configureMonacoYaml} from 'monaco-yaml'

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
    case 'yaml': {
      return import('./yaml.worker.ts?worker')
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
// This module is shared by every editor; register the providers only once.
// Monaco 0.57 moved the legacy worker factory/initialization handshake to this
// helper. Adapt only monaco-yaml rather than changing the shared editor API.
const yaml = configureMonacoYaml({
  ...monaco,
  editor: {
    ...monaco.editor,
    createWebWorker,
  },
}, {enableSchemaRequest: true})

type SchemaLanguage = 'json' | 'yaml'
type SchemaEntry = {
  id: number
  language: SchemaLanguage
  modelUri: string
  schema: EditorSchema
  schemaUri: string
}

const schemaEntries = new Map<number, SchemaEntry>
const schemaUriPrefix = 'monacozen://schema/'
let nextSchemaId = 1
let installedJsonSchemaUris = new Set<string>
let installedYamlSchemaUris = new Set<string>
let yamlUpdateVersion = 0
let yamlUpdateQueue = Promise.resolve()
const schemasFor = (language: SchemaLanguage) => schemaEntries.values().filter(entry => entry.language === language).toArray()
const syncJsonSchemas = () => {
  const current = jsonDefaults.diagnosticsOptions
  const externalSchemas = (current.schemas ?? []).filter(schema => !installedJsonSchemaUris.has(schema.uri))
  const schemas = schemasFor('json').map(entry => ({
    uri: entry.schemaUri,
    fileMatch: [entry.modelUri],
    schema: entry.schema,
  }))
  installedJsonSchemaUris = new Set(schemas.map(schema => schema.uri))
  jsonDefaults.setDiagnosticsOptions({
    ...current,
    enableSchemaRequest: true,
    schemas: [...externalSchemas, ...schemas],
  })
}
const syncYamlSchemas = () => {
  const version = ++yamlUpdateVersion
  const previousUpdate = yamlUpdateQueue
  yamlUpdateQueue = (async () => {
    await previousUpdate
    if (version !== yamlUpdateVersion) {
      return
    }
    const current = yaml.getOptions()
    const externalSchemas = (current.schemas ?? []).filter(schema => !installedYamlSchemaUris.has(schema.uri))
    const schemas = schemasFor('yaml').map(entry => ({
      uri: entry.schemaUri,
      fileMatch: [entry.modelUri],
      schema: entry.schema,
    }))
    installedYamlSchemaUris = new Set(schemas.map(schema => schema.uri))
    await yaml.update({schemas: [...externalSchemas, ...schemas]})
  })()
}
const syncSchemas = (language: SchemaLanguage) => {
  if (language === 'json') {
    syncJsonSchemas()
  } else {
    syncYamlSchemas()
  }
}
const getSchemaLanguage = (model: editor.ITextModel): SchemaLanguage | undefined => {
  const language = model.getLanguageId()
  if (language === 'json' || language === 'yaml') {
    return language
  }
}
const emptyDisposable = {dispose() {}}

export const registerModelSchema = (model: editor.ITextModel, schema: EditorSchema | undefined): IDisposable => {
  const language = getSchemaLanguage(model)
  if (!schema || !language) {
    return emptyDisposable
  }
  const id = nextSchemaId++
  const entry: SchemaEntry = {
    id,
    language,
    modelUri: model.uri.toString(),
    schema,
    schemaUri: `${schemaUriPrefix}${id}.json`,
  }
  schemaEntries.set(id, entry)
  syncSchemas(language)
  let disposed = false
  return {
    dispose() {
      if (disposed) {
        return
      }
      disposed = true
      schemaEntries.delete(id)
      syncSchemas(language)
    },
  }
}

export default monaco
