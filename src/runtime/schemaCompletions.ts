import type {editor, IDisposable, languages} from 'monaco-editor/editor/editor.api'

import * as monaco from 'monaco-editor'
import {ILanguageFeaturesService} from 'monaco-editor/editor/common/services/languageFeatures'
import {SnippetParser} from 'monaco-editor/editor/contrib/snippet/browser/snippetParser'
import {StandaloneServices} from 'monaco-editor/editor/standalone/browser/standaloneServices'

import {toInlineCompletion} from '../lib/inlineCompletions.ts'

const snippetParser = new SnippetParser

export const registerSchemaCompletions = (model: editor.ITextModel, ready: () => Promise<void>): IDisposable => {
  let disposed = false
  const registration = monaco.languages.registerInlineCompletionsProvider(model.getLanguageId(), {
    displayName: 'Schema values',
    async provideInlineCompletions(requestModel, position, _context, token) {
      if (requestModel !== model || disposed || token.isCancellationRequested) {
        return
      }
      const version = model.getVersionId()
      const language = model.getLanguageId()
      const isCurrent = () => !disposed && !token.isCancellationRequested && !model.isDisposed()
        && model.getVersionId() === version && model.getLanguageId() === language
      await ready()
      if (!isCurrent()) {
        return
      }
      // Reuse Monaco's active providers instead of parsing incomplete YAML/JSON again.
      // This also shares workers, schema references, and language-specific quoting.
      const providers = StandaloneServices.get(ILanguageFeaturesService).completionProvider.ordered(model)
      const items: Array<languages.InlineCompletion> = []
      const seen = new Set<string>
      for (const provider of providers) {
        let completions: languages.CompletionList | null | undefined
        try {
          completions = await provider.provideCompletionItems(model, position, {
            triggerKind: monaco.languages.CompletionTriggerKind.Invoke,
          }, token)
          if (!isCurrent()) {
            return
          }
          for (const completion of completions?.suggestions ?? []) {
            if (completion.kind !== monaco.languages.CompletionItemKind.Value
              && completion.kind !== monaco.languages.CompletionItemKind.EnumMember
              || completion.additionalTextEdits?.length) {
              continue
            }
            const text = completion.insertTextRules && completion.insertTextRules & monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet ? snippetParser.parse(completion.insertText).toString() : completion.insertText
            const range = 'replace' in completion.range ? completion.range.replace : completion.range
            const item = toInlineCompletion(model, position, range, text)
            const key = JSON.stringify([range, text])
            if (!(item && !seen.has(key))) {
              continue
            }
            seen.add(key)
            items.push(item)
          }
        } catch (error) {
          if (isCurrent() && !(Error.isError(error) && error.name === 'Canceled')) {
            throw error
          }
          return
        } finally {
          completions?.dispose?.()
        }
      }
      return {
        items,
        suppressSuggestions: items.length > 0,
      }
    },
    disposeInlineCompletions() {},
  })
  return {
    dispose() {
      disposed = true
      registration.dispose()
    },
  }
}
