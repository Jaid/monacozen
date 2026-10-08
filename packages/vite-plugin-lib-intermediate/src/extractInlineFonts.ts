import {createHash} from 'node:crypto'

export type EmitFont = (name: string, extension: string, source: Uint8Array) => string

const fontDataUrlPattern = /url\((["']?)data:font\/([\w+\-.]+);base64,([\w+/=]+)\1\)/gu
const fontFacePropertyPattern = (property: string) => new RegExp(String.raw`${property}:\s*["']?([^"';}]+)`, 'u')
const getFontFace = (css: string, offset: number) => {
  const start = css.lastIndexOf('@font-face', offset)
  if (start === -1 || css.slice(start, offset).includes('}')) {
    return
  }
  const end = css.indexOf('}', offset)
  return css.slice(start, end === -1 ? undefined : end)
}
const getFontName = (fontFace: string | undefined) => {
  if (!fontFace) {
    return 'font'
  }
  const family = fontFacePropertyPattern('font-family').exec(fontFace)?.[1]
  const weight = fontFacePropertyPattern('font-weight').exec(fontFace)?.[1]
  const style = fontFacePropertyPattern('font-style').exec(fontFace)?.[1]
  const parts = [family ?? 'font', weight, style === 'normal' ? undefined : style].filter(Boolean) as Array<string>
  return parts.join('-').toLowerCase().replaceAll(/[^\da-z]+/gu, '-').replaceAll(/^-|-$/gu, '')
}

// Base64 fonts cannot be compressed or cached separately, and browsers download every inlined face.
// As files, only the faces a page actually renders are fetched.
export const extractInlineFonts = (css: string, emit: EmitFont) => css.replaceAll(fontDataUrlPattern, (_match, quote: string, type: string, data: string, offset: number) => {
  const source = Uint8Array.fromBase64(data)
  const extension = type.replace(/^x-/u, '')
  const path = emit(getFontName(getFontFace(css, offset)), extension, source)
  return `url(${quote}${path}${quote})`
})

export const hashFont = (source: Uint8Array) => createHash('sha256').update(source).digest('hex').slice(0, 8)
