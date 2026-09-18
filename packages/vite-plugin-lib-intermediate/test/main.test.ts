import {describe, expect, test} from 'bun:test'

import vitePluginLibIntermediate from '../src/main.ts'

describe('vitePluginLibIntermediate', () => {
  test('configures the build_lib intermediate layout', async () => {
    const plugin = vitePluginLibIntermediate({
      bundleDependencies: ['monaco-editor'],
    })
    const configHook = plugin.config as unknown as () => Promise<{
      base: string
      build: {
        lib: {entry: string}
        outDir: string
        rolldownOptions: {
          external: (id: string) => boolean
          output: {
            codeSplitting: boolean
            entryFileNames: string
          }
        }
      }
    }>
    const config = await configHook()
    expect(config.base).toBe('./')
    expect(config.build.outDir).toBe('out/intermediate')
    expect(config.build.lib.entry).toBe('src/main.tsx')
    expect(config.build.rolldownOptions.output.entryFileNames).toBe('src/main.js')
    expect(config.build.rolldownOptions.output.codeSplitting).toBe(false)
    expect(config.build.rolldownOptions.external('react')).toBe(true)
    expect(config.build.rolldownOptions.external('monaco-editor')).toBe(false)
    expect(config.build.rolldownOptions.external('not-a-dependency')).toBe(false)
  })
})
