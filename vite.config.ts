import type {UserConfig} from 'vite'

import babelPlugin from '@rolldown/plugin-babel'
import reactPlugin, {reactCompilerPreset} from '@vitejs/plugin-react'
import libIntermediatePlugin from 'vite-plugin-lib-intermediate'
import omitMonacoLanguagesPlugin from 'vite-plugin-omit-monaco-languages'
import overrideMonacoThemesPlugin from 'vite-plugin-override-monaco-themes'

const config: UserConfig = {
  plugins: [
    reactPlugin(),
    babelPlugin({
      presets: [reactCompilerPreset()],
    }),
    overrideMonacoThemesPlugin({
      'vs-dark': {
        colors: {
          'editor.background': '#000000',
          'editor.inactiveSelectionBackground': '#222222',
          'editor.lineHighlightBorder': '#00000000',
          'editor.selectionBackground': '#333333',
          'editorCursor.foreground': '#fff',
        },
      },
    }),
    omitMonacoLanguagesPlugin({
      languages: [
        'abap',
        'apex',
        'lexon',
        'sb',
        'flow9',
      ],
    }),
    libIntermediatePlugin({
      bundleDependencies: [
        '@monaco-editor/react',
        'antimono',
        'monaco-editor',
      ],
      vendoredDeclarations: [
        {
          module: 'monaco-editor/editor/editor.api',
          output: 'monaco.d.ts',
          source: 'node_modules/monaco-editor/esm/vs/editor/editor.api.d.ts',
        },
      ],
    }),
  ],
}

export default config
