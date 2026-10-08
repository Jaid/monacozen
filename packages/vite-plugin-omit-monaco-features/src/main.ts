import type {Plugin} from 'vite'

export type MonacoFeature = 'css' | 'html' | 'json' | 'typescript'

export type VitePluginOmitMonacoFeaturesOptions = {
  features: ReadonlyArray<MonacoFeature>
}

const monacoEntryModuleSuffix = '/monaco-editor/esm/vs/index.js'
const featureImportPattern = /^import \* as (\w+) from ["']\.\/languages\/features\/([^/]+)\/register\.js["'];?$/u
const featureExportPattern = /^export \{ (\w+) as \w+ \};?$/u
const featureModulePattern = /\/monaco-editor\/esm\/vs\/languages\/features\/([^/]+)\//u
const stubPrefix = '\0omit-monaco-features:'
const normalizeId = (id: string) => id.replaceAll('\\', '/')
const vitePluginOmitMonacoFeatures = ({features}: VitePluginOmitMonacoFeaturesOptions): Plugin => {
  const omittedFeatures = new Set<string>(features)
  return {
    enforce: 'pre',
    name: 'omit-monaco-features',
    // Language service registrations are removed from Monaco’s entry. Remaining references, such as
    // worker imports in a MonacoEnvironment, resolve to a stub so the worker bundles are not emitted.
    async resolveId(source, importer, options) {
      if (!source.includes('languages/features/') || source.startsWith(stubPrefix)) {
        return
      }
      const resolved = await this.resolve(source, importer, {
        ...options,
        skipSelf: true,
      })
      const feature = resolved && featureModulePattern.exec(normalizeId(resolved.id))?.[1]
      if (feature && omittedFeatures.has(feature)) {
        return `${stubPrefix}${feature}`
      }
    },
    load(id) {
      if (!id.startsWith(stubPrefix)) {
        return
      }
      const feature = id.slice(stubPrefix.length)
      return `export default class {
  constructor() {
    throw new Error(${JSON.stringify(`The Monaco language service “${feature}” is not included in this build.`)})
  }
}
`
    },
    transform(code, id) {
      if (!normalizeId(id).endsWith(monacoEntryModuleSuffix)) {
        return
      }
      const omitted = new Set<string>
      const omittedBindings = new Set<string>
      const output: Array<string> = []
      for (const line of code.split(/\r?\n/u)) {
        const featureImport = featureImportPattern.exec(line)
        if (featureImport && omittedFeatures.has(featureImport[2])) {
          omitted.add(featureImport[2])
          omittedBindings.add(featureImport[1])
          continue
        }
        const binding = featureExportPattern.exec(line)?.[1]
        if (binding && omittedBindings.has(binding)) {
          continue
        }
        output.push(line)
      }
      const missing = omittedFeatures.difference(omitted)
      if (missing.size) {
        throw new Error(`Unknown Monaco language features: ${[...missing].join(', ')}`)
      }
      return {
        code: output.join('\n'),
        map: null,
      }
    },
  }
}

export default vitePluginOmitMonacoFeatures
