import { describe, expect, test } from 'bun:test'

import { createLoweringComparison } from '../src/loweringComparison'

describe('signature-weighted lowering comparison', () => {
  test('scores host-valid declarations rather than raw parser volume', async () => {
    const result = await createLoweringComparison()

    expect(result.platforms.ios.applicableGroups).toBeGreaterThan(100)
    expect(result.platforms.android.applicableGroups).toBeLessThan(341)
    expect(result.platforms.android.applicableGroups).toBeGreaterThan(
      result.platforms.ios.applicableGroups
    )
    for (const platform of ['ios', 'android'] as const) {
      // Keep the honest baseline explicit. The implementation queue is the
      // gap between these scores, not an assertion that Tamagui already leads.
      expect(result.platforms[platform].scores.nativewind).toBeGreaterThan(
        result.platforms[platform].scores.uniwind
      )
      expect(result.platforms[platform].scores.uniwind).toBeGreaterThan(
        result.platforms[platform].scores.tamagui
      )
    }
  })
})
