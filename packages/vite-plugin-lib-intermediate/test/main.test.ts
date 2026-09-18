import {describe, expect, test} from 'bun:test'
import {randomUUID} from 'node:crypto'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import fs from 'fs-extra'

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
  test('removes empty dependency fields after bundling', async () => {
    const folder = join(tmpdir(), `vite-plugin-lib-intermediate-${randomUUID()}`)
    const previousFolder = process.cwd()
    const originalSpawn = Bun.spawn
    await fs.outputJson(join(folder, 'package.json'), {
      dependencies: {
        'monaco-editor': '0.56.0',
      },
      peerDependencies: {
        react: '^19.3.0',
      },
    })
    await fs.outputFile(join(folder, 'out/intermediate/src/main.js'), 'export default null\n')
    process.chdir(folder)
    Bun.spawn = (() => ({
      exited: Promise.resolve(0),
    })) as unknown as typeof Bun.spawn
    try {
      const plugin = vitePluginLibIntermediate({
        bundleDependencies: ['monaco-editor'],
      })
      const closeBundle = plugin.closeBundle as unknown as () => Promise<void>
      await closeBundle()
      const packageJson = await fs.readJson(join(folder, 'out/intermediate/package.json')) as {
        dependencies?: Record<string, string>
        peerDependencies?: Record<string, string>
      }
      expect(packageJson.dependencies).toBeUndefined()
      expect(packageJson.peerDependencies).toEqual({
        react: '^19.3.0',
      })
    } finally {
      Bun.spawn = originalSpawn
      process.chdir(previousFolder)
      await fs.remove(folder)
    }
  })
})
