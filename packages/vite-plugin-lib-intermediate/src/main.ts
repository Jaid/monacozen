import type {Plugin, UserConfig} from 'vite'

import {createHash} from 'node:crypto'
import {dirname, join, posix, relative} from 'node:path'

import fs from 'fs-extra'

export type VendoredDeclaration = {
  module: string
  output: string
  source: string
}

export type VitePluginLibIntermediateOptions = {
  bundleDependencies?: ReadonlyArray<string>
  codeSplitting?: boolean
  cssGroups?: ReadonlyArray<{
    include: RegExp
    name: string
  }>
  declarationTsconfig?: string
  entry?: string
  outputFolder?: string
  vendoredDeclarations?: ReadonlyArray<VendoredDeclaration>
}

type PackageJson = {
  dependencies?: Record<string, string>
  exports?: unknown
  optionalDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
} & Record<string, unknown>

const defaults = {
  bundleDependencies: [] as ReadonlyArray<string>,
  codeSplitting: false,
  cssGroups: [] as ReadonlyArray<{
    include: RegExp
    name: string
  }>,
  declarationTsconfig: 'tsconfig.intermediate.json',
  entry: 'src/main.tsx',
  outputFolder: 'out/intermediate',
  vendoredDeclarations: [] as ReadonlyArray<VendoredDeclaration>,
} satisfies Required<VitePluginLibIntermediateOptions>
const makeDependencyPattern = (dependencies: ReadonlyArray<string>) => {
  if (!dependencies.length) {
    return /^$/u
  }
  const escaped = dependencies.map(dependency => RegExp.escape(dependency))
  return new RegExp(`^(?:${escaped.join('|')})(?:/|$)`, 'u')
}
const removeBundledDependencies = (packageJson: PackageJson, bundledDependencies: ReadonlySet<string>) => {
  for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies'] as const) {
    const dependencies = packageJson[field]
    if (!dependencies) {
      continue
    }
    for (const dependency of bundledDependencies) {
      delete dependencies[dependency]
    }
    if (!Object.keys(dependencies).length) {
      delete packageJson[field]
    }
  }
}
const copyIfExists = async (source: string, target: string) => {
  if (await fs.pathExists(source)) {
    await fs.copy(source, target)
  }
}
const vendorDeclarations = async (outputFolder: string, declarations: ReadonlyArray<VendoredDeclaration>) => {
  if (!declarations.length) {
    return
  }
  const sourceFolder = join(outputFolder, 'src')
  const files = await fs.readdir(sourceFolder, {
    recursive: true,
    encoding: 'utf8',
  })
  const declarationFiles = files.filter(file => file.endsWith('.d.ts'))
  for (const declaration of declarations) {
    for (const file of declarationFiles) {
      const target = join(sourceFolder, file)
      const importedPath = relative(dirname(target), join(sourceFolder, declaration.output)).replaceAll('\\', '/').replace(/\.d\.ts$/u, '.js')
      const moduleTarget = importedPath.startsWith('.') ? importedPath : `./${importedPath}`
      let text = await fs.readFile(target, 'utf8')
      for (const quote of ["'", '"']) {
        text = text.replaceAll(quote + declaration.module + quote, () => quote + moduleTarget + quote)
      }
      await fs.writeFile(target, text)
    }
    await Promise.all([
      fs.copy(declaration.source, join(sourceFolder, declaration.output)),
      fs.copy(declaration.source, join(outputFolder, declaration.output)),
    ])
  }
}
const vitePluginLibIntermediate = (options: VitePluginLibIntermediateOptions = {}): Plugin => {
  const resolvedOptions = {
    ...defaults,
    ...options,
  }
  const bundledDependencies = new Set(resolvedOptions.bundleDependencies)
  let dependencyPattern = /^$/u
  return {
    name: 'lib-intermediate',
    async config() {
      const packageJson = await fs.readJson('package.json') as PackageJson
      const runtimeDependencies = [
        ...Object.keys(packageJson.dependencies ?? {}),
        ...Object.keys(packageJson.optionalDependencies ?? {}),
        ...Object.keys(packageJson.peerDependencies ?? {}),
      ]
      dependencyPattern = makeDependencyPattern(runtimeDependencies.filter(dependency => !bundledDependencies.has(dependency)))
      const config: UserConfig = {
        base: './',
        build: {
          assetsInlineLimit: Number.POSITIVE_INFINITY,
          copyPublicDir: false,
          cssCodeSplit: resolvedOptions.codeSplitting,
          emptyOutDir: true,
          lib: {
            entry: resolvedOptions.entry,
            formats: ['es'],
          },
          minify: true,
          target: 'esnext',
          outDir: resolvedOptions.outputFolder,
          rolldownOptions: {
            external: id => dependencyPattern.test(id),
            output: {
              assetFileNames: 'assets/[name]-[hash][extname]',
              chunkFileNames: 'assets/[name]-[hash].js',
              codeSplitting: resolvedOptions.codeSplitting,
              entryFileNames: 'src/main.js',
            },
          },
        },
      }
      return config
    },
    generateBundle: {
      order: 'post',
      handler(_options, bundle) {
        for (const group of resolvedOptions.cssGroups) {
          const assets = Object.values(bundle).filter(asset => asset.type === 'asset').filter(asset => asset.fileName.endsWith('.css') && group.include.test(posix.basename(asset.fileName)))
          if (!assets.length) {
            continue
          }
          const content = assets.map(asset => {
            return typeof asset.source === 'string' ? asset.source : Buffer.from(asset.source).toString('utf8')
          }).join('\n')
          const hash = createHash('sha256').update(content).digest('hex').slice(0, 8)
          const fileName = `assets/${group.name}-${hash}.css`
          const originals = new Set(assets.map(asset => asset.fileName))
          this.emitFile({
            type: 'asset',
            fileName,
            source: content,
          })
          for (const original of originals) {
            delete bundle[original]
          }
          for (const chunk of Object.values(bundle)) {
            if (chunk.type !== 'chunk') {
              continue
            }
            const metadata = (chunk as typeof chunk & {viteMetadata?: {importedCss: Set<string>}}).viteMetadata
            if (!metadata) {
              continue
            }
            metadata.importedCss = new Set([...metadata.importedCss].map(file => {
              return originals.has(file) ? fileName : file
            }))
          }
        }
        // Keep styles attached to their owning chunks, not the public entry.
        // Consumer bundlers then load each stylesheet with its lazy JavaScript chunk.
        for (const chunk of Object.values(bundle)) {
          if (chunk.type !== 'chunk') {
            continue
          }
          const metadata = (chunk as typeof chunk & {viteMetadata?: {importedCss: Set<string>}}).viteMetadata
          const imports = [...metadata?.importedCss ?? []].map(file => {
            const path = posix.relative(posix.dirname(chunk.fileName), file)
            return `import ${JSON.stringify(path.startsWith('.') ? path : `./${path}`)};`
          })
          if (imports.length) {
            chunk.code = `${imports.join('\n')}\n${chunk.code}`
          }
        }
      },
    },
    async closeBundle() {
      const declarationBuild = Bun.spawn(['bun', 'x', 'tsc', '--project', resolvedOptions.declarationTsconfig], {
        stderr: 'inherit',
        stdout: 'inherit',
      })
      if (await declarationBuild.exited !== 0) {
        throw new Error('Declaration build failed.')
      }
      await vendorDeclarations(resolvedOptions.outputFolder, resolvedOptions.vendoredDeclarations)
      const packageJson = await fs.readJson('package.json') as PackageJson
      removeBundledDependencies(packageJson, bundledDependencies)
      packageJson.exports = {
        '.': {
          types: './src/main.d.ts',
          default: './src/entry.ts',
        },
      }
      await Promise.all([
        fs.outputFile(`${resolvedOptions.outputFolder}/src/entry.ts`, "export {default} from './main.js'\nexport * from './main.js'\n"),
        fs.outputJson(`${resolvedOptions.outputFolder}/package.json`, packageJson, {spaces: 2}),
        copyIfExists('license.txt', `${resolvedOptions.outputFolder}/license.txt`),
        copyIfExists('readme.md', `${resolvedOptions.outputFolder}/readme.md`),
      ])
    },
  }
}

export default vitePluginLibIntermediate
