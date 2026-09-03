import path from 'node:path'

type FamilyAudit = {
  ownedCandidates: string[]
  unsafeOwned: number
}

type TargetAudit = {
  registrySize: number
  nativeReady: number
  unsafeOwned: number
  families: Record<string, FamilyAudit>
}

const adapterRoot = import.meta.dir
const projectRoot = path.resolve(adapterRoot, '../..')
const tamaguiRoot = process.env.TAMAGUI_REPO
if (!tamaguiRoot) throw new Error('TAMAGUI_REPO must point to the pinned Tamagui checkout')

const pin = await Bun.file(path.join(adapterRoot, 'pin.json')).json()
const revision = (
  await Bun.$`git -C ${tamaguiRoot} rev-parse HEAD`.quiet().text()
).trim()
if (revision !== pin.commit) {
  throw new Error(`Tamagui checkout is ${revision}; adapter requires ${pin.commit}`)
}

const auditScript = path.join(
  tamaguiRoot,
  'code/core/tailwind/scripts/audit-coverage.ts'
)
const child = Bun.spawn([process.execPath, auditScript, '--target=native'], {
  cwd: path.dirname(auditScript),
  env: { ...process.env, TAMAGUI_TARGET: 'native' },
  stdout: 'pipe',
  stderr: 'inherit',
})
const stdout = await new Response(child.stdout).text()
if ((await child.exited) !== 0) throw new Error('Tamagui native audit failed')
const audit = JSON.parse(stdout.trim().split('\n').at(-1)!) as TargetAudit
if (audit.unsafeOwned !== 0) {
  throw new Error(`Tamagui audit contains ${audit.unsafeOwned} unsafe native claims`)
}

const lowered = new Set(
  Object.values(audit.families).flatMap((family) => family.ownedCandidates)
)
const catalog = await Bun.file(path.join(projectRoot, 'generated/candidates.json')).json()
const candidates = catalog.families.flatMap(
  (family: { candidates: string[] }) => family.candidates
)
const observations = candidates.sort().map((candidate: string) => ({
  candidate,
  evidence: lowered.has(candidate) ? 'lowered' : 'rejected',
}))
const counts = {
  rejected: observations.filter(({ evidence }) => evidence === 'rejected').length,
  accepted: 0,
  invalid: 0,
  lowered: observations.filter(({ evidence }) => evidence === 'lowered').length,
}
if (counts.lowered !== audit.nativeReady) {
  throw new Error(
    `Tamagui audit mismatch: ${counts.lowered} observations vs ${audit.nativeReady} native-ready`
  )
}

const report = `${JSON.stringify(
  {
    schemaVersion: 1,
    framework: 'tamagui',
    frameworkVersion: pin.version,
    gitRevision: revision,
    tailwindVersion: '4.3.0',
    reactNativeVersion: '0.86.2',
    counts,
    observations,
  },
  null,
  2
)}\n`
await Bun.write(
  path.join(projectRoot, 'reports/tamagui-lowering.json.gz'),
  Bun.gzipSync(report, { level: 9 })
)
console.log(`Tamagui: ${JSON.stringify(counts)}`)
