import {expect, test} from 'bun:test'

import definition from '../src/main.ts'

test('LogsQL configures pipes, filters and three forms of strings', () => {
  expect(definition.configuration.comments?.lineComment).toBe('#')
  expect(definition.language.keywords).toContain('stats')
  expect(definition.language.keywords).toContain('unpack_json')
  expect(definition.language.tokenizer.rawQuoted).toBeDefined()
})
