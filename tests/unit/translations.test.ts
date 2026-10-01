import { describe, expect, test } from 'vitest'

import de from '../../src/i18n/de.json'
import en from '../../src/i18n/en.json'
import { getTranslations } from '../../src/libs/translations'

describe('getTranslations', () => {
  test('returns the title and the ui strings of a language', () => {
    expect(getTranslations('de').title).toBe('Implikations-Trainer')
    expect(getTranslations('en').ui('newQuestion')).toBe('New question')
  })

  test('translates every ui key in every language', () => {
    expect(Object.keys(de.ui).toSorted()).toEqual(Object.keys(en.ui).toSorted())
  })

  test('has the same templates and enough terms in every language', () => {
    expect(Object.keys(de.templates).toSorted()).toEqual(Object.keys(en.templates).toSorted())
    expect(de.terms.length).toBeGreaterThanOrEqual(3)
    expect(en.terms.length).toBeGreaterThanOrEqual(3)
  })
})
