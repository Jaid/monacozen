import Monacozen from '../src/main.tsx'

const enabled = Math.random() > 0.5
const acceptValue = (value: string | undefined) => value

export const switchingEditor = <Monacozen monaco={enabled ? {wordWrap: 'on'} : false} value='example' onChange={value => acceptValue(value)} />

export const explicitMonaco = <Monacozen monaco value='example' />
export const booleanMonaco = <Monacozen monaco={enabled} value='example' onChange={value => acceptValue(value)} />
