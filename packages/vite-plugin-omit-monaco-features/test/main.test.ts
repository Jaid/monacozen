import {describe, expect, test} from 'bun:test'

import vitePluginOmitMonacoFeatures from '../src/main.ts'

const monacoEntryId = 'C:/repo/node_modules/monaco-editor/esm/vs/index.js'
const source = [
  "import * as __src_languages_features_css_register_ts from './languages/features/css/register.js';",
  'export { __src_languages_features_css_register_ts as css };',
  "import * as __src_languages_features_json_register_ts from './languages/features/json/register.js';",
  'export { __src_languages_features_json_register_ts as json };',
  "import * as __src_languages_features_typescript_register_ts from './languages/features/typescript/register.js';",
  'export { __src_languages_features_typescript_register_ts as typescript };',
  "import './languages/definitions/typescript/register.js';",
].join('\n')
type Transform = (code: string, id: string) => {code: string} | undefined
type ResolveId = (this: {resolve: (source: string) => Promise<{id: string} | null>}, source: string, importer: string | undefined, options: object) => Promise<string | undefined>
type Load = (id: string) => string | undefined
describe('vitePluginOmitMonacoFeatures', () => {
  test('removes selected language service registrations and their exports', () => {
    const plugin = vitePluginOmitMonacoFeatures({
      features: ['css', 'typescript'],
    })
    const transformed = (plugin.transform as unknown as Transform)(source, monacoEntryId)
    expect(transformed?.code).not.toContain('features/css/register.js')
    expect(transformed?.code).not.toContain('as css')
    expect(transformed?.code).not.toContain('features/typescript/register.js')
    expect(transformed?.code).not.toContain('as typescript')
    expect(transformed?.code).toContain('features/json/register.js')
    expect(transformed?.code).toContain('as json')
    expect(transformed?.code).toContain('definitions/typescript/register.js')
  })
  test('rejects unknown features', () => {
    const plugin = vitePluginOmitMonacoFeatures({
      features: ['python' as 'css'],
    })
    expect(() => (plugin.transform as unknown as Transform)(source, monacoEntryId)).toThrow('Unknown Monaco language features')
  })
  test('replaces worker imports of omitted features with a stub', async () => {
    const plugin = vitePluginOmitMonacoFeatures({
      features: ['typescript'],
    })
    const context = {
      resolve: (specifier: string) => Promise.resolve({id: specifier.replace(/^monaco-editor\/(.*?)(\?.*)?$/u, String.raw`C:\repo\node_modules\monaco-editor\esm\vs\$1.js$2`)}),
    }
    const resolveId = plugin.resolveId as unknown as ResolveId
    const stubId = await resolveId.call(context, 'monaco-editor/languages/features/typescript/ts.worker?worker', undefined, {})
    expect(stubId).toBe('\0omit-monaco-features:typescript')
    expect(await resolveId.call(context, 'monaco-editor/languages/features/json/json.worker?worker', undefined, {})).toBeUndefined()
    expect(await resolveId.call(context, 'react', undefined, {})).toBeUndefined()
    const stub = (plugin.load as unknown as Load)(stubId!)
    expect(stub).toContain('export default class')
    expect(stub).toContain('“typescript”')
  })
})
