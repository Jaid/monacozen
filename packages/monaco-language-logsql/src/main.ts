import type {languages} from 'monaco-editor/editor/editor.api'

// https://docs.victoriametrics.com/victorialogs/logsql/
const language: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.logsql',
  ignoreCase: true,
  keywords: ['and', 'or', 'not', 'in', 'as', 'by', 'asc', 'desc', 'if', 'keep', 'with', 'options', 'offset', 'limit', 'format', 'fields', 'delete', 'rename', 'copy', 'filter', 'sort', 'stats', 'uniq', 'first', 'last', 'extract', 'extract_regexp', 'unpack_json', 'unpack_logfmt', 'pack_json', 'pack_logfmt', 'math', 'replace', 'replace_regexp', 'field_names', 'field_values', 'field_value', 'len', 'top', 'union', 'join', 'lookup', 'unroll', 'collapse_nums', 'drop_empty_fields', 'drop_empty_rows', 'blocks_count', 'facets', 'json_array_len', 'split', 'sample', 'stream_context', 'time', 'duration', 'ipv4_range', 'range', 'contains_any', 'contains_all', 'equals', 'eq_field', 'le_field', 'lt_field', 're', 'i', 'seq', 'exact', 'prefix', 'day_range', 'week_range'],
  tokenizer: {
    root: [
      [/\s+/, 'white'],
      [/#.*$/, 'comment'],
      [/"/, 'string', '@doubleQuoted'],
      [/'/, 'string', '@singleQuoted'],
      [/`/, 'string', '@rawQuoted'],
      [/\b\d{4}-\d{2}-\d{2}(?:T[\d.:]+(?:Z|[+-]\d{2}:\d{2})?)?\b/, 'number'],
      [/[+-]?(?:\d+(?:\.\d+)?(?:ns|us|µs|d|h|m|ms|s|w|y))+\b/, 'number'],
      [/[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?(?:b|[gkmt]i?b?)?\b/, 'number'],
      [/[_a-z][\w\-./]*(?=\s*:)/, 'key'],
      [/[_a-z][\w\-./]*(?=\s*\()/, {cases: {
        '@keywords': 'keyword',
        '@default': 'type.identifier',
      }}],
      [/[_a-z][\w\-./]*/, {cases: {
        '@keywords': 'keyword',
        '@default': 'identifier',
      }}],
      [/[()[\]{}]/, '@brackets'],
      [/[!%&*+\-/:<=>^|~]+/, 'operator'],
      [/[,.;]/, 'delimiter'],
    ],
    doubleQuoted: [
      [/[^"\\]+/, 'string'],
      [/\\(?:["'\\abfnrtv]|x[\da-f]{2}|u[\da-f]{4}|U[\da-f]{8}|[0-7]{3})/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],
    singleQuoted: [
      [/[^'\\]+/, 'string'],
      [/\\./, 'string.escape'],
      [/'/, 'string', '@pop'],
    ],
    rawQuoted: [[/[^`]+/, 'string'], [/`/, 'string', '@pop']],
  },
}
const configuration: languages.LanguageConfiguration = {
  comments: {lineComment: '#'},
  brackets: [['{', '}'], ['[', ']'], ['(', ')']],
  autoClosingPairs: [
    {
      open: '{',
      close: '}',
    },
    {
      open: '[',
      close: ']',
    },
    {
      open: '(',
      close: ')',
    },
    {
      open: '"',
      close: '"',
      notIn: ['string', 'comment'],
    },
    {
      open: "'",
      close: "'",
      notIn: ['string', 'comment'],
    },
    {
      open: '`',
      close: '`',
      notIn: ['string', 'comment'],
    },
  ],
}

export default {
  configuration,
  language,
}
