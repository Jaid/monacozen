import {describe, expect, test} from 'bun:test'

import {renderToStaticMarkup} from 'react-dom/server'

import {resolveMonacoOptions} from '../src/lib/options.ts'
import Monacozen, {DummyEditor} from '../src/main.tsx'

describe('Monacozen', () => {
  test('merges Monaco options and keeps the font settings authoritative', () => {
    expect(resolveMonacoOptions('mono', {
      padding: {top: 6},
      fontSize: 18,
    })).toMatchObject({
      fontFamily: 'monospace',
      disableMonospaceOptimizations: false,
      fontSize: 18,
      padding: {top: 6},
    })
    expect(resolveMonacoOptions()).not.toHaveProperty('padding')
  })
  test('renders a native input without loading Monaco', () => {
    const html = renderToStaticMarkup(<Monacozen aria-label='Text' defaultValue='hello' font='mono' monaco={false} />)
    expect(html).toContain('<textarea')
    expect(html).toContain('hello</textarea>')
    expect(html).toContain('background-color:#000')
    expect(html).toContain('color:#fff')
    expect(html).not.toContain('monaco-editor')
  })
  test('supports light mode, native attributes and proportional text', () => {
    const html = renderToStaticMarkup(<DummyEditor dark={false} font='dense' name='query' placeholder='Enter text' readOnly value='read only' />)
    expect(html).toContain('background-color:#fff')
    expect(html).toContain('color:#000')
    expect(html).toContain('font-family:sans-serif')
    expect(html).toContain('readOnly=""')
    expect(html).toContain('name="query"')
  })
  test('preserves the Antimono default', () => {
    expect(resolveMonacoOptions()).toMatchObject({disableMonospaceOptimizations: true})
    const html = renderToStaticMarkup(<DummyEditor />)
    expect(html).toContain('font-family:Antimono')
  })
})
