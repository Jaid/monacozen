import type {Browser} from 'puppeteer-core'

import {expect, test} from 'bun:test'
import {tmpdir} from 'node:os'
import {dirname, join, resolve} from 'node:path'

import fs from 'fs-extra'
import puppeteer from 'puppeteer-core'
import {build} from 'vite'

const root = resolve(import.meta.dir, '..')
// Exercise the published files through a second, independent Vite build.
const app = `import React, {useState} from 'react'
import {createRoot} from 'react-dom/client'
import Monacozen from 'monacozen'
window.events = []
window.workerLabels = []
const NativeWorker = window.Worker
window.Worker = class extends NativeWorker {
  constructor(url, options) {
    super(url, options)
    window.workerLabels.push(options?.name)
  }
}
function App() {
  const [mode, setMode] = useState('none')
  const [font, setFont] = useState('mono')
  const [dark, setDark] = useState(true)
  const [language, setLanguage] = useState('plaintext')
  const [schema, setSchema] = useState()
  Object.assign(window, {setMode, setFont, setDark, setLanguage, setSchema})
  const common = {
    font, dark, schema, height: 240, width: 600, defaultValue: 'seed', 'aria-label': 'Text',
    onChange(value, event) {window.lastValue = value; window.events.push('change')},
    onValidate(markers) {window.markers = markers},
    onInput() {window.events.push('input')},
    onFocus() {window.events.push('focus')},
    onBlur() {window.events.push('blur')},
    onKeyDown() {window.events.push('keydown')},
    onKeyUp() {window.events.push('keyup')},
    onPaste() {window.events.push('paste')},
    onCopy() {window.events.push('copy')},
    onCut() {window.events.push('cut')},
    onContextMenu() {window.events.push('contextmenu')},
    onCompositionStart() {window.events.push('compositionstart')},
    onCompositionEnd() {window.events.push('compositionend')},
  }
  if (mode === 'none') return React.createElement('div', null, 'Not mounted')
  if (mode === 'dummy') return React.createElement(Monacozen, {...common, monaco: false, onMount(input) {window.dummy = input}})
  return React.createElement(Monacozen, {...common, language, monaco: {padding: {top: 6}}, onMount(editor, monaco) {window.editor = editor; window.monaco = monaco}})
}
createRoot(document.getElementById('root')).render(React.createElement(App))
`
const consumerTypes = `import Monacozen, {DummyEditor, type MonacozenProps} from 'monacozen'
const enabled = Math.random() > 0.5
void <Monacozen language='yaml' schema={{type: 'object'}} monaco={enabled ? {wordWrap: 'on'} : false} onChange={value => console.log(value)} />
const dummy: MonacozenProps = {
  monaco: false,
  schema: {type: 'object'},
  onChange(value, event) {const text: string = event.currentTarget.value; void [text, value]},
  onMount(input) {input.setSelectionRange(0, 1)},
}
const rich: MonacozenProps = {
  monaco: {padding: {top: 6}},
  onMount(editor, monaco) {
    editor.setSelection(new monaco.Selection(1, 1, 1, 1))
    const model = editor.getModel()
    if (model) monaco.editor.setModelLanguage(model, 'logsql')
  },
}
void <Monacozen {...dummy} />
void <Monacozen {...rich} />
void <DummyEditor onKeyDown={event => event.currentTarget.select()} />
// @ts-expect-error The old prop was renamed.
void <Monacozen options={{fontSize: 16}} />
// @ts-expect-error The font prop owns the font family.
void <Monacozen monaco={{fontFamily: 'serif'}} />
`
test('a clean consumer loads editors, styles and language grammars only on demand', async () => {
  const folder = await fs.mkdtemp(join(tmpdir(), 'monacozen-browser-'))
  let browser: Browser | undefined
  let server: Bun.Server<undefined> | undefined
  const errors: Array<string> = []
  try {
    const requests: Array<string> = []
    const externalRequests: Array<string> = []
    const schemaRequests: Array<string> = []
    const moduleFolder = join(folder, 'node_modules')
    const packageFolder = join(root, 'dist/monacozen/production')
    const assets = await fs.readdir(join(packageFolder, 'assets'))
    const stylesheets = assets.filter(file => file.endsWith('.css'))
    expect(stylesheets).toHaveLength(2)
    expect(stylesheets.some(file => file.startsWith('antimono-'))).toBe(true)
    expect(stylesheets.some(file => file.startsWith('monaco-'))).toBe(true)
    const entry = await fs.readFile(join(packageFolder, 'src/main.js'), 'utf8')
    expect(entry).toContain('import(')
    expect(entry).not.toContain('.css')
    const declaration = await fs.readFile(join(packageFolder, 'lib.d.ts'), 'utf8')
    expect(declaration).not.toMatch(/(?:from\s*|import\s*\()["'](?:monaco-editor|\.\/monaco)/u)
    await fs.copy(packageFolder, join(moduleFolder, 'monacozen'))
    for (const name of ['react', 'react-dom', 'scheduler', '@types/react', '@types/react-dom']) {
      const packageFile = Bun.resolveSync(`${name}/package.json`, root)
      await fs.copy(dirname(packageFile), join(moduleFolder, name), {dereference: true})
    }
    const reactTypes = dirname(Bun.resolveSync('@types/react/package.json', root))
    const cssTypes = dirname(Bun.resolveSync('csstype/package.json', reactTypes))
    await fs.copy(cssTypes, join(moduleFolder, 'csstype'), {dereference: true})
    await fs.outputJson(join(folder, 'package.json'), {type: 'module'})
    await fs.writeFile(join(folder, 'index.html'), '<link rel="icon" href="data:,"><div id="root"></div><script type="module" src="/app.jsx"></script>')
    await fs.writeFile(join(folder, 'app.jsx'), app)
    await fs.writeFile(join(folder, 'types.tsx'), consumerTypes)
    expect(await fs.pathExists(join(moduleFolder, 'monaco-editor'))).toBe(false)
    expect(await fs.pathExists(join(moduleFolder, 'monaco-yaml'))).toBe(false)
    for (const moduleResolution of ['bundler', 'nodenext']) {
      await fs.outputJson(join(folder, 'tsconfig.json'), {
        compilerOptions: {
          jsx: 'react-jsx',
          lib: ['dom', 'esnext'],
          module: moduleResolution === 'nodenext' ? 'nodenext' : 'preserve',
          moduleResolution,
          strict: true,
          skipLibCheck: false,
          noEmit: true,
          types: ['react'],
        },
        include: ['types.tsx'],
      })
      const check = Bun.spawn(['bun', join(root, 'node_modules/typescript/bin/tsc'), '--project', join(folder, 'tsconfig.json'), '--pretty', 'false'], {
        stdout: 'pipe',
        stderr: 'pipe',
      })
      const stdoutResponse = new Response(check.stdout)
      const stderrResponse = new Response(check.stderr)
      const [stdout, stderr, status] = await Promise.all([stdoutResponse.text(), stderrResponse.text(), check.exited])
      expect({
        stdout,
        stderr,
        status,
      }).toEqual({
        stdout: '',
        stderr: '',
        status: 0,
      })
    }
    await build({
      configFile: false,
      root: folder,
      logLevel: 'warn',
      build: {
        target: 'esnext',
        outDir: 'dist',
        chunkSizeWarningLimit: 10_000,
      },
    })
    server = Bun.serve({
      hostname: '127.0.0.1',
      port: 0,
      async fetch(request) {
        const url = new URL(request.url)
        const pathname = decodeURIComponent(url.pathname)
        if (pathname === '/schemas/editor.json') {
          schemaRequests.push(pathname)
          return Response.json({
            type: 'object',
            additionalProperties: false,
            required: ['name'],
            properties: {
              name: {
                type: 'string',
                description: 'Name of this editor configuration.',
              },
              mode: {enum: ['fast', 'safe']},
              enabled: {$ref: './types.json#/definitions/enabled'},
            },
          })
        }
        if (pathname === '/schemas/types.json') {
          schemaRequests.push(pathname)
          return Response.json({definitions: {enabled: {type: 'boolean'}}})
        }
        const file = Bun.file(join(folder, 'dist', pathname === '/' ? 'index.html' : pathname.slice(1)))
        return await file.exists() ? new Response(file) : new Response('Not found', {status: 404})
      },
    })
    const origin = server.url.origin
    browser = await puppeteer.launch({
      executablePath: Bun.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      headless: true,
    })
    const page = await browser.newPage()
    page.on('pageerror', error => errors.push(String(error)))
    page.on('console', message => {
      if (message.type() === 'error' || message.type() === 'warn') {
        errors.push(message.text())
      }
    })
    page.on('requestfailed', request => errors.push(`${request.url()} ${request.failure()?.errorText}`))
    await page.setRequestInterception(true)
    // Puppeteer interception is asynchronous; this listener catches every rejection.
    // eslint-disable-next-line typescript/no-misused-promises
    page.on('request', async request => {
      try {
        const url = request.url()
        if (url.startsWith('http') && !url.startsWith(origin)) {
          externalRequests.push(url)
          await request.abort()
        } else {
          if (url.startsWith(origin)) {
            const parsedUrl = new URL(url)
            requests.push(parsedUrl.pathname)
          }
          await request.continue()
        }
      } catch (error) {
        errors.push(String(error))
      }
    })
    await page.goto(origin)
    await page.waitForFunction('typeof window.setMode === "function"')
    expect(requests.filter(path => path.endsWith('.css'))).toEqual([])
    const initially = [...requests]
    await page.evaluate('window.setMode("dummy")')
    await page.waitForSelector('textarea')
    await page.focus('textarea')
    await page.type('textarea', ' edit')
    await page.evaluate('for (const type of [\'paste\', \'copy\', \'cut\', \'contextmenu\', \'compositionstart\', \'compositionend\']) window.dummy.dispatchEvent(new Event(type, {bubbles: true})); window.dummy.blur()')
    const events = await page.evaluate('window.events') as Array<string>
    for (const event of ['change', 'input', 'focus', 'blur', 'keydown', 'keyup', 'paste', 'copy', 'cut', 'contextmenu', 'compositionstart', 'compositionend']) {
      expect(events).toContain(event)
    }
    expect(requests.filter(path => path.endsWith('.css'))).toEqual([])
    expect(await page.evaluate('window.monaco === undefined')).toBe(true)
    const value = await page.$eval('textarea', input => input.value)
    await page.evaluate('window.setDark(false)')
    await page.waitForFunction('getComputedStyle(window.dummy).backgroundColor === "rgb(255, 255, 255)"')
    expect(await page.evaluate('getComputedStyle(window.dummy).color')).toBe('rgb(0, 0, 0)')
    await page.evaluate('window.setFont("antimono")')
    await page.waitForFunction('document.fonts.check("14px Antimono") && Array.from(document.styleSheets).some(sheet => sheet.href?.includes("antimono"))')
    expect(requests.some(path => /antimono.*\.css$/.test(path))).toBe(true)
    expect(requests.some(path => /(?:monaco|editor\.api).*\.js$/.test(path))).toBe(false)
    const dummyRequests = requests.slice(initially.length)
    await page.evaluate('window.setFont("mono"); window.setDark(true); window.setMode("monaco")')
    await page.waitForFunction('!!window.editor && !!window.monaco', {timeout: 30_000})
    expect(await page.evaluate('window.editor.getValue()')).toBe(value)
    expect(await page.evaluate('getComputedStyle(document.querySelector(".monaco-editor")).backgroundColor')).toBe('rgb(0, 0, 0)')
    const languages = await page.evaluate('window.monaco.languages.getLanguages().map(language => language.id)') as Array<string>
    for (const id of ['logsql', 'metricsql', 'clank']) {
      expect(languages).toContain(id)
    }
    for (const id of ['abap', 'apex', 'lexon', 'sb', 'flow9']) {
      expect(languages).not.toContain(id)
    }
    const samples = {
      logsql: '_time:5m level:error | stats by (service) count() as total # comment',
      metricsql: 'sum(rate(http_requests_total{status=~"5.."}[5m])) by (job) default 0 # comment',
      clank: String.raw`age 5 enabled true pets [{ name Rex}] note '#literal\nraw'`,
    }
    for (const [id, sample] of Object.entries(samples)) {
      await page.evaluate(({id: languageId, sample: text}) => {
        const w = globalThis as unknown as {
          editor: {
            getModel: () => unknown
            setValue: (value: string) => void
          }
          monaco: {editor: {setModelLanguage: (model: unknown, id: string) => void}}
        }
        w.editor.setValue(text)
        w.monaco.editor.setModelLanguage(w.editor.getModel(), languageId)
      }, {
        id,
        sample,
      })
      await page.waitForFunction(`window.monaco.editor.tokenize(window.editor.getValue(), ${JSON.stringify(id)}).flat().some(token => token.type.endsWith('.${id}'))`)
      const tokenTypes = await page.evaluate(`window.monaco.editor.tokenize(window.editor.getValue(), ${JSON.stringify(id)}).flat().map(token => token.type)`) as Array<string>
      expect(tokenTypes).toContain(`number.${id}`)
      expect(tokenTypes).toContain(`keyword.${id}`)
      expect(tokenTypes.some(type => type.includes('invalid'))).toBe(false)
    }
    // The worker URL must still work after the consumer bundles the package again.
    await page.evaluate('window.setLanguage("json"); window.editor.setValue(\'{"value": }\')')
    await page.waitForFunction('window.monaco.editor.getModelMarkers({resource: window.editor.getModel().uri}).length > 0')
    expect(requests.some(path => path.includes('json.worker'))).toBe(true)
    const inlineSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          description: 'Name of this editor configuration.',
        },
        mode: {enum: ['fast', 'safe']},
        enabled: {type: 'boolean'},
      },
    }
    // The language-agnostic schema prop applies directly to JSON.
    await page.evaluate(schema => {
      const w = globalThis as unknown as {
        editor: {setValue: (value: string) => void}
        setSchema: (schema: unknown) => void
      }
      w.setSchema(schema)
      w.editor.setValue('{"name": 42, "enabled": "nope"}')
    }, inlineSchema)
    await page.waitForFunction('window.monaco.editor.getModelMarkers({owner: "json", resource: window.editor.getModel().uri}).length === 2')
    const jsonMessages = await page.evaluate(String.raw`window.monaco.editor.getModelMarkers({owner: "json", resource: window.editor.getModel().uri}).map(marker => marker.message).join("\n")`) as string
    expect(jsonMessages).toContain('string')
    expect(jsonMessages).toContain('boolean')
    // The same prop is ignored when the active language has no schema service.
    await page.evaluate('window.setLanguage("typescript"); window.editor.setValue(\'const count: number = "wrong"\')')
    await page.waitForFunction('window.monaco.editor.getModelMarkers({resource: window.editor.getModel().uri}).some(marker => String(marker.code) === "2322")')
    expect(requests.some(path => path.includes('ts.worker'))).toBe(true)
    expect(requests.some(path => path.includes('yaml.worker'))).toBe(false)
    expect(schemaRequests).toEqual([])
    // The same in-memory schema is automatically applied after switching to YAML.
    await page.evaluate(schema => {
      const w = globalThis as unknown as {
        editor: {setValue: (value: string) => void}
        setLanguage: (language: string) => void
        setSchema: (schema: unknown) => void
      }
      w.setLanguage('yaml')
      w.setSchema(schema)
      w.editor.setValue('name: 42\nenabled: nope\n')
    }, inlineSchema)
    await page.waitForFunction('window.monaco.editor.getModelMarkers({owner: "yaml", resource: window.editor.getModel().uri}).length === 2')
    const inlineYamlMessages = await page.evaluate(String.raw`window.monaco.editor.getModelMarkers({owner: "yaml", resource: window.editor.getModel().uri}).map(marker => marker.message).join("\n")`) as string
    expect(inlineYamlMessages).toContain('string')
    expect(inlineYamlMessages).toContain('boolean')
    expect(schemaRequests).toEqual([])
    await page.evaluate('window.setSchema(undefined)')
    await page.waitForFunction('window.monaco.editor.getModelMarkers({owner: "yaml", resource: window.editor.getModel().uri}).length === 0')
    // YAML schema directives still work without importing or configuring monaco-yaml in the consumer.
    const directive = `# yaml-language-server: $schema=${origin}/schemas/editor.json`
    const invalidYaml = `${directive}\nname: 42\nenabled: nope\n`
    await page.evaluate(`window.setLanguage('yaml'); window.editor.setValue(${JSON.stringify(invalidYaml)})`)
    await page.waitForFunction('window.monaco.editor.getModelMarkers({owner: "yaml", resource: window.editor.getModel().uri}).length === 2')
    await page.waitForFunction('window.markers?.filter(marker => marker.owner === "yaml").length === 2')
    const yamlMessages = await page.evaluate(String.raw`window.markers.map(marker => marker.message).join("\n")`) as string
    expect(yamlMessages).toContain('string')
    expect(yamlMessages).toContain('boolean')
    expect(schemaRequests).toContain('/schemas/editor.json')
    expect(schemaRequests).toContain('/schemas/types.json')
    expect(requests.some(path => path.includes('yaml.worker'))).toBe(true)
    // Filename detection and multiple models use the same YAML service.
    const yamlWorkersBeforeSecondModel = await page.evaluate('window.workerLabels.filter(label => label === "yaml").length') as number
    const secondYaml = `${directive}\nname: false\n`
    await page.evaluate(`window.secondModel = window.monaco.editor.createModel(${JSON.stringify(secondYaml)}, undefined, window.monaco.Uri.parse(${JSON.stringify(`${origin}/settings.yml`)}))`)
    expect(await page.evaluate('window.secondModel.getLanguageId()')).toBe('yaml')
    await page.waitForFunction('window.monaco.editor.getModelMarkers({owner: "yaml", resource: window.secondModel.uri}).some(marker => marker.message.includes("string"))')
    await page.evaluate('window.secondModel.dispose()')
    expect(await page.evaluate('window.monaco.editor.getModelMarkers({owner: "yaml", resource: window.editor.getModel().uri}).length')).toBe(2)
    expect(await page.evaluate('window.workerLabels.filter(label => label === "yaml").length')).toBe(yamlWorkersBeforeSecondModel)
    // Exercise completion and hover through the actual editor UI, not a separate language service.
    const completionYaml = `${directive}\nname: Monacozen\nmode: `
    await page.evaluate(`window.editor.setValue(${JSON.stringify(completionYaml)}); window.editor.focus(); window.editor.setPosition({lineNumber: 3, column: 7}); window.editor.trigger('test', 'editor.action.triggerSuggest', {})`)
    await page.waitForFunction('document.querySelector(".suggest-widget.visible")?.textContent.includes("safe")')
    const suggestions = await page.$eval('.suggest-widget.visible', element => element.textContent)
    expect(suggestions).toContain('fast')
    expect(suggestions).toContain('safe')
    await page.keyboard.press('Escape')
    await page.evaluate('window.editor.setPosition({lineNumber: 2, column: 2}); window.editor.trigger("test", "editor.action.showHover", {})')
    await page.waitForFunction('Array.from(document.querySelectorAll(".monaco-hover")).some(element => element.textContent.includes("Name of this editor configuration."))')
    await page.keyboard.press('Escape')
    const unformattedYaml = `${directive}\nname: Monacozen\nmode:   safe\nenabled:    true`
    await page.evaluate(`window.editor.setValue(${JSON.stringify(unformattedYaml)})`)
    await page.evaluate('window.editor.getAction("editor.action.formatDocument").run()')
    expect(await page.evaluate('window.editor.getValue()')).toBe(`${directive}\nname: Monacozen\nmode: safe\nenabled: true\n`)
    await page.waitForFunction('window.monaco.editor.getModelMarkers({owner: "yaml", resource: window.editor.getModel().uri}).length === 0')
    // Syntax validation remains active without an associated schema.
    await page.evaluate(String.raw`window.editor.setValue("duplicate: true\nduplicate: false\n")`)
    await page.waitForFunction('window.monaco.editor.getModelMarkers({owner: "yaml", resource: window.editor.getModel().uri}).some(marker => marker.message.includes("unique"))')
    await page.evaluate(String.raw`window.editor.setValue("duplicate: true\n")`)
    await page.waitForFunction('window.monaco.editor.getModelMarkers({owner: "yaml", resource: window.editor.getModel().uri}).length === 0')
    await page.evaluate(text => {
      const w = globalThis as unknown as {editor: {setValue: (text: string) => void}}
      w.editor.setValue(text)
    }, samples.clank)
    await page.evaluate('window.setMode("dummy")')
    await page.waitForSelector('textarea')
    expect(await page.$eval('textarea', input => input.value)).toBe(samples.clank)
    expect(externalRequests).toEqual([])
    expect(errors).toEqual([])
    console.log(JSON.stringify({
      initialRequests: initially,
      dummyRequests,
      styles: requests.filter(path => path.endsWith('.css')),
      totalRequests: requests.length,
    }, null, 2))
  } catch (error) {
    console.error('Browser errors:', errors)
    if (browser) {
      const pages = await browser.pages()
      console.error('Browser state:', await pages.at(-1)?.evaluate('({labels: window.workerLabels, markers: window.monaco?.editor.getModelMarkers({}), language: window.editor?.getModel()?.getLanguageId(), value: window.editor?.getValue()})'))
    }
    throw error
  } finally {
    await browser?.close()
    await server?.stop(true)
    await fs.remove(folder)
  }
}, {timeout: 120_000})
