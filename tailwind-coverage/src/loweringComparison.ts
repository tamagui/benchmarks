import path from 'node:path'

import { scoreCoverage } from './metrics'

const projectRoot = path.resolve(import.meta.dir, '..')
const reportPath = path.join(projectRoot, 'reports/lowering-comparison.md')

async function readGzipJson(file: string) {
  const bytes = await Bun.file(path.join(projectRoot, 'reports', file)).bytes()
  return JSON.parse(new TextDecoder().decode(Bun.gunzipSync(bytes)))
}

function camel(property: string) {
  return property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
}

const propertyAliases: Record<string, string[]> = {
  'background-image': ['experimental_backgroundImage'],
  border: ['borderWidth', 'borderColor', 'borderStyle'],
  outline: ['outlineWidth', 'outlineColor', 'outlineStyle'],
  'text-shadow': ['textShadowColor', 'textShadowOffset', 'textShadowRadius'],
  inset: ['top', 'right', 'bottom', 'left'],
  rotate: ['transform'],
  scale: ['transform'],
  translate: ['transform']
}
const frameworks = ['tamagui', 'nativewind', 'uniwind'] as const

function normalizeCssEnum(property: string, value: string) {
  if (
    (property.startsWith('align-') || property.startsWith('justify-')) &&
    (value === 'start' || value === 'end')
  ) {
    return `flex-${value}`
  }
  return value
}

function valueApplies(
  hostProperties: string[],
  literalValues: Record<string, string>,
  contract: any,
  platform: 'ios' | 'android'
) {
  for (const property of hostProperties) {
    const authoredValue = literalValues[property]
    if (!authoredValue) continue
    const targets = propertyAliases[property] || [camel(property)]
    const constrainedTargets = targets.filter(
      (target) =>
        target in contract.properties &&
        contract.properties[target].platforms.includes(platform) &&
        (contract.properties[target].values?.length || 0) > 0
    )
    if (constrainedTargets.length === 0) continue
    const value = normalizeCssEnum(property, authoredValue)
    if (!constrainedTargets.some((target) => contract.properties[target].values.includes(value))) {
      return false
    }
  }
  return true
}

function candidateApplies(candidate: string, platform: 'ios' | 'android') {
  if (
    platform === 'ios' &&
    /^(?!brightness-).*(?:blur|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia)/.test(
      candidate
    )
  ) {
    return false
  }
  // React Native 0.86 has no Z-axis translate/scale transform entries. The
  // three setup-only transform classes also have no rendered behavior by
  // themselves, so neither can earn native lowering credit.
  if (/^-?(?:scale|translate)-z-/.test(candidate)) return false
  if (/^(?:scale|translate)-3d$/.test(candidate)) return false
  if (/^transform(?:-cpu|-gpu)?$/.test(candidate)) return false
  // Native TextStyle has one text-shadow slot. Tailwind's sm/md/lg presets are
  // stacks of three shadows, so accepting one member is not equivalent.
  if (/^text-shadow-(?:sm|md|lg)$/.test(candidate)) return false
  // Tailwind's named tracking values are em-relative. RN letterSpacing is an
  // absolute point value, so a naked numeric lowering is not equivalent unless
  // the active font size is also known at runtime.
  if (/^-?tracking-/.test(candidate)) return false
  return true
}

export async function createLoweringComparison() {
  const signatures = await Bun.file(path.join(projectRoot, 'generated/signatures.json')).json()
  const contract = await Bun.file(
    path.join(projectRoot, 'generated/react-native-0.86.2.json')
  ).json()
  const [tamagui, nativewind, uniwind] = await Promise.all([
    readGzipJson('tamagui-lowering.json.gz'),
    readGzipJson('nativewind-lowering.json.gz'),
    readGzipJson('uniwind-lowering.json.gz')
  ])
  const platforms = Object.fromEntries(
    (['ios', 'android'] as const).map((platform) => {
      const observations = {
        tamagui: new Map(
          tamagui.platforms[platform].map((entry: any) => [entry.candidate, entry.evidence])
        ),
        nativewind: new Map(
          nativewind.observations.map((entry: any) => [entry.candidate, entry.evidence])
        ),
        uniwind: new Map(
          uniwind.platforms[platform].map((entry: any) => [entry.candidate, entry.evidence])
        )
      }
      const applicable = signatures.groups.flatMap((group: any) => {
        const hostProperties = group.properties.filter(
          (property: string) => !property.startsWith('--')
        )
        const hostProperty =
          hostProperties.length > 0 &&
          hostProperties.every((property: string) => {
            if (property.startsWith('--')) return false
            const targets = propertyAliases[property] || [camel(property)]
            return targets.some(
              (target) =>
                target in contract.properties &&
                contract.properties[target].platforms.includes(platform)
            )
          })
        if (!hostProperty) return []
        const candidates = group.candidates.filter(
          (candidate: string) =>
            candidateApplies(candidate, platform) &&
            valueApplies(hostProperties, group.literalValues[candidate] || {}, contract, platform)
        )
        return candidates.length ? [{ ...group, candidates }] : []
      })
      const rows = applicable.map((group: any) => {
        const coverage = Object.fromEntries(
          frameworks.map((framework) => {
            const lowered = group.candidates.filter(
              (candidate: string) => observations[framework].get(candidate) === 'lowered'
            ).length
            return [framework, lowered / group.candidates.length]
          })
        )
        return { ...group, coverage }
      })
      const metrics = Object.fromEntries(
        frameworks.map((framework) => {
          const metric = scoreCoverage(
            applicable,
            (candidate) => observations[framework].get(candidate) === 'lowered'
          )
          return [framework, metric]
        })
      )
      const scores = Object.fromEntries(
        frameworks.map((framework) => [framework, metrics[framework].familyMacroRate])
      )
      return [platform, { applicableGroups: rows.length, scores, metrics, rows }]
    })
  ) as Record<
    'ios' | 'android',
    {
      applicableGroups: number
      scores: Record<string, number>
      metrics: Record<string, ReturnType<typeof scoreCoverage>>
      rows: any[]
    }
  >
  return { platforms, tamagui, nativewind, uniwind }
}

async function main() {
  const result = await createLoweringComparison()
  const pct = (value: number) => `${(value * 100).toFixed(2)}%`
  const gapLines = (platform: 'ios' | 'android') => {
    const gaps = result.platforms[platform].rows
      .filter((row: any) => row.coverage.nativewind > row.coverage.tamagui)
      .sort(
        (a: any, b: any) =>
          b.coverage.nativewind - b.coverage.tamagui - (a.coverage.nativewind - a.coverage.tamagui)
      )
      .slice(0, 20)
    return [
      `## Largest Tamagui ${platform === 'ios' ? 'iOS' : 'Android'} lowering gaps versus NativeWind`,
      '',
      '| Declaration/scope signature | Candidates | Tamagui | NativeWind | Uniwind | Examples |',
      '| --- | ---: | ---: | ---: | ---: | --- |',
      ...gaps.map(
        (row: any) =>
          `| \`${row.signature.replaceAll('|', '\\|')}\` | ${row.candidates.length} | ${pct(row.coverage.tamagui)} | ${pct(row.coverage.nativewind)} | ${pct(row.coverage.uniwind)} | ${row.candidates
            .slice(0, 3)
            .map((candidate: string) => `\`${candidate}\``)
            .join(', ')} |`
      ),
      ''
    ]
  }
  const lines = [
    '# Native lowering comparison',
    '',
    '> Generated by `bun run report:lowering`. Do not hand-edit.',
    '',
    'This is a compiler/lowering diagnostic, not the primary rendered coverage score.',
    `Each React-Native-applicable CSS declaration/scope signature has equal weight; candidate spellings only determine coverage within its signature. The pinned contract currently yields ${result.platforms.ios.applicableGroups} iOS signatures and ${result.platforms.android.applicableGroups} Android signatures.`,
    'Parser acceptance, CSS variables without a native declaration, and invalid RN properties or enum values earn zero.',
    '',
    '| Framework | iOS classnames | iOS family macro | Android classnames | Android family macro |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...frameworks.map((framework) => {
      const label =
        framework === 'tamagui'
          ? 'Tamagui'
          : framework === 'nativewind'
            ? 'NativeWind 5 preview'
            : 'Uniwind'
      const ios = result.platforms.ios.metrics[framework]
      const android = result.platforms.android.metrics[framework]
      return `| ${label} | ${ios.candidatePassed}/${ios.candidateTotal} (${pct(ios.candidateRate)}) | ${pct(ios.familyMacroRate)} | ${android.candidatePassed}/${android.candidateTotal} (${pct(android.candidateRate)}) | ${pct(android.familyMacroRate)} |`
    }),
    '',
    'These are lowering diagnostics. The final “working classname” table uses the same two metrics but requires `rendered` evidence for the complete family semantics before any candidate in that family passes.',
    '',
    ...gapLines('ios'),
    ...gapLines('android'),
    'The primary score will replace lowering credit with browser/iOS/Android rendered fixtures.',
    ''
  ]
  const serialized = lines.join('\n')
  if (process.argv.includes('--check')) {
    if ((await Bun.file(reportPath).text()) !== serialized) {
      throw new Error('lowering comparison is stale; run `bun run report:lowering`')
    }
    console.log(
      `lowering comparison matches: ${result.platforms.ios.applicableGroups} iOS / ${result.platforms.android.applicableGroups} Android signatures`
    )
    return
  }
  await Bun.write(reportPath, serialized)
  console.log(
    `lowering scores — iOS Tamagui ${pct(result.platforms.ios.scores.tamagui)}, NativeWind ${pct(result.platforms.ios.scores.nativewind)}, Uniwind ${pct(result.platforms.ios.scores.uniwind)}; Android Tamagui ${pct(result.platforms.android.scores.tamagui)}, NativeWind ${pct(result.platforms.android.scores.nativewind)}, Uniwind ${pct(result.platforms.android.scores.uniwind)}`
  )
}

if (import.meta.main) await main()
