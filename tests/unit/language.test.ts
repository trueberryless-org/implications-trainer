import { describe, expect, test } from 'vitest'

import { DEFAULT_LANGUAGE, getLanguageFromPathname, isLanguage } from '../../src/libs/language'

describe('isLanguage', () => {
  test.each(['en', 'de'])('accepts %s', (value) => {
    expect(isLanguage(value)).toBe(true)
  })

  test.each(['fr', '', 'toString', 'constructor', undefined, 1])('rejects %s', (value) => {
    expect(isLanguage(value)).toBe(false)
  })
})

describe('getLanguageFromPathname', () => {
  test('reads the first path segment', () => {
    expect(getLanguageFromPathname('/de/multi-choice')).toBe('de')
    expect(getLanguageFromPathname('/en/')).toBe('en')
  })

  test.each(['/', '/fr/', '/api/quiz', ''])('falls back to the default language for %j', (pathname) => {
    expect(getLanguageFromPathname(pathname)).toBe(DEFAULT_LANGUAGE)
  })
})
