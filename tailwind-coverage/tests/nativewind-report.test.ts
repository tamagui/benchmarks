import { describe, expect, test } from 'bun:test'

type Report = {
  frameworkVersion: string
  nativeCompiler: string
  tailwindVersion: string
  counts: { accepted: number; lowered: number; rejected: number }
  observations: { candidate: string; evidence: string }[]
}

describe('pinned NativeWind lowering report', () => {
  test('credits native declarations and not variable-only parser output', async () => {
    const compressed = await Bun.file('reports/nativewind-lowering.json.gz').bytes()
    const report = JSON.parse(
      new TextDecoder().decode(Bun.gunzipSync(compressed))
    ) as Report
    const evidence = new Map(
      report.observations.map(({ candidate, evidence }) => [candidate, evidence])
    )

    expect(report.frameworkVersion).toBe('5.0.0-preview.4')
    expect(report.nativeCompiler).toBe('react-native-css@3.0.7')
    expect(report.tailwindVersion).toBe('4.3.0')
    expect(report.counts).toEqual({ rejected: 0, accepted: 12_846, lowered: 10_440 })
    expect(evidence.get('p-4')).toBe('lowered')
    expect(evidence.get('grid')).toBe('accepted')
    expect(evidence.get('mask-b-from-red-500')).toBe('accepted')
    expect(evidence.get('ring-2')).toBe('lowered')
  })
})
