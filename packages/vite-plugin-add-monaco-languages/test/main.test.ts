import {describe, expect, test} from 'bun:test'

import addLanguages from '../src/main.ts'

describe('add Monaco languages', () => {
  test('registers metadata and defers loading the tokenizer', () => {
    const plugin = addLanguages({languages: [{
      id: 'logsql',
      aliases: ['LogsQL'],
      module: 'monaco-language-logsql',
    }]})
    const transform = plugin.transform as (code: string, id: string) => {code: string} | undefined
    const result = transform('export {}', 'C:/repo/node_modules/monaco-editor/esm/vs/index.js')!
    expect(result.code).toContain('registerTokensProviderFactory("logsql"')
    expect(result.code).toContain('await import("monaco-language-logsql")')
    expect(result.code).toContain('setLanguageConfiguration')
    expect(transform('export {}', '/app/src/main.ts')).toBeUndefined()
  })
  test('rejects duplicate IDs', () => {
    expect(() => addLanguages({languages: [{
      id: 'clank',
      module: 'a',
    }, {
      id: 'clank',
      module: 'b',
    }]})).toThrow('unique')
  })
})
