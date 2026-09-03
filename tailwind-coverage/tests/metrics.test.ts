import { describe, expect, test } from 'bun:test'

import { scoreCoverage } from '../src/metrics'

describe('coverage score contract', () => {
  test('publishes classname breadth without allowing token expansion to hide a family gap', () => {
    const score = scoreCoverage(
      [
        {
          id: 'color',
          candidates: Array.from({ length: 100 }, (_, index) => `color-${index}`),
        },
        { id: 'layout', candidates: ['grid'] },
      ],
      (candidate) => candidate.startsWith('color-')
    )

    expect(score.candidateRate).toBeCloseTo(100 / 101)
    expect(score.familyMacroRate).toBe(0.5)
    expect(score.fullFamilies).toBe(1)
    expect(score.emptyFamilies).toBe(1)
  })

  test('only counts a family as full when every applicable classname passes', () => {
    const score = scoreCoverage(
      [{ id: 'spacing', candidates: ['p-1', 'p-2', 'p-3'] }],
      (candidate) => candidate !== 'p-2'
    )

    expect(score.candidatePassed).toBe(2)
    expect(score.partialFamilies).toBe(1)
    expect(score.fullFamilies).toBe(0)
  })
})
