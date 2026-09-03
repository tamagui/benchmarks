import { describe, expect, test } from 'bun:test'

type Observation = {
  candidate: string
  evidence: string
  properties: string[]
  invalidProperties: string[]
}

type Report = {
  frameworkVersion: string
  tailwindVersion: string
  reactNativeVersion: string
  counts: Record<string, Record<string, number>>
  platforms: Record<string, Observation[]>
}

describe('pinned Uniwind lowering report', () => {
  test('rejects declarations outside the React Native host contract', async () => {
    const compressed = await Bun.file('reports/uniwind-lowering.json.gz').bytes()
    const report = JSON.parse(
      new TextDecoder().decode(Bun.gunzipSync(compressed))
    ) as Report
    const ios = new Map(report.platforms.ios.map((entry) => [entry.candidate, entry]))

    expect(report.frameworkVersion).toBe('1.11.0')
    expect(report.tailwindVersion).toBe('4.3.0')
    expect(report.reactNativeVersion).toBe('0.86.2')
    expect(report.counts.ios).toEqual({
      rejected: 0,
      accepted: 932,
      invalid: 13_911,
      lowered: 8_443,
    })
    expect(report.counts.android).toEqual({
      rejected: 0,
      accepted: 932,
      invalid: 13_917,
      lowered: 8_437,
    })
    expect(ios.get('p-4')?.properties).toContain('padding')
    expect(ios.get('grid')?.evidence).toBe('invalid')
    expect(ios.get('mask-b-from-red-500')?.invalidProperties).toContain('maskImage')
    expect(ios.get('ring-2')?.properties).toContain('boxShadow')
  })
})
