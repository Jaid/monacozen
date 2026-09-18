import type {DummyEditorProps, MonacoEditorProps, MonacozenProps, SwitchableEditorProps} from './types.ts'
import type {JSX} from 'react'

import {useState} from 'react'

import DummyEditor from './components/DummyEditor.tsx'
import MonacoEditor from './components/MonacoEditor.tsx'

export {default as DummyEditor} from './components/DummyEditor.tsx'
export type {DummyEditorProps, EditorFont, MonacoApi, MonacoEditorProps, MonacoOptions, MonacozenProps, SwitchableEditorProps} from './types.ts'

function Monacozen(props: DummyEditorProps & {monaco: false}): JSX.Element
function Monacozen(props: MonacoEditorProps): JSX.Element
function Monacozen(props: SwitchableEditorProps): JSX.Element
function Monacozen(props: MonacozenProps | SwitchableEditorProps): JSX.Element {
  const [defaultValue, setDefaultValue] = useState(props.defaultValue ?? '')
  if (props.monaco === false) {
    const {monaco, beforeMount, defaultLanguage, defaultPath, keepCurrentModel, language, line, loading, onValidate, overrideServices, path, saveViewState, ...dummyProps} = props as DummyEditorProps & Partial<Omit<MonacoEditorProps, 'monaco' | 'onChange' | 'onMount'>> & {monaco: false}
    return <DummyEditor
      {...dummyProps} defaultValue={defaultValue} onChange={(value, event) => {
        setDefaultValue(value)
        props.onChange?.(value, event)
      }}
    />
  }
  return <MonacoEditor
    {...props} defaultValue={defaultValue} monaco={props.monaco} onChange={(value, event) => {
      setDefaultValue(value ?? '')
      props.onChange?.(value, event)
    }}
  />
}

export default Monacozen
