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
      for (const framework of ['tamagui', 'nativewind', 'uniwind'] as const) {
        expect(result.platforms[platform].scores[framework]).toBeGreaterThan(0)
        expect(result.platforms[platform].scores[framework]).toBeLessThan(1)
      }
      expect(result.platforms[platform].metrics.tamagui.candidateTotal).toBeGreaterThan(1_000)
      expect(result.platforms[platform].metrics.tamagui.familyTotal).toBe(
        result.platforms[platform].applicableGroups
      )
      const rows = result.platforms[platform].rows
      const alignItems = rows.find((row) => row.signature === 'self|align-items')
      const display = rows.find((row) => row.signature === 'self|display')
      const textShadow = rows.find((row) => row.signature === 'self|text-shadow')
      const maxHeight = rows.find((row) => row.signature === 'self|max-height')
      const insetRingColor = rows.find((row) =>
        row.candidates.includes('inset-ring-red-500')
      )
      expect(alignItems.candidates).not.toContain('items-center-safe')
      expect(alignItems.candidates).not.toContain('items-baseline-last')
      expect(display.candidates).not.toContain('grid')
      expect(textShadow.candidates).not.toContain('text-shadow-sm')
      expect(textShadow.candidates).toContain('text-shadow-xs')
      expect(maxHeight.candidates).not.toContain('max-h-screen')
      expect(maxHeight.candidates).not.toContain('max-h-fit')
      expect(maxHeight.candidates).toContain('max-h-full')
      expect(insetRingColor.signature).toContain('--tw-inset-ring-')
      expect(
        rows.some((row) => row.candidates.includes('mask-b-from-red-500'))
      ).toBe(false)
    }
  })
})
