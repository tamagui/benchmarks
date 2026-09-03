import { describe, expect, test } from 'bun:test'

type Report = {
  gitRevision: string
  tailwindVersion: string
  reactNativeVersion: string
  counts: Record<string, number>
  observations: { candidate: string; evidence: string }[]
}

describe('pinned Tamagui lowering report', () => {
  test('contains only safe claims from the real frontend resolver', async () => {
    const compressed = await Bun.file('reports/tamagui-lowering.json.gz').bytes()
    const report = JSON.parse(
      new TextDecoder().decode(Bun.gunzipSync(compressed))
    ) as Report
    const evidence = new Map(
      report.observations.map(({ candidate, evidence }) => [candidate, evidence])
    )

    expect(report.gitRevision).toBe('dd3de66877f09e4f5482d507436e38e06d721003')
    expect(report.tailwindVersion).toBe('4.3.0')
    expect(report.reactNativeVersion).toBe('0.86.2')
    expect(report.counts).toEqual({
      rejected: 13_688,
      accepted: 0,
      invalid: 0,
      lowered: 9_598,
    })
    expect(evidence.get('p-4')).toBe('lowered')
    expect(evidence.get('grid')).toBe('rejected')
    expect(evidence.get('mask-b-from-red-500')).toBe('rejected')
    expect(evidence.get('ring-2')).toBe('lowered')
  })
})
