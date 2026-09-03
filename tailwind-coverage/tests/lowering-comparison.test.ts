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
      expect(result.platforms[platform].metrics.tamagui.candidateTotal).toBeGreaterThan(1_000)
      expect(result.platforms[platform].metrics.tamagui.familyTotal).toBe(
        result.platforms[platform].applicableGroups
      )
      const rows = result.platforms[platform].rows
      const alignItems = rows.find((row) => row.signature === 'self|align-items')
      const display = rows.find((row) => row.signature === 'self|display')
      expect(alignItems.candidates).not.toContain('items-center-safe')
      expect(alignItems.candidates).not.toContain('items-baseline-last')
      expect(display.candidates).not.toContain('grid')
    }
  })
})
