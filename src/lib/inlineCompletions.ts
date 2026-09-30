import type {editor, IPosition, IRange, languages} from 'monaco-editor/editor/editor.api'

/** Keep inline completions additive: never silently replace an unrelated value. */
export const toInlineCompletion = (
  model: Pick<editor.ITextModel, 'getValueInRange'>,
  position: IPosition,
  range: IRange,
  insertText: string,
): languages.InlineCompletion | undefined => {
  if (range.startLineNumber !== position.lineNumber || range.endLineNumber !== position.lineNumber
    || range.startColumn > position.column || range.endColumn < position.column || /[\n\r]/u.test(insertText)) {
    return
  }
  const before = model.getValueInRange({
    ...range,
    endColumn: position.column,
  })
  const after = model.getValueInRange({
    ...range,
    startColumn: position.column,
  })
  if (!insertText.startsWith(before) || !insertText.endsWith(after) || insertText.length <= before.length + after.length) {
    return
  }
  return {
    insertText,
    range,
  }
}
