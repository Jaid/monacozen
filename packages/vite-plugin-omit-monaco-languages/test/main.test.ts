import {describe, expect, test} from 'bun:test'

import vitePluginOmitMonacoLanguages from '../src/main.ts'

const monacoEntryId = 'C:/repo/node_modules/monaco-editor/esm/vs/index.js'
describe('vitePluginOmitMonacoLanguages', () => {
  test('removes selected language registrations', async () => {
    const plugin = vitePluginOmitMonacoLanguages({
      languages: ['abap', 'apex'],
    })
    const transform = plugin.transform as unknown as (code: string, id: string) => Promise<{code: string} | undefined> | {code: string} | undefined
    const source = [
      "import './languages/definitions/abap/register.js';",
      "import './languages/definitions/apex/register.js';",
      "import './languages/definitions/python/register.js';",
    ].join('\n')
    const transformed = await transform(source, monacoEntryId)
    expect(transformed?.code).not.toContain('abap/register.js')
    expect(transformed?.code).not.toContain('apex/register.js')
    expect(transformed?.code).toContain('python/register.js')
  })
  test('rejects unknown languages', () => {
    const plugin = vitePluginOmitMonacoLanguages({
      languages: ['not-a-monaco-language'],
    })
    const transform = plugin.transform as unknown as (code: string, id: string) => {code: string} | undefined
    expect(() => transform("import './languages/definitions/python/register.js';", monacoEntryId)).toThrow('Unknown Monaco languages')
  })
})
