import {useState} from 'react'
import Monacozen from 'monacozen'

const [text, setText] = useState<string>('')

<Monacozen
  language='typescript'
  value={text}
  onChange={value => setText(value ?? '')}
/>
