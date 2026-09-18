import type {DummyEditorProps} from '../types.ts'

import {useImperativeHandle, useLayoutEffect, useRef} from 'react'

import {fontOptions} from '../lib/options.ts'
import {useFont} from '../lib/useFont.ts'

const DummyEditor = ({dark = true, font = 'antimono', height = '100%', width = '100%', onChange, onMount, ref, style, wrapperProps, value, defaultValue, ...props}: DummyEditorProps) => {
  useFont(font)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mountCallback = useRef(onMount)
  useImperativeHandle(ref, () => inputRef.current!, [])
  useLayoutEffect(() => {
    if (inputRef.current) {
      mountCallback.current?.(inputRef.current)
    }
  }, [])
  const input = <textarea
    {...props}
    {...value === undefined ? {defaultValue} : {value}}
    spellCheck={props.spellCheck ?? false}
    style={{
      boxSizing: 'border-box',
      display: 'block',
      resize: 'none',
      border: 0,
      borderRadius: 0,
      margin: 0,
      padding: 0,
      fontSize: 14,
      lineHeight: '16px',
      tabSize: 2,
      height,
      width,
      ...style,
      backgroundColor: dark ? '#000' : '#fff',
      color: dark ? '#fff' : '#000',
      fontFamily: fontOptions[font].fontFamily,
    }}
    ref={inputRef}
    onChange={event => onChange?.(event.currentTarget.value, event)}
  />
  return wrapperProps ? <div {...wrapperProps}>{input}</div> : input
}

export default DummyEditor
