import path from 'node:path'

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
  translate: ['transform'],
}

function candidateApplies(candidate: string, platform: 'ios' | 'android') {
  if (platform === 'ios' && /^(?!brightness-).*(?:blur|contrast|drop-shadow|grayscale|hue-rotate|invert|saturate|sepia)/.test(candidate)) {
    return false
  }
  // React Native 0.86 has no Z-axis translate/scale transform entries. The
  // three setup-only transform classes also have no rendered behavior by
  // themselves, so neither can earn native lowering credit.
  if (/^-?(?:scale|translate)-z-/.test(candidate)) return false
  if (/^(?:scale|translate)-3d$/.test(candidate)) return false
  if (/^transform(?:-cpu|-gpu)?$/.test(candidate)) return false
  // Tailwind's named tracking values are em-relative. RN letterSpacing is an
  // absolute point value, so a naked numeric lowering is not equivalent unless
  // the active font size is also known at runtime.
  if (/^-?tracking-/.test(candidate)) return false
  return true
}

export async function createLoweringComparison() {
  const signatures = await Bun.file(
    path.join(projectRoot, 'generated/signatures.json')
  ).json()
  const contract = await Bun.file(
    path.join(projectRoot, 'generated/react-native-0.86.2.json')
  ).json()
  const [tamagui, nativewind, uniwind] = await Promise.all([
    readGzipJson('tamagui-lowering.json.gz'),
    readGzipJson('nativewind-lowering.json.gz'),
    readGzipJson('uniwind-lowering.json.gz'),
  ])
  const frameworks = ['tamagui', 'nativewind', 'uniwind'] as const
  const platforms = Object.fromEntries(
    (['ios', 'android'] as const).map((platform) => {
      const observations = {
        tamagui: new Map(
          tamagui.platforms[platform].map((entry: any) => [
            entry.candidate,
            entry.evidence,
          ])
        ),
        nativewind: new Map(
          nativewind.observations.map((entry: any) => [entry.candidate, entry.evidence])
        ),
        uniwind: new Map(
          uniwind.platforms[platform].map((entry: any) => [
            entry.candidate,
            entry.evidence,
          ])
        ),
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
        const candidates = group.candidates.filter((candidate: string) =>
          candidateApplies(candidate, platform)
        )
        return candidates.length ? [{ ...group, candidates }] : []
      })
      const rows = applicable.map((group: any) => {
        const coverage = Object.fromEntries(
          frameworks.map((framework) => {
            const lowered = group.candidates.filter(
              (candidate: string) =>
                observations[framework].get(candidate) === 'lowered'
            ).length
            return [framework, lowered / group.candidates.length]
          })
        )
        return { ...group, coverage }
      })
      const scores = Object.fromEntries(
        frameworks.map((framework) => [
          framework,
          rows.reduce(
            (total: number, row: any) => total + row.coverage[framework],
            0
          ) / rows.length,
        ])
      )
      return [platform, { applicableGroups: rows.length, scores, rows }]
    })
  ) as Record<
    'ios' | 'android',
    { applicableGroups: number; scores: Record<string, number>; rows: any[] }
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
          b.coverage.nativewind - b.coverage.tamagui -
          (a.coverage.nativewind - a.coverage.tamagui)
      )
      .slice(0, 20)
    return [
      `## Largest Tamagui ${platform === 'ios' ? 'iOS' : 'Android'} lowering gaps versus NativeWind`,
      '',
      '| Declaration/scope signature | Candidates | Tamagui | NativeWind | Uniwind | Examples |',
      '| --- | ---: | ---: | ---: | ---: | --- |',
      ...gaps.map(
        (row: any) =>
          `| \`${row.signature.replaceAll('|', '\\|')}\` | ${row.candidates.length} | ${pct(row.coverage.tamagui)} | ${pct(row.coverage.nativewind)} | ${pct(row.coverage.uniwind)} | ${row.candidates.slice(0, 3).map((candidate: string) => `\`${candidate}\``).join(', ')} |`
      ),
      '',
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
    '| Framework | Candidate diagnostics | iOS | Android |',
    '| --- | --- | ---: | ---: |',
    `| Tamagui | iOS ${result.tamagui.counts.ios.lowered}, Android ${result.tamagui.counts.android.lowered}; zero unsafe | ${pct(result.platforms.ios.scores.tamagui)} | ${pct(result.platforms.android.scores.tamagui)} |`,
    `| NativeWind 5 preview | ${result.nativewind.counts.lowered} direct lowerings, ${result.nativewind.counts.accepted} accepted-only | ${pct(result.platforms.ios.scores.nativewind)} | ${pct(result.platforms.android.scores.nativewind)} |`,
    `| Uniwind | iOS ${result.uniwind.counts.ios.lowered}, Android ${result.uniwind.counts.android.lowered}; invalid output earns zero | ${pct(result.platforms.ios.scores.uniwind)} | ${pct(result.platforms.android.scores.uniwind)} |`,
    '',
    ...gapLines('ios'),
    ...gapLines('android'),
    'The primary score will replace lowering credit with browser/iOS/Android rendered fixtures.',
    '',
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
