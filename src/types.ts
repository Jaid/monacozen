import type * as Monaco from 'monaco-editor/editor/editor.api'
import type {ChangeEvent, ComponentPropsWithoutRef, DOMAttributes, HTMLAttributes, ReactNode, Ref} from 'react'

export type EditorFont = 'antimono' | 'dense' | 'mono'
export type EditorAppearance = {
  dark?: boolean
  font?: EditorFont
  height?: number | string
  width?: number | string
}
export type MonacoApi = typeof Monaco
export type MonacoOptions = Omit<Monaco.editor.IStandaloneEditorConstructionOptions, 'disableMonospaceOptimizations' | 'fontFamily'>
export type MonacoEditorProps = EditorAppearance & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'defaultValue' | 'onChange'> & {
  autoFocus?: boolean
  beforeMount?: (monaco: MonacoApi) => void
  defaultLanguage?: string
  defaultPath?: string
  defaultValue?: string
  disabled?: boolean
  keepCurrentModel?: boolean
  language?: string
  line?: number
  loading?: ReactNode
  monaco?: MonacoOptions | true
  onChange?: (value: string | undefined, event: Monaco.editor.IModelContentChangedEvent) => void
  onMount?: (editor: Monaco.editor.IStandaloneCodeEditor, monaco: MonacoApi) => void
  onValidate?: (markers: Array<Monaco.editor.IMarker>) => void
  overrideServices?: Monaco.editor.IEditorOverrideServices
  path?: string
  placeholder?: string
  readOnly?: boolean
  saveViewState?: boolean
  value?: string
  wrapperProps?: HTMLAttributes<HTMLDivElement>
}
export type DummyEditorProps = EditorAppearance & Omit<ComponentPropsWithoutRef<'textarea'>, 'children' | 'defaultValue' | 'onChange' | 'value'> & {
  defaultValue?: string
  onChange?: (value: string, event: ChangeEvent<HTMLTextAreaElement>) => void
  onMount?: (input: HTMLTextAreaElement) => void
  ref?: Ref<HTMLTextAreaElement>
  value?: string
  wrapperProps?: HTMLAttributes<HTMLDivElement>
}
export type MonacozenProps = DummyEditorProps & {monaco: false} | MonacoEditorProps

export type SwitchableEditorProps = Omit<MonacoEditorProps, keyof DOMAttributes<HTMLDivElement> | 'monaco' | 'onMount'> & Omit<DOMAttributes<HTMLElement>, 'children' | 'onChange'> & {
  monaco: MonacoOptions | boolean
  onChange?: (value: string | undefined, event: ChangeEvent<HTMLTextAreaElement> | Monaco.editor.IModelContentChangedEvent) => void
  onMount?: (editor: HTMLTextAreaElement | Monaco.editor.IStandaloneCodeEditor, monaco?: MonacoApi) => void
}
