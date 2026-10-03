import { describe, expect, test } from 'vitest'

import { getAnswerStatus } from '../../src/libs/answers'

describe('getAnswerStatus', () => {
  test.each([
    [true, true, 'correct'],
    [true, false, 'correct'],
    [false, true, 'incorrect'],
    [false, false, 'neutral'],
  ] as const)('isCorrect=%s isSelected=%s is %s', (isCorrect, isSelected, expected) => {
    expect(getAnswerStatus({ isCorrect, isSelected })).toBe(expected)
  })
})
