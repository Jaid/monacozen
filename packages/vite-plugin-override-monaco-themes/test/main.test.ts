import {describe, expect, test} from 'bun:test'

import vitePluginOverrideMonacoThemes from '../src/main.ts'

describe('vitePluginOverrideMonacoThemes', () => {
  test('injects values into Monaco built-in themes', async () => {
    const plugin = vitePluginOverrideMonacoThemes({
      'vs-dark': {
        colors: {
          'editor.background': '#000000',
        },
      },
    })
    const transform = plugin.transform as unknown as (code: string, id: string) => Promise<{code: string} | undefined> | {code: string} | undefined
    const transformed = await transform(
      'const vs_dark = {colors: {}}\nexport {vs_dark}\n',
      'C:/repo/node_modules/monaco-editor/esm/vs/editor/standalone/common/themes.js',
    )
    expect(transformed?.code).toContain('Object.assign(vs_dark.colors, {"editor.background":"#000000"});')
  })
  test('ignores unrelated modules', async () => {
    const plugin = vitePluginOverrideMonacoThemes({
      'vs-dark': {
        colors: {'editor.background': '#000000'},
      },
    })
    const transform = plugin.transform as unknown as (code: string, id: string) => Promise<{code: string} | undefined> | {code: string} | undefined
    expect(await transform('export {}', 'src/main.ts')).toBeUndefined()
  })
})
