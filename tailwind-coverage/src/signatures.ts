import path from 'node:path'

import { loadPinnedDesignSystem } from './designSystem'

type AstNode = {
  kind: string
  property?: string
  selector?: string
  name?: string
  nodes?: AstNode[]
}

type SignatureGroup = {
  signature: string
  properties: string[]
  scopes: string[]
  candidates: string[]
}

const projectRoot = path.resolve(import.meta.dir, '..')
const outputPath = path.join(projectRoot, 'generated/signatures.json')

function normalizedProperty(property: string) {
  for (const namespace of ['mask', 'gradient', 'ring', 'shadow', 'divide']) {
    if (property.startsWith(`--tw-${namespace}`)) return `--tw-${namespace}-*`
  }
  return property
}

function selectorScope(selector: string) {
  if (selector.includes('>') || selector.includes('+') || selector.includes('~')) {
    return 'related-node'
  }
  if (selector.includes('::')) return 'pseudo-element'
  return 'self'
}

function describe(nodes: AstNode[]) {
  const properties = new Set<string>()
  const scopes = new Set<string>(['self'])

  function visit(node: AstNode, insidePropertyRegistration = false) {
    const propertyRegistration =
      insidePropertyRegistration || (node.kind === 'at-rule' && node.name === '@property')
    if (node.kind === 'rule' && node.selector) scopes.add(selectorScope(node.selector))
    if (node.kind === 'declaration' && node.property && !propertyRegistration) {
      properties.add(normalizedProperty(node.property))
    }
    for (const child of node.nodes || []) visit(child, propertyRegistration)
  }

  for (const node of nodes) visit(node)
  return {
    properties: [...properties].sort(),
    scopes: [...scopes].sort(),
  }
}

export async function createSignatureGroups(): Promise<SignatureGroup[]> {
  const designSystem = await loadPinnedDesignSystem()
  const groups = new Map<string, SignatureGroup>()

  for (const [candidate] of designSystem.getClassList()) {
    const ast = designSystem.candidatesToAst([candidate])[0] as AstNode[] | undefined
    if (!ast) continue
    const { properties, scopes } = describe(ast)
    const signature = `${scopes.join('+')}|${properties.join('+')}`
    const group = groups.get(signature) || { signature, properties, scopes, candidates: [] }
    group.candidates.push(candidate)
    groups.set(signature, group)
  }

  return [...groups.values()]
    .map((group) => ({ ...group, candidates: group.candidates.sort() }))
    .sort((a, b) => a.signature.localeCompare(b.signature))
}

async function main() {
  const groups = await createSignatureGroups()
  const serialized = `${JSON.stringify({ schemaVersion: 1, groups }, null, 2)}\n`
  if (process.argv.includes('--check')) {
    if ((await Bun.file(outputPath).text()) !== serialized) {
      throw new Error('generated/signatures.json is stale; run `bun run signatures`')
    }
    console.log(`semantic signatures match: ${groups.length} declaration/scope groups`)
    return
  }
  await Bun.write(outputPath, serialized)
  console.log(`wrote ${path.relative(projectRoot, outputPath)}: ${groups.length} groups`)
}

if (import.meta.main) await main()
