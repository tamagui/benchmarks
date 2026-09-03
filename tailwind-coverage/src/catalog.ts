import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { __unstable__loadDesignSystem } from 'tailwindcss'
import tailwindPackage from 'tailwindcss/package.json'

import type { CandidateCatalog } from './types'

const projectRoot = path.resolve(import.meta.dir, '..')
const themePath = path.join(projectRoot, 'node_modules/tailwindcss/theme.css')
const outputPath = path.join(projectRoot, 'generated/candidates.json')

export async function createCandidateCatalog(): Promise<CandidateCatalog> {
  const theme = await readFile(themePath, 'utf8')
  const designSystem = await __unstable__loadDesignSystem(
    `${theme}\n@tailwind utilities;`
  )
  const families = new Map<string, string[]>()

  for (const [candidate] of designSystem.getClassList()) {
    const parsed = designSystem.parseCandidate(candidate)[0]
    const family =
      parsed?.kind === 'arbitrary'
        ? `[${parsed.property}]`
        : String(parsed?.root || '(unclassified)')
    const candidates = families.get(family) || []
    candidates.push(candidate)
    families.set(family, candidates)
  }

  const sortedFamilies = [...families]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, candidates]) => ({ family, candidates: candidates.sort() }))

  return {
    schemaVersion: 1,
    generatedAt: 'deterministic',
    tailwindVersion: tailwindPackage.version,
    candidateCount: sortedFamilies.reduce(
      (count, family) => count + family.candidates.length,
      0
    ),
    familyCount: sortedFamilies.length,
    families: sortedFamilies,
  }
}

async function main() {
  const catalog = await createCandidateCatalog()
  const serialized = `${JSON.stringify(catalog, null, 2)}\n`
  if (process.argv.includes('--check')) {
    const existing = await Bun.file(outputPath).text()
    if (existing !== serialized) {
      throw new Error('generated/candidates.json is stale; run `bun run catalog`')
    }
    console.log(
      `catalog matches tailwindcss@${catalog.tailwindVersion}: ${catalog.candidateCount} candidates, ${catalog.familyCount} raw families`
    )
    return
  }
  await Bun.write(outputPath, serialized)
  console.log(
    `wrote ${path.relative(projectRoot, outputPath)}: ${catalog.candidateCount} candidates, ${catalog.familyCount} raw families`
  )
}

if (import.meta.main) await main()
