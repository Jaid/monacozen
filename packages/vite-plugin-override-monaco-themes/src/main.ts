import type {Plugin} from 'vite'

import flattenString from 'flatten-string'

export type MonacoThemeName = 'hc-black' | 'hc-light' | 'vs' | 'vs-dark'

export type MonacoThemeOverride = {
  colors?: Record<string, string>
}

export type VitePluginOverrideMonacoThemesOptions = Partial<Record<MonacoThemeName, MonacoThemeOverride>>

const themeExportByName = {
  'hc-black': 'hc_black',
  'hc-light': 'hc_light',
  vs: 'vs',
  'vs-dark': 'vs_dark',
} satisfies Record<MonacoThemeName, string>
const monacoThemesModuleSuffix = '/monaco-editor/esm/vs/editor/standalone/common/themes.js'
const normalizeId = (id: string) => id.replaceAll('\\', '/')
const makeOverrideStatements = (options: VitePluginOverrideMonacoThemesOptions) => {
  return Object.entries(options).map(([themeName, override]) => {
    if (!override.colors || !Object.keys(override.colors).length) {
      return
    }
    const themeExport = themeExportByName[themeName as MonacoThemeName]
    return `Object.assign(${themeExport}.colors, ${JSON.stringify(override.colors)});`
  })
}
const vitePluginOverrideMonacoThemes = (options: VitePluginOverrideMonacoThemesOptions = {}): Plugin => ({
  enforce: 'pre',
  name: 'override-monaco-themes',
  transform(code, id) {
    if (!normalizeId(id).endsWith(monacoThemesModuleSuffix)) {
      return
    }
    return {
      code: flattenString.lines(code, makeOverrideStatements(options)),
      map: null,
    }
  },
})

export default vitePluginOverrideMonacoThemes
