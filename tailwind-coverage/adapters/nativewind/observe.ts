import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { compile } from 'react-native-css/compiler'
import { __unstable__loadDesignSystem } from 'tailwindcss'
import tailwindPackage from 'tailwindcss/package.json'

type NativewindRule = unknown

const adapterRoot = import.meta.dir
const projectRoot = path.resolve(adapterRoot, '../..')
const outputPath = path.join(projectRoot, 'reports/nativewind-lowering.json.gz')

const theme = await readFile(path.join(adapterRoot, 'node_modules/tailwindcss/theme.css'), 'utf8')
const designSystem = await __unstable__loadDesignSystem(`${theme}\n@tailwind utilities;`)
const candidates = designSystem.getClassList().map(([candidate]) => candidate)
const cssByCandidate = designSystem.candidatesToCss(candidates)
const css = cssByCandidate.filter((value): value is string => value !== null).join('\n')
const compiled = compile(css)
const stylesheet = compiled.stylesheet() as { s?: [string, NativewindRule[]][] }
const styles = new Map(stylesheet.s || [])

function hasNativeEffect(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(hasNativeEffect)
  const rule = value as { d?: unknown[]; c?: unknown[]; a?: boolean }
  return Boolean(rule.d?.length || rule.c?.length || rule.a)
}

const observations = candidates.map((candidate, index) => {
  const generatedCSS = cssByCandidate[index]
  const rules = styles.get(candidate)
  return {
    candidate,
    evidence: !generatedCSS
      ? 'rejected'
      : hasNativeEffect(rules)
        ? 'lowered'
        : 'accepted',
    rules: rules || [],
  }
})

const counts = observations.reduce(
  (result, observation) => {
    result[observation.evidence]++
    return result
  },
  { rejected: 0, accepted: 0, lowered: 0 }
)

const report = `${JSON.stringify(
    {
      schemaVersion: 1,
      framework: 'nativewind',
      frameworkVersion: '5.0.0-preview.4',
      nativeCompiler: 'react-native-css@3.0.7',
      tailwindVersion: tailwindPackage.version,
      platform: 'native',
      counts,
      compilerWarnings: compiled.warnings(),
      observations,
    },
    null,
    2
  )}\n`
await Bun.write(outputPath, Bun.gzipSync(report, { level: 9 }))

console.log(
  `NativeWind: ${counts.lowered} lowered, ${counts.accepted} accepted-only, ${counts.rejected} rejected`
)
