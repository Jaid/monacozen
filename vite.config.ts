import type {UserConfig} from 'vite'

import babelPlugin from '@rolldown/plugin-babel'
import reactPlugin, {reactCompilerPreset} from '@vitejs/plugin-react'
import addMonacoLanguagesPlugin from 'vite-plugin-add-monaco-languages'
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
    addMonacoLanguagesPlugin({
      languages: [
        {
          id: 'logsql',
          aliases: ['LogsQL', 'logsql'],
          extensions: ['.logsql'],
          module: 'monaco-language-logsql',
        },
        {
          id: 'metricsql',
          aliases: ['MetricsQL', 'metricsql'],
          extensions: ['.metricsql'],
          module: 'monaco-language-metricsql',
        },
        {
          id: 'clank',
          aliases: ['Clank', 'clank'],
          extensions: ['.clank'],
          module: 'monaco-language-clank',
        },
      ],
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
      codeSplitting: true,
      cssGroups: [{
        name: 'monaco',
        include: /^(?:editor|monaco)-.*\.css$/u,
      }],
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
