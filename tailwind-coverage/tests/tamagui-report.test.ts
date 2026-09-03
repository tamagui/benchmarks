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

    expect(report.gitRevision).toBe('3067ec646feaf7bb9281210098763405888d4a71')
    expect(report.tailwindVersion).toBe('4.3.0')
    expect(report.reactNativeVersion).toBe('0.86.2')
    expect(report.counts).toEqual({
      rejected: 13_392,
      accepted: 0,
      invalid: 0,
      lowered: 9_894,
    })
    expect(evidence.get('p-4')).toBe('lowered')
    expect(evidence.get('grid')).toBe('rejected')
    expect(evidence.get('mask-b-from-red-500')).toBe('rejected')
    expect(evidence.get('ring-2')).toBe('lowered')
  })
})
