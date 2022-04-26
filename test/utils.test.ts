import { describe, expect, test } from 'vitest'
import { getMatchedMsgPath } from '../src/utils/index'

describe('getMatchedMsgPath', () => {
  const locale = {
    ch: {
      greetings: {
        hi: 'hi',
        hello: 'hello',
      },
      messages: {
        success: 'success',
        info: 'info',
        error: 'error',
      },
      fake: 'fake',
    },
    en: {
      greetings: {
        hi: 'hi',
        hello: 'hello',
      },
      messages: {
        success: 'success',
        info: 'info',
        error: 'error',
      },
      fake: 'fake',
    },
  }
  test('case 1', () => {
    expect(getMatchedMsgPath(locale, 'hello')).toBe('.greetings.hello')
  })
  test('case 2', () => {
    expect(getMatchedMsgPath(locale, 'info')).toBe('.messages.info')
  })
  test('case 3', () => {
    expect(getMatchedMsgPath(locale, 'fake')).toBe('.fake')
  })
  test('case 4', () => {
    expect(getMatchedMsgPath(locale, 'nothing')).toBe(false)
  })
})
