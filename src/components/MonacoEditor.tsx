import type {MonacoApi, MonacoEditorProps} from '../types.ts'
import type {editor} from 'monaco-editor/editor/editor.api'

import {lazy, Suspense, useEffect, useRef} from 'react'

import {resolveMonacoOptions} from '../lib/options.ts'
import {useFont} from '../lib/useFont.ts'

const LazyEditor = lazy(async () => {
  const [{Editor, loader}, {default: monaco}] = await Promise.all([
    import('@monaco-editor/react'),
    import('../runtime/monaco.ts'),
  ])
  loader.config({monaco})
  return {default: Editor}
})
const MonacoEditor = ({dark = true, font = 'antimono', height = '100%', width = '100%', monaco, autoFocus, disabled, readOnly, placeholder, beforeMount, defaultLanguage, defaultPath, defaultValue, keepCurrentModel, language, line, loading = 'Loading…', onChange, onMount, onValidate, overrideServices, path, saveViewState, value, wrapperProps, style, ...events}: MonacoEditorProps) => {
  const fontReady = useFont(font)
  const instance = useRef<{
    editor: editor.IStandaloneCodeEditor
    monaco: MonacoApi
  } | null>(null)
  useEffect(() => {
    if (fontReady) {
      instance.current?.monaco.editor.remeasureFonts()
    }
  }, [fontReady, font])
  const options = resolveMonacoOptions(font, {
    ...monaco,
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
          instance.current = {
            editor,
            monaco: monacoApi,
          }
          if (fontReady) {
            monacoApi.editor.remeasureFonts()
          }
          if (autoFocus) {
            editor.focus()
          }
          const disposed = editor.onDidDispose(() => {
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
