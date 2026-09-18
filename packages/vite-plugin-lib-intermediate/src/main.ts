import type {Plugin, UserConfig} from 'vite'

import {join} from 'node:path'

import fs from 'fs-extra'

export type VendoredDeclaration = {
  module: string
  output: string
  source: string
}

export type VitePluginLibIntermediateOptions = {
  bundleDependencies?: ReadonlyArray<string>
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
  }
}
const copyIfExists = async (source: string, target: string) => {
  if (await fs.pathExists(source)) {
    await fs.copy(source, target)
  }
}
const prepareRuntimeForBuildLib = async (outputFolder: string) => {
  const sourceFolder = join(outputFolder, 'src')
  const runtimeFile = join(sourceFolder, 'main.js')
  const sourceFiles = await fs.readdir(sourceFolder)
  const cssFiles = sourceFiles.filter(file => file.endsWith('.css'))
  let runtime = await fs.readFile(runtimeFile, 'utf8')
  runtime = runtime.replaceAll('../assets/', './assets/')
  if (cssFiles.length) {
    const cssImports = cssFiles.map(file => `import './src/${file}';`).join('\n')
    runtime = `${cssImports}\n${runtime}`
  }
  await fs.writeFile(runtimeFile, runtime)
}
const vendorDeclarations = async (outputFolder: string, declarations: ReadonlyArray<VendoredDeclaration>) => {
  if (!declarations.length) {
    return
  }
  const mainDeclarationFile = join(outputFolder, 'src', 'main.d.ts')
  let mainDeclaration = await fs.readFile(mainDeclarationFile, 'utf8')
  await Promise.all(declarations.flatMap(declaration => {
    const moduleTarget = `./${declaration.output.replace(/\.d\.ts$/u, '.js')}`
    mainDeclaration = mainDeclaration
      .replaceAll(`'${declaration.module}'`, () => `'${moduleTarget}'`)
      .replaceAll(`"${declaration.module}"`, () => `"${moduleTarget}"`)
    return [
      fs.copy(declaration.source, join(outputFolder, 'src', declaration.output)),
      fs.copy(declaration.source, join(outputFolder, declaration.output)),
    ]
  }))
  await fs.writeFile(mainDeclarationFile, mainDeclaration)
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
          emptyOutDir: true,
          lib: {
            entry: resolvedOptions.entry,
            formats: ['es'],
          },
          minify: false,
          outDir: resolvedOptions.outputFolder,
          rolldownOptions: {
            external: id => dependencyPattern.test(id),
            output: {
              assetFileNames: 'src/[name][extname]',
              chunkFileNames: 'src/[name].js',
              codeSplitting: false,
              entryFileNames: 'src/main.js',
            },
          },
        },
      }
      return config
    },
    async closeBundle() {
      const declarationBuild = Bun.spawn(['bun', 'x', 'tsc', '--project', resolvedOptions.declarationTsconfig], {
        stderr: 'inherit',
        stdout: 'inherit',
      })
      if (await declarationBuild.exited !== 0) {
        throw new Error('Declaration build failed.')
      }
      await Promise.all([
        prepareRuntimeForBuildLib(resolvedOptions.outputFolder),
        vendorDeclarations(resolvedOptions.outputFolder, resolvedOptions.vendoredDeclarations),
      ])
      const packageJson = await fs.readJson('package.json') as PackageJson
      removeBundledDependencies(packageJson, bundledDependencies)
      packageJson.exports = {
        '.': {
          default: './src/entry.ts',
          types: './src/main.d.ts',
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
