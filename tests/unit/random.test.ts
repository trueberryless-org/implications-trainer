import { describe, expect, test } from 'vitest'

import { pickRandom, shuffle } from '../../src/libs/random'

function createSequence(...values: number[]) {
  let index = 0

  return () => values[index++ % values.length] as number
}

describe('shuffle', () => {
  test('returns a new array with the same items', () => {
    const items = [1, 2, 3, 4, 5]
    const shuffled = shuffle(items)

    expect(shuffled).not.toBe(items)
    expect(shuffled.toSorted()).toEqual(items)
  })

  test('does not change the input', () => {
    const items = [1, 2, 3]

    shuffle(items, () => 0)

    expect(items).toEqual([1, 2, 3])
  })

  test('is deterministic for a given random source', () => {
    expect(shuffle([1, 2, 3, 4], createSequence(0, 0.5, 0.99))).toEqual(shuffle([1, 2, 3, 4], createSequence(0, 0.5, 0.99)))
  })

  test('actually moves items', () => {
    expect(shuffle([1, 2, 3], () => 0)).toEqual([2, 3, 1])
  })

  test('handles empty and single item arrays', () => {
    expect(shuffle([])).toEqual([])
    expect(shuffle([1])).toEqual([1])
  })
})

describe('pickRandom', () => {
  test('picks by the random value', () => {
    expect(pickRandom(['a', 'b', 'c'], () => 0)).toBe('a')
    expect(pickRandom(['a', 'b', 'c'], () => 0.5)).toBe('b')
    expect(pickRandom(['a', 'b', 'c'], () => 0.999)).toBe('c')
  })
})
