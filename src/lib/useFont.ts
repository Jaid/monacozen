import type {EditorFont} from '../types.ts'

import {useEffect, useState} from 'react'

let antimonoPromise: Promise<void> | undefined
const importAntimono = async () => {
  const {default: family} = await import('../styles/antimono.ts')
  await document.fonts.load(`14px ${family}`)
}
export const loadAntimono = () => {
  antimonoPromise ??= importAntimono()
  return antimonoPromise
}
export const useFont = (font: EditorFont) => {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<Error>()
  useEffect(() => {
    if (font !== 'antimono') {
      return
    }
    let active = true
    // Effects return cleanup synchronously; both promise outcomes are handled here.
    // eslint-disable-next-line promise/prefer-await-to-then
    void loadAntimono().then(() => {
      if (active) {
        setLoaded(true)
      }
    }, (error_: unknown) => {
      if (active) {
        setError(Error.isError(error_) ? error_ : new Error('Could not load Antimono.', {cause: error_}))
      }
    })
    return () => {
      active = false
    }
  }, [font])
  if (error && font === 'antimono') {
    throw error
  }
  return font !== 'antimono' || loaded
}
