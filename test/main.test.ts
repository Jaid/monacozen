import {describe, expect, mock, test} from 'bun:test'

const defineTheme = mock()
const loaderConfig = mock()
const monaco = {
  editor: {defineTheme},
}
await mock.module('monaco-editor', () => monaco)
await mock.module('@monaco-editor/react', () => ({
  Editor: () => null,
  loader: {config: loaderConfig},
}))
const {default: monacozen} = await import('#src/main.tsx')
describe('Monacozen', () => {
  test('configures the loader with local Monaco', () => {
    expect(loaderConfig).toHaveBeenCalledTimes(1)
    expect(loaderConfig.mock.calls[0]?.[0]).toMatchObject({
      monaco: {
        editor: {defineTheme},
      },
    })
  })
  test('defaults to dark Antimono', () => {
    const editor = monacozen({})
    expect(editor).toMatchObject({
      props: {
        options: {
          disableMonospaceOptimizations: true,
          fontFamily: 'Antimono',
        },
        theme: 'vs-dark',
      },
    })
  })
  test('uses the default Monaco theme in light mode', () => {
    const editor = monacozen({
      dark: false,
      font: 'antimono',
    })
    expect(editor).toMatchObject({
      props: {theme: 'vs'},
    })
  })
  test('merges caller options over the defaults', () => {
    const editor = monacozen({
      dark: false,
      font: 'antimono',
      options: {padding: {top: 6}},
    })
    expect(editor).toMatchObject({
      props: {
        options: {
          disableMonospaceOptimizations: true,
          fontFamily: 'Antimono',
          padding: {top: 6},
        },
      },
    })
  })
  test('uses monospace optimization for mono', () => {
    const editor = monacozen({
      dark: false,
      font: 'mono',
    })
    expect(editor).toMatchObject({
      props: {
        options: {
          disableMonospaceOptimizations: false,
          fontFamily: 'monospace',
        },
      },
    })
  })
  test('uses proportional rendering for dense', () => {
    const editor = monacozen({
      dark: false,
      font: 'dense',
    })
    expect(editor).toMatchObject({
      props: {
        options: {
          disableMonospaceOptimizations: true,
          fontFamily: 'sans-serif',
        },
      },
    })
  })
})
