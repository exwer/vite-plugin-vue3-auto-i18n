import { expect, test } from 'vitest'
import { getMatchedMsgPath } from '../src/utils/index'

test('getMatchedMsgPath', () => {
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
  expect(getMatchedMsgPath(locale, 'hello')).toBe('.greetings.hello')
  expect(getMatchedMsgPath(locale, 'info')).toBe('.messages.info')
  expect(getMatchedMsgPath(locale, 'fake')).toBe('.fake')
  expect(getMatchedMsgPath(locale, 'nothing')).toBe(false)
})
