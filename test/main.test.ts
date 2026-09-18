import {expect, test} from 'bun:test'

const {default: monacozen} = await import('#src/main.ts')

test('should run', () => {
  const result = monacozen()
  expect(result).toBe('monacozen') // TODO Test actual functionality
})
