import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { __unstable__loadDesignSystem } from 'tailwindcss'
import tailwindPackage from 'tailwindcss/package.json'
import { UniwindBundlerConfig } from './node_modules/uniwind/src/bundler/config.ts'
import {
  addMetaToStylesTemplate,
  ProcessorBuilder,
} from './node_modules/uniwind/src/bundler/css-processor/index.ts'
import { Platform } from './node_modules/uniwind/src/common/consts.ts'

type ContractProperty = {
  hosts: string[]
  platforms: ('ios' | 'android')[]
  values?: unknown[]
}
type Contract = { properties: Record<string, ContractProperty> }
type Template = Record<string, { entries: [string, string][] }[]>

const adapterRoot = import.meta.dir
const projectRoot = path.resolve(adapterRoot, '../..')
const outputPath = path.join(projectRoot, 'reports/uniwind-lowering.json.gz')
const contract = (await Bun.file(
  path.join(projectRoot, 'generated/react-native-0.86.2.json')
).json()) as Contract

function literalReturn(source: string): unknown {
  const match = /^function\(vars\) \{ return (.+) \}$/.exec(source)
  if (!match || /\b(?:vars|rt)\b/.test(match[1])) return undefined
  try {
    return JSON.parse(match[1])
  } catch {
    return undefined
  }
}

function validEntry(
  [quotedProperty, source]: [string, string],
  platform: 'ios' | 'android'
) {
  const property = JSON.parse(quotedProperty) as string
  const definition = contract.properties[property]
  if (!definition) return false
  if (!definition.platforms.includes(platform)) return false
  if (!definition.values) return true
  const literal = literalReturn(source)
  return literal === undefined || definition.values.includes(literal)
}

const theme = await readFile(path.join(adapterRoot, 'node_modules/tailwindcss/theme.css'), 'utf8')
const designSystem = await __unstable__loadDesignSystem(`${theme}\n@tailwind utilities;`)
const candidates = designSystem.getClassList().map(([candidate]) => candidate)
const cssByCandidate = designSystem.candidatesToCss(candidates)
const css = cssByCandidate.filter((value): value is string => value !== null).join('\n')

function observe(platform: Platform.iOS | Platform.Android) {
  const platformName = platform === Platform.iOS ? 'ios' : 'android'
  const config = new UniwindBundlerConfig({ cssEntryFile: 'unused.css' }, platform)
  const processor = new ProcessorBuilder(config)
  processor.transform(css)
  const stylesheet = addMetaToStylesTemplate(processor, platform) as Template

  return candidates.map((candidate, index) => {
    const rules = stylesheet[candidate] || []
    const entries = rules.flatMap((rule) => rule.entries)
    const validEntries = entries.filter((entry) => validEntry(entry, platformName))
    const evidence = !cssByCandidate[index]
      ? 'rejected'
      : validEntries.length
        ? 'lowered'
        : entries.length
          ? 'invalid'
          : 'accepted'
    return {
      candidate,
      evidence,
      properties: validEntries.map(([property]) => JSON.parse(property)),
      invalidProperties: entries
        .filter((entry) => !validEntry(entry, platformName))
        .map(([property]) => JSON.parse(property)),
    }
  })
}

const platforms = {
  ios: observe(Platform.iOS),
  android: observe(Platform.Android),
}
const counts = Object.fromEntries(
  Object.entries(platforms).map(([platform, observations]) => [
    platform,
    observations.reduce(
      (result, observation) => {
        result[observation.evidence]++
        return result
      },
      { rejected: 0, accepted: 0, invalid: 0, lowered: 0 }
    ),
  ])
)
const report = `${JSON.stringify(
  {
    schemaVersion: 1,
    framework: 'uniwind',
    frameworkVersion: '1.11.0',
    tailwindVersion: tailwindPackage.version,
    reactNativeVersion: '0.86.2',
    counts,
    platforms,
  },
  null,
  2
)}\n`
await Bun.write(outputPath, Bun.gzipSync(report, { level: 9 }))
console.log(`Uniwind: ${JSON.stringify(counts)}`)
