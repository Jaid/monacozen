import type {languages} from 'monaco-editor/editor/editor.api'

// Follow stringify-clank: whitespace separates items, single quotes are raw,
// double quotes use escapes and top-level objects omit their braces.
const language: languages.IMonarchLanguage = {
  defaultToken: 'string',
  tokenPostfix: '.clank',
  tokenizer: {
    root: [
      [/\s+/, 'white'],
      [/'/, 'string', '@singleQuoted'],
      [/"/, 'string', '@doubleQuoted'],
      [/(?:false|null|true|undefined)(?=$|[\s\]}])/, 'keyword'],
      [/(?:-?Infinity|NaN)(?=$|[\s\]}])/, 'number'],
      [/-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[Ee][+-]?\d+)?(?=$|[\s\]}])/, 'number'],
      [/[[\]{}]/, '@brackets'],
      [/[^\s[\]{}]+/, 'string'],
    ],
    // A backslash has no escape meaning in a single-quoted Clank string.
    singleQuoted: [[/[^']+/, 'string'], [/'/, 'string', '@pop']],
    doubleQuoted: [
      [/[^"\\]+/, 'string'],
      [/\\["\\nrt]/, 'string.escape'],
      [/\\./, 'string.escape.invalid'],
      [/"/, 'string', '@pop'],
    ],
  },
}
const configuration: languages.LanguageConfiguration = {
  brackets: [['{', '}'], ['[', ']']],
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
      open: '"',
      close: '"',
      notIn: ['string'],
    },
    {
      open: "'",
      close: "'",
      notIn: ['string'],
    },
  ],
}

export default {
  configuration,
  language,
}
