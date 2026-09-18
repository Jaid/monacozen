import Monacozen from '../src/main.tsx'

const enabled = Math.random() > 0.5
const acceptValue = (value: string | undefined) => value

export const switchingEditor = <Monacozen monaco={enabled ? {wordWrap: 'on'} : false} value='example' onChange={value => acceptValue(value)} />
