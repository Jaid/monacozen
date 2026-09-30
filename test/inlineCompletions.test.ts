import type {IRange} from 'monaco-editor/editor/editor.api'

import {describe, expect, test} from 'bun:test'

import {toInlineCompletion} from '../src/lib/inlineCompletions.ts'

const complete = (line: string, column: number, text: string, startColumn = 7, endColumn = line.length + 1) => {
  const model = {
    getValueInRange: (range: IRange) => line.slice(range.startColumn - 1, range.endColumn - 1),
  }
  return toInlineCompletion(model, {
    lineNumber: 1,
    column,
  }, {
    startLineNumber: 1,
    startColumn,
    endLineNumber: 1,
    endColumn,
  }, text)
}
describe('schema inline completion edits', () => {
  test('offers a complete value after an empty YAML property', () => {
    expect(complete('sort: ', 7, 'firstYear')).toMatchObject({insertText: 'firstYear'})
  })
  test('extends a typed prefix without duplicating it', () => {
    const result = complete('sort: th', 9, 'threeYears')
    expect(result).toMatchObject({
      insertText: 'threeYears',
      range: {
        startColumn: 7,
        endColumn: 9,
      },
    })
  })
  test('preserves the closing quote of a JSON string', () => {
    expect(complete('{"sort": "th"}', 13, '"threeYears"', 10, 14)).toBeDefined()
  })
  test('preserves the closing quote of a YAML string', () => {
    expect(complete('sort: "th"', 10, '"threeYears"')).toBeDefined()
  })
  test('does not overwrite mismatching prefixes or suffixes', () => {
    expect(complete('sort: xx', 9, 'threeYears')).toBeUndefined()
    expect(complete('sort: thOther', 9, 'threeYears')).toBeUndefined()
    expect(complete('sort: THREE', 12, 'threeYears')).toBeUndefined()
  })
  test('does not suggest an already complete value', () => {
    expect(complete('sort: threeYears', 17, 'threeYears')).toBeUndefined()
    expect(complete('sort: "threeYears"', 18, '"threeYears"')).toBeUndefined()
  })
  test('supports punctuation, numbers, null and escaped literal characters', () => {
    expect(complete('sort: three-', 13, 'three-years')).toBeDefined()
    expect(complete('sort: 1', 8, '100')).toBeDefined()
    expect(complete('sort: n', 8, 'null')).toBeDefined()
    expect(complete('sort: $', 8, '$HOME')).toBeDefined()
    expect(complete('sort: C:', 9, String.raw`C:\folder`)).toBeDefined()
  })
  test('ignores multiline completions and edits outside the cursor', () => {
    expect(complete('sort: ', 7, 'first\nsecond')).toBeUndefined()
    expect(complete('sort: ', 7, 'first\rsecond')).toBeUndefined()
    expect(complete('sort: ', 4, 'firstYear')).toBeUndefined()
    expect(complete('sort: ', 8, 'firstYear')).toBeUndefined()
    expect(toInlineCompletion({getValueInRange: () => ''}, {
      lineNumber: 2,
      column: 1,
    }, {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: 2,
      endColumn: 1,
    }, 'value')).toBeUndefined()
  })
})
