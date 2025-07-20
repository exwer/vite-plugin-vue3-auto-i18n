import { describe, it, expect } from 'vitest'
import { transformReact } from '../src/plugins/react'

describe('React JSX Transformation', () => {
  const locale = {
    en: {
      message: {
        hello: 'Hello World',
        welcome: 'Welcome',
        buttons: {
          submit: 'Submit',
          cancel: 'Cancel',
          save: 'Save Changes'
        },
        errors: {
          required: 'This field is required',
          invalid: 'Invalid input format'
        }
      }
    },
    zh: {
      message: {
        hello: '你好世界',
        welcome: '欢迎',
        buttons: {
          submit: '提交',
          cancel: '取消',
          save: '保存更改'
        },
        errors: {
          required: '此字段为必填项',
          invalid: '输入格式无效'
        }
      }
    }
  }

  describe('JSX Text Nodes', () => {
    it('should transform simple text nodes', () => {
      const source = `
import React from 'react'

function App() {
  return (
    <div>
      hello world
      <p>welcome</p>
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.code).toContain('{t(\'message.hello\')}')
      expect(result.code).toContain('{t(\'message.welcome\')}')
      expect(result.matches).toHaveLength(2)
    })

    it('should transform nested text nodes', () => {
      const source = `
import React from 'react'

function App() {
  return (
    <div>
      <header>
        <h1>hello world</h1>
        <nav>
          <a href="#" title="welcome">Link</a>
        </nav>
      </header>
      <main>
        <p>welcome to our app</p>
      </main>
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.code).toContain('{t(\'message.hello\')}')
      expect(result.code).toContain('{t(\'message.welcome\')}')
      expect(result.matches).toHaveLength(2)
    })
  })

  describe('JSX Attributes', () => {
    it('should transform attribute values', () => {
      const source = `
import React from 'react'

function App() {
  return (
    <div>
      <input placeholder="Enter your name" />
      <button title="submit">Click me</button>
      <img alt="welcome" src="/image.jpg" />
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.code).toContain('placeholder="Enter your name"')
      expect(result.code).toContain('title={t(\'message.buttons.submit\')}')
      expect(result.code).toContain('alt={t(\'message.welcome\')}')
    })

    it('should transform aria-label attributes', () => {
      const source = `
import React from 'react'

function App() {
  return (
    <div>
      <button aria-label="submit">Click</button>
      <input aria-describedby="required" />
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.code).toContain('aria-label={t(\'message.buttons.submit\')}')
      expect(result.code).toContain('aria-describedby="required"')
    })
  })

  describe('React Hooks', () => {
    it('should transform useState initial values', () => {
      const source = `
import React, { useState } from 'react'

function App() {
  const [title, setTitle] = useState('hello world')
  const [buttonText, setButtonText] = useState('submit')
  
  return (
    <div>
      <h1>{title}</h1>
      <button>{buttonText}</button>
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.code).toContain('useState(t(\'message.hello\'))')
      expect(result.code).toContain('useState(t(\'message.buttons.submit\'))')
    })

    it('should transform useMemo with text', () => {
      const source = `
import React, { useMemo } from 'react'

function App() {
  const messages = useMemo(() => ({
    title: 'hello world',
    button: 'submit'
  }), [])
  
  return (
    <div>
      <h1>{messages.title}</h1>
      <button>{messages.button}</button>
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.code).toContain('title: t(\'message.hello\')')
      expect(result.code).toContain('button: t(\'message.buttons.submit\')')
    })
  })

  describe('Template Literals', () => {
    it('should transform template literals in JSX', () => {
      const source = `
import React from 'react'

function App() {
  const message = \`hello world\`
  const buttonText = \`submit\`
  
  return (
    <div>
      <h1>{message}</h1>
      <button>{buttonText}</button>
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.code).toContain('t(\'message.hello\')')
      expect(result.code).toContain('t(\'message.buttons.submit\')')
    })
  })

  describe('Array and Object Literals', () => {
    it('should transform array literals', () => {
      const source = `
import React from 'react'

function App() {
  const buttons = ['submit', 'cancel']
  
  return (
    <div>
      {buttons.map((text, index) => (
        <button key={index}>{text}</button>
      ))}
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.code).toContain('t(\'message.buttons.submit\')')
      expect(result.code).toContain('t(\'message.buttons.submit\')')
      expect(result.code).toContain('t(\'message.buttons.cancel\')')
    })

    it('should transform object literals', () => {
      const source = `
import React from 'react'

function App() {
  const messages = {
    title: 'hello world',
    button: 'submit'
  }
  
  return (
    <div>
      <h1>{messages.title}</h1>
      <button>{messages.button}</button>
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.code).toContain('title: t(\'message.hello\')')
      expect(result.code).toContain('button: t(\'message.buttons.submit\')')
    })
  })

  describe('Error Handling', () => {
    it('should handle malformed JSX gracefully', () => {
      const source = `
import React from 'react'

function App() {
  return (
    <div>
      <h1>hello world
      <p>welcome
    </div>
  )
}
`
      const result = transformReact(source, { locale })
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('JSX')
    })

    it('should handle non-JSX files', () => {
      const source = `
const message = 'hello world'
console.log(message)
`
      const result = transformReact(source, { locale })
      expect(result.code).toBe(source)
      expect(result.matches).toHaveLength(0)
    })
  })

  describe('Performance', () => {
    it('should handle large JSX files efficiently', () => {
      const largeJSX = `
import React from 'react'

function LargeComponent() {
  return (
    <div>
      ${Array(100).fill(0).map((_, i) => `<p key="${i}">hello world</p>`).join('\n      ')}
    </div>
  )
}
`
      const startTime = Date.now()
      const result = transformReact(largeJSX, { locale })
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
      expect(result.matches).toHaveLength(100)
      expect(result.errors).toHaveLength(0)
    })
  })
}) 
