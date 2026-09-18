import type {languages} from 'monaco-editor/editor/editor.api'

// https://docs.victoriametrics.com/victoriametrics/metricsql/
const language: languages.IMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.metricsql',
  unicode: true,
  keywords: ['and', 'or', 'unless', 'default', 'if', 'ifnot', 'bool', 'by', 'without', 'on', 'ignoring', 'group_left', 'group_right', 'offset', 'limit', 'keep_metric_names', 'with', 'WITH'],
  tokenizer: {
    root: [
      [/\s+/, 'white'],
      [/#.*$/, 'comment'],
      [/"/, 'string', '@doubleQuoted'],
      [/'/, 'string', '@singleQuoted'],
      [/`/, 'string', '@rawQuoted'],
      [/\$[A-Z_a-z]\w*/, 'variable'],
      [/(?:[Ii][Nn][Ff](?:[Ii][Nn][Ii][Tt][Yy])?|[Nn][Aa][Nn])\b/, 'number'],
      [/(?:\d+(?:\.\d+)?(?:d|h|i|m|ms|s|w|y))+\b/, 'number'],
      [/:(?=\s*(?:\d|\]))/, 'delimiter'],
      [/0[Xx][\dA-Fa-f]+\b/, 'number.hex'],
      [/(?:\d[\d_]*(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?(?:[GKMTk]i?b?)?\b/, 'number'],
      [/[:A-Z_a-z\u{80}-\u{FFFF}](?:[\w:\u{80}-\u{FFFF}]|\\.)*(?=\s*(?:=~|!~|!=|=(?!=)))/u, 'key'],
      [/[:A-Z_a-z\u{80}-\u{FFFF}](?:[\w:\u{80}-\u{FFFF}]|\\.)*(?=\s*\()/u, {cases: {
        '@keywords': 'keyword',
        '@default': 'type.identifier',
      }}],
      [/[:A-Z_a-z\u{80}-\u{FFFF}](?:[\w:\u{80}-\u{FFFF}]|\\.)*/u, {cases: {
        '@keywords': 'keyword',
        '@default': 'identifier',
      }}],
      [/[()[\]{}]/, '@brackets'],
      [/[!%*+\-/<=>@^~]+/, 'operator'],
      [/[,.:]/, 'delimiter'],
    ],
    doubleQuoted: [
      [/[^"\\]+/, 'string'],
      [/\\(?:["'\\abfnrtv]|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|U[\dA-Fa-f]{8}|[0-7]{3})/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],
    singleQuoted: [[/[^'\\]+/, 'string'], [/\\./, 'string.escape'], [/'/, 'string', '@pop']],
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
