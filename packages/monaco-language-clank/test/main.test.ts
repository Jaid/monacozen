import {describe, expect, test} from 'bun:test'

import stringifyClank from 'stringify-clank'

import definition from '../src/main.ts'

describe('Clank', () => {
  test('uses the actual serializer format, not JSON punctuation or comments', () => {
    expect(stringifyClank({
      age: 5,
      pets: [{name: 'Rex'}],
      note: '#not-a-comment',
    })).toBe('age 5 pets [{ name Rex}] note #not-a-comment')
    expect(definition.configuration.comments).toBeUndefined()
    expect(definition.language.tokenPostfix).toBe('.clank')
  })
  test('supports raw multiline strings and escaped double-quoted strings', () => {
    expect(stringifyClank({text: 'two\nlines'})).toBe("text 'two\nlines'")
    expect(definition.language.tokenizer.singleQuoted).toBeDefined()
    expect(definition.language.tokenizer.doubleQuoted).toBeDefined()
  })
})
