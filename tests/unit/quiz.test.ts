import { describe, expect, test } from 'vitest'

import quizData from '../../src/data/quiz-templates.json'
import en from '../../src/i18n/en.json'
import {
  expandCorrectConclusions,
  fillTemplate,
  generateMultiChoiceQuiz,
  ensureCorrectAnswer,
  generateQuiz,
  type QuizItem,
} from '../../src/libs/quiz'

const items = quizData.data as QuizItem[]

function createSeededRandom(seed: number) {
  let state = seed

  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296

    return state / 4294967296
  }
}

const seeds = Array.from({ length: 200 }, (_, index) => index + 1)

describe('fillTemplate', () => {
  test('replaces the subject and the object', () => {
    expect(fillTemplate('All {sub} are {obj}.', 'cats', 'animals')).toBe('All cats are animals.')
  })
})

describe('generateQuiz', () => {
  test.each(['en', 'de'] as const)('creates two statements and five answers in %s', (language) => {
    const quiz = generateQuiz(language, createSeededRandom(1))

    expect(quiz.baseSentences).toHaveLength(2)
    expect(quiz.answers).toHaveLength(5)
  })

  test.each(seeds)('has exactly one correct answer and the unknown answer last (seed %i)', (seed) => {
    const { answers } = generateQuiz('en', createSeededRandom(seed))

    expect(answers.filter(({ isCorrect }) => isCorrect)).toHaveLength(1)
    expect(answers.at(-1)?.sentence).toBe(en.templates.unknown)
  })

  test('uses different terms for different random sources', () => {
    const sentences = new Set(seeds.map((seed) => generateQuiz('en', createSeededRandom(seed)).baseSentences.join('|')))

    expect(sentences.size).toBeGreaterThan(50)
  })

  test('does not repeat a term within one question', () => {
    for (const seed of seeds) {
      const { baseSentences } = generateQuiz('en', createSeededRandom(seed))
      const terms = baseSentences.flatMap((sentence) => en.terms.filter((term) => sentence.includes(term)))

      expect(new Set(terms).size).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('expandCorrectConclusions', () => {
  test('derives symmetric conclusions without duplicates', () => {
    const item: QuizItem = {
      correct: [{ object: 'Z', subject: 'X', type: 'all' }],
      statements: [
        { object: 'Y', subject: 'X', type: 'all' },
        { object: 'Z', subject: 'Y', type: 'all' },
      ],
    }
    const keys = expandCorrectConclusions(item).map(({ object, subject, type }) => `${type}:${subject}->${object}`)

    expect(keys).toContain('all:X->Z')
    expect(keys).toContain('some:X->Z')
    expect(keys).toContain('some:Z->X')
    expect(new Set(keys).size).toBe(keys.length)
  })

  test('derives the converse of none and the some_none conclusions', () => {
    const item: QuizItem = {
      correct: [{ object: 'Y', subject: 'X', type: 'none' }],
      statements: [
        { object: 'Y', subject: 'X', type: 'none' },
        { object: 'Z', subject: 'Y', type: 'all' },
      ],
    }
    const keys = expandCorrectConclusions(item).map(({ object, subject, type }) => `${type}:${subject}->${object}`)

    expect(keys).toEqual(expect.arrayContaining(['none:Y->X', 'some_none:X->Y', 'some_none:Y->X']))
  })

  test('keeps unknown conclusions as they are', () => {
    const item: QuizItem = {
      correct: [{ object: 'Z', subject: 'X', type: 'unknown' }],
      statements: [
        { object: 'Y', subject: 'X', type: 'some' },
        { object: 'Z', subject: 'Y', type: 'some' },
      ],
    }

    expect(expandCorrectConclusions(item).map(({ type }) => type)).toContain('unknown')
  })
})

describe('ensureCorrectAnswer', () => {
  const wrong = { isCorrect: false, sentence: 'wrong' }
  const right = { isCorrect: true, sentence: 'right' }

  test('keeps a selection that already has a correct answer', () => {
    expect(ensureCorrectAnswer([wrong, right], [wrong, right])).toEqual([wrong, right])
  })

  test('swaps in a correct answer when the selection has none', () => {
    const answers = ensureCorrectAnswer([wrong, { ...wrong, sentence: 'other' }], [wrong, right])

    expect(answers).toHaveLength(2)
    expect(answers).toContainEqual(right)
  })

  test('returns the selection when there is no correct answer to add', () => {
    expect(ensureCorrectAnswer([wrong], [wrong])).toEqual([wrong])
  })
})

describe('generateMultiChoiceQuiz', () => {
  test.each(seeds)('has at most six unique answers and at least one correct (seed %i)', (seed) => {
    const { answers, baseSentences } = generateMultiChoiceQuiz('en', createSeededRandom(seed))
    const sentences = answers.map(({ sentence }) => sentence)

    expect(baseSentences).toHaveLength(2)
    expect(answers.length).toBeLessThanOrEqual(6)
    expect(new Set(sentences).size).toBe(sentences.length)
    expect(answers.some(({ isCorrect }) => isCorrect)).toBe(true)
    expect(sentences.every((sentence) => !baseSentences.includes(sentence))).toBe(true)
  })

  test('never offers the unknown quantifier', () => {
    for (const seed of seeds) {
      const { answers } = generateMultiChoiceQuiz('en', createSeededRandom(seed))

      expect(answers.every(({ sentence }) => sentence !== en.templates.unknown)).toBe(true)
    }
  })

  test('has more than one possible quiz item', () => {
    expect(items.length).toBeGreaterThan(5)
  })
})
