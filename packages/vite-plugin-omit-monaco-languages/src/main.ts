import type {Plugin} from 'vite'

export type VitePluginOmitMonacoLanguagesOptions = {
  languages: ReadonlyArray<string>
}

const monacoEntryModuleSuffix = '/monaco-editor/esm/vs/index.js'
const languageRegistrationPattern = /^import ["']\.\/languages\/definitions\/([^/]+)\/register\.js["'];?$/u
const normalizeId = (id: string) => id.replaceAll('\\', '/')
const vitePluginOmitMonacoLanguages = ({languages}: VitePluginOmitMonacoLanguagesOptions): Plugin => {
  const omittedLanguages = new Set(languages)
  return {
    enforce: 'pre',
    name: 'omit-monaco-languages',
    transform(code, id) {
      if (!normalizeId(id).endsWith(monacoEntryModuleSuffix)) {
        return
      }
      const omitted = new Set<string>
      const output: Array<string> = []
      for (const line of code.split(/\r?\n/u)) {
        const language = languageRegistrationPattern.exec(line)?.[1]
        if (language && omittedLanguages.has(language)) {
          omitted.add(language)
          continue
        }
        output.push(line)
      }
      const missing = omittedLanguages.difference(omitted)
      if (missing.size) {
        throw new Error(`Unknown Monaco languages: ${[...missing].join(', ')}`)
      }
      return {
        code: output.join('\n'),
        map: null,
      }
    },
  }
}

export default vitePluginOmitMonacoLanguages
