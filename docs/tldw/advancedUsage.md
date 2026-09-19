# loading

Importing Monacozen does not initialize Monaco or load either stylesheet. Rendering the Monaco backend starts the React adapter and Monaco imports concurrently. A Suspense boundary displays the `loading` prop while they load. Monaco’s stylesheet belongs to its lazy chunks rather than the public entry, so it is fetched before the editor mounts.

Antimono has a separate stylesheet and lazy import. It is loaded only when a mounted editor selects `font='antimono'`, including when that selection comes from the default. Selecting `mono` or `dense` alone does not load it. Once the font finishes loading, mounted Monaco editors remeasure their font metrics.

Modules and styles are reused across instances and mode changes. Styles are not removed when a component unmounts. Language workers are constructed on demand; an existing `MonacoEnvironment` worker configuration is respected. Loading errors can be handled by the application’s React error boundary.

# additional languages

Set `language` to one of these IDs:

| ID | Language | Extension |
|---|---|---|
| `logsql` | VictoriaLogs LogsQL | `.logsql` |
| `metricsql` | VictoriaMetrics MetricsQL | `.metricsql` |
| `clank` | Clank, as emitted by `stringify-clank` | `.clank` |

Each definition has its own lazy chunk. Registration metadata is available when Monaco loads; the tokenizer and editor configuration load when that language is used.

The definitions provide syntax highlighting and basic editing configuration, not query execution, schema validation or a language server. LogsQL and MetricsQL cover their query operators, keywords, field or label names, calls, numeric values, durations, comments and quoted strings. Clank follows its whitespace-delimited format, including bare strings, special values, raw single-quoted strings and escaped double-quoted strings. It does not invent JSON commas, colons or comments.

The Monaco build continues to exclude `abap`, `apex`, `lexon`, `sb` and `flow9`.
