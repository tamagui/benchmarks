import { describe, expect, test } from 'bun:test'

import { createLoweringComparison } from '../src/loweringComparison'

describe('signature-weighted lowering comparison', () => {
  test('scores host-valid declarations rather than raw parser volume', async () => {
    const result = await createLoweringComparison()

    expect(result.applicableGroups).toBeGreaterThan(100)
    expect(result.applicableGroups).toBeLessThan(341)
    // Keep the first honest baseline explicit. The implementation queue is the
    // gap between these scores, not an assertion that Tamagui already leads.
    expect(result.scores.nativewind).toBeGreaterThan(result.scores.uniwind)
    expect(result.scores.uniwind).toBeGreaterThan(result.scores.tamagui)
  })
})
