import { describe, expect, test } from 'bun:test'

import { createCandidateCatalog } from '../src/catalog'

describe('pinned Tailwind candidate catalog', () => {
  test('derives the complete Tailwind 4.3.0 default-theme surface', async () => {
    const catalog = await createCandidateCatalog()

    expect(catalog.tailwindVersion).toBe('4.3.0')
    expect(catalog.candidateCount).toBe(23_286)
    expect(catalog.familyCount).toBe(1_154)
  })

  test('exposes palette expansion instead of mistaking spellings for capabilities', async () => {
    const catalog = await createCandidateCatalog()
    const maskCandidates = catalog.families
      .filter(
        ({ family }) =>
          family === 'mask' || family.startsWith('mask-') || family.startsWith('-mask-')
      )
      .reduce((count, family) => count + family.candidates.length, 0)

    expect(maskCandidates).toBe(6_320)
    expect(maskCandidates / catalog.candidateCount).toBeGreaterThan(0.27)
  })
})
