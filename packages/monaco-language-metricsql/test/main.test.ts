import {expect, test} from 'bun:test'

import definition from '../src/main.ts'

test('MetricsQL includes its PromQL extensions', () => {
  expect(definition.configuration.comments?.lineComment).toBe('#')
  expect(definition.language.keywords).toContain('WITH')
  expect(definition.language.keywords).toContain('default')
  expect(definition.language.keywords).toContain('ifnot')
  expect(definition.language.keywords).toContain('keep_metric_names')
})
