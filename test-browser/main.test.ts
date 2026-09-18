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
function App() {
  const [mode, setMode] = useState('none')
  const [font, setFont] = useState('mono')
  const [dark, setDark] = useState(true)
  const [language, setLanguage] = useState('plaintext')
  Object.assign(window, {setMode, setFont, setDark, setLanguage})
  const common = {
    font, dark, height: 240, width: 600, defaultValue: 'seed', 'aria-label': 'Text',
    onChange(value, event) {window.lastValue = value; window.events.push('change')},
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
void <Monacozen monaco={enabled ? {wordWrap: 'on'} : false} onChange={value => console.log(value)} />
const dummy: MonacozenProps = {
  monaco: false,
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
  try {
    const requests: Array<string> = []
    const errors: Array<string> = []
    const externalRequests: Array<string> = []
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
    await page.evaluate('window.setLanguage("typescript"); window.editor.setValue(\'const count: number = "wrong"\')')
    await page.waitForFunction('window.monaco.editor.getModelMarkers({resource: window.editor.getModel().uri}).some(marker => String(marker.code) === "2322")')
    expect(requests.some(path => path.includes('ts.worker'))).toBe(true)
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
  } finally {
    await browser?.close()
    await server?.stop(true)
    await fs.remove(folder)
  }
}, {timeout: 120_000})
