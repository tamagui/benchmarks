import path from 'node:path'
import ts from 'typescript'

const projectRoot = path.resolve(import.meta.dir, '..')
const declarationPath = path.join(
  projectRoot,
  'adapters/uniwind/node_modules/react-native/Libraries/StyleSheet/StyleSheetTypes.d.ts'
)
const outputPath = path.join(projectRoot, 'generated/react-native-0.86.2.json')
const styleTypes = ['ViewStyle', 'TextStyle', 'ImageStyle']

function literalValues(type: ts.Type): (string | number | boolean | null)[] | undefined {
  const members = type.isUnion() ? type.types : [type]
  const values: (string | number | boolean | null)[] = []
  for (const member of members) {
    if (member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) continue
    if (member.flags & ts.TypeFlags.Null) values.push(null)
    else if (member.isStringLiteral()) values.push(member.value)
    else if (member.isNumberLiteral()) values.push(member.value)
    else if (member.flags & ts.TypeFlags.BooleanLiteral) {
      values.push((member as { intrinsicName?: string }).intrinsicName === 'true')
    } else return undefined
  }
  return [...new Set(values)].sort((a, b) => String(a).localeCompare(String(b)))
}

export function createReactNativeContract() {
  const program = ts.createProgram([declarationPath], {
    noEmit: true,
    skipLibCheck: true,
    target: ts.ScriptTarget.ESNext,
  })
  const checker = program.getTypeChecker()
  const source = program.getSourceFile(declarationPath)
  if (!source) throw new Error(`unable to load ${declarationPath}`)
  const moduleSymbol = checker.getSymbolAtLocation(source)
  if (!moduleSymbol) throw new Error('React Native style declaration has no module symbol')
  const exports = new Map(
    checker.getExportsOfModule(moduleSymbol).map((symbol) => [symbol.name, symbol])
  )
  const properties: Record<
    string,
    { hosts: string[]; type: string; values?: (string | number | boolean | null)[] }
  > = {}

  for (const host of styleTypes) {
    const symbol = exports.get(host)
    if (!symbol) throw new Error(`React Native declaration does not export ${host}`)
    const type = checker.getDeclaredTypeOfSymbol(symbol)
    for (const property of checker.getPropertiesOfType(type)) {
      const declaration = property.valueDeclaration || property.declarations?.[0]
      if (!declaration) continue
      const propertyType = checker.getTypeOfSymbolAtLocation(property, declaration)
      const existing = properties[property.name]
      const values = literalValues(propertyType)
      properties[property.name] = {
        hosts: [...new Set([...(existing?.hosts || []), host])].sort(),
        type: checker.typeToString(propertyType),
        ...(values ? { values } : {}),
      }
    }
  }

  return {
    schemaVersion: 1,
    reactNativeVersion: '0.86.2',
    source: 'Libraries/StyleSheet/StyleSheetTypes.d.ts',
    properties: Object.fromEntries(
      Object.entries(properties).sort(([a], [b]) => a.localeCompare(b))
    ),
  }
}

async function main() {
  const contract = createReactNativeContract()
  const serialized = `${JSON.stringify(contract, null, 2)}\n`
  if (process.argv.includes('--check')) {
    if ((await Bun.file(outputPath).text()) !== serialized) {
      throw new Error('React Native contract is stale; run `bun run native-contract`')
    }
    console.log(
      `React Native ${contract.reactNativeVersion} contract matches: ${Object.keys(contract.properties).length} style properties`
    )
    return
  }
  await Bun.write(outputPath, serialized)
  console.log(
    `wrote ${path.relative(projectRoot, outputPath)}: ${Object.keys(contract.properties).length} style properties`
  )
}

if (import.meta.main) await main()
