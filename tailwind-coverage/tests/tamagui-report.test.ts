import { describe, expect, test } from 'bun:test'

type Report = {
  gitRevision: string
  tailwindVersion: string
  reactNativeVersion: string
  counts: Record<'ios' | 'android', Record<string, number>>
  platforms: Record<
    'ios' | 'android',
    { candidate: string; evidence: string }[]
  >
}

describe('pinned Tamagui lowering report', () => {
  test('contains only safe claims from the real frontend resolver', async () => {
    const compressed = await Bun.file('reports/tamagui-lowering.json.gz').bytes()
    const report = JSON.parse(
      new TextDecoder().decode(Bun.gunzipSync(compressed))
    ) as Report
    const iosEvidence = new Map(
      report.platforms.ios.map(({ candidate, evidence }) => [candidate, evidence])
    )
    const androidEvidence = new Map(
      report.platforms.android.map(({ candidate, evidence }) => [candidate, evidence])
    )

    expect(report.gitRevision).toBe('2245fb34a60360ed945db02069ff1afc8ad7ee19')
    expect(report.tailwindVersion).toBe('4.3.0')
    expect(report.reactNativeVersion).toBe('0.86.2')
    expect(report.counts).toEqual({
      ios: { rejected: 13_381, accepted: 0, invalid: 0, lowered: 9_905 },
      android: { rejected: 13_339, accepted: 0, invalid: 0, lowered: 9_947 },
    })
    expect(iosEvidence.get('p-4')).toBe('lowered')
    expect(iosEvidence.get('grid')).toBe('rejected')
    expect(iosEvidence.get('mask-b-from-red-500')).toBe('rejected')
    expect(iosEvidence.get('ring-2')).toBe('lowered')
    expect(iosEvidence.get('brightness-105')).toBe('lowered')
    expect(iosEvidence.get('blur-sm')).toBe('rejected')
    expect(androidEvidence.get('blur-sm')).toBe('lowered')
    expect(androidEvidence.get('decoration-red-500')).toBe('lowered')
  })
})
