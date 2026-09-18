import type {Plugin} from 'vite'

import flattenString from 'flatten-string'

export type MonacoLanguage = {
  aliases?: ReadonlyArray<string>
  extensions?: ReadonlyArray<string>
  id: string
  mimetypes?: ReadonlyArray<string>
  module: string
}
export type VitePluginAddMonacoLanguagesOptions = {
  languages: ReadonlyArray<MonacoLanguage>
}

const vitePluginAddMonacoLanguages = ({languages}: VitePluginAddMonacoLanguagesOptions): Plugin => {
  const ids = new Set<string>
  for (const {id, module} of languages) {
    if (!id || !module || ids.has(id)) {
      throw new Error('Language IDs must be unique and each language must have a module.')
    }
    ids.add(id)
  }
  return {
    name: 'add-monaco-languages',
    enforce: 'pre',
    config() {
      return {optimizeDeps: {exclude: ['monaco-editor', ...languages.map(language => language.module)]}}
    },
    transform(code, id) {
      const normalized = id.replaceAll('\\', '/').split('?')[0]
      const entry = normalized.endsWith('/monaco-editor/esm/vs/index.js')
      const legacyEntry = normalized.endsWith('/monaco-editor/esm/vs/editor/editor.main.js')
      if (!entry && !legacyEntry || !languages.length) {
        return
      }
      const api = entry ? './editor/editor.api.js' : './editor.api.js'
      return {
        code: flattenString.lines(
          code,
          `import {languages as __addedMonacoLanguages} from ${JSON.stringify(api)};`,
          languages.map(({module, ...registration}) => {
            const languageId = JSON.stringify(registration.id)
            return flattenString.lines(
              `__addedMonacoLanguages.register(${JSON.stringify(registration)});`,
              `__addedMonacoLanguages.registerTokensProviderFactory(${languageId}, {`,
              '  async create() {',
              `    const {default: definition} = await import(${JSON.stringify(module)});`,
              `    __addedMonacoLanguages.setLanguageConfiguration(${languageId}, definition.configuration);`,
              '    return definition.language;',
              '  }',
              '});',
            )
          }),
        ),
        map: null,
      }
    },
  }
}

export default vitePluginAddMonacoLanguages
