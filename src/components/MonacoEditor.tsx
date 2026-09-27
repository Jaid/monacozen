import type {MonacoApi, MonacoEditorProps} from '../types.ts'
import type {editor, IDisposable} from 'monaco-editor/editor/editor.api'

import {lazy, Suspense, useEffect, useRef} from 'react'

import {resolveMonacoOptions} from '../lib/options.ts'
import {useFont} from '../lib/useFont.ts'

type RegisterModelSchema = typeof import('../runtime/monaco.ts').registerModelSchema

let registerModelSchema: RegisterModelSchema | undefined
const LazyEditor = lazy(async () => {
  const [{Editor, loader}, runtime] = await Promise.all([
    import('@monaco-editor/react'),
    import('../runtime/monaco.ts'),
  ])
  registerModelSchema = runtime.registerModelSchema
  loader.config({monaco: runtime.default})
  return {default: Editor}
})
const MonacoEditor = ({dark = true, font = 'antimono', height = '100%', width = '100%', schema, monaco, autoFocus, disabled, readOnly, placeholder, beforeMount, defaultLanguage, defaultPath, defaultValue, keepCurrentModel, language, line, loading = 'Loading…', onChange, onMount, onValidate, overrideServices, path, saveViewState, value, wrapperProps, style, ...events}: MonacoEditorProps) => {
  const fontReady = useFont(font)
  const schemaRef = useRef(schema)
  const instance = useRef<{
    editor: editor.IStandaloneCodeEditor
    monaco: MonacoApi
    refreshSchema: () => void
  } | null>(null)
  useEffect(() => {
    if (fontReady) {
      instance.current?.monaco.editor.remeasureFonts()
    }
  }, [fontReady, font])
  useEffect(() => {
    schemaRef.current = schema
    instance.current?.refreshSchema()
  }, [schema])
  const options = resolveMonacoOptions(font, {
    ...monaco === true ? {} : monaco,
    ...readOnly === undefined ? {} : {readOnly},
    ...disabled ? {
      readOnly: true,
      domReadOnly: true,
    } : {},
    ...placeholder === undefined ? {} : {placeholder},
    ...events['aria-label'] === undefined ? {} : {ariaLabel: events['aria-label']},
  })
  return <div
    {...wrapperProps} {...events} style={{
      ...wrapperProps?.style,
      width,
      height,
      ...style,
    }}
  >
    <Suspense fallback={loading}>
      <LazyEditor
        beforeMount={beforeMount}
        defaultLanguage={defaultLanguage}
        defaultPath={defaultPath}
        defaultValue={defaultValue}
        height='100%'
        keepCurrentModel={keepCurrentModel}
        language={language}
        line={line}
        loading={loading}
        options={options}
        overrideServices={overrideServices}
        path={path}
        saveViewState={saveViewState}
        theme={dark ? 'vs-dark' : 'vs'}
        value={value}
        width='100%'
        onChange={onChange}
        onMount={(editor, monacoApi) => {
          let schemaRegistration: IDisposable | undefined
          const refreshSchema = () => {
            schemaRegistration?.dispose()
            const model = editor.getModel()
            schemaRegistration = model ? registerModelSchema?.(model, schemaRef.current) : undefined
          }
          instance.current = {
            editor,
            monaco: monacoApi,
            refreshSchema,
          }
          refreshSchema()
          const modelChanged = editor.onDidChangeModel(refreshSchema)
          const languageChanged = monacoApi.editor.onDidChangeModelLanguage(({model}) => {
            if (model === editor.getModel()) {
              refreshSchema()
            }
          })
          if (fontReady) {
            monacoApi.editor.remeasureFonts()
          }
          if (autoFocus) {
            editor.focus()
          }
          const disposed = editor.onDidDispose(() => {
            schemaRegistration?.dispose()
            modelChanged.dispose()
            languageChanged.dispose()
            if (instance.current?.editor === editor) {
              instance.current = null
            }
            disposed.dispose()
          })
          onMount?.(editor, monacoApi)
        }}
        onValidate={onValidate}
      />
    </Suspense>
  </div>
}

export default MonacoEditor
