export type EvidenceLevel = 'rejected' | 'accepted' | 'invalid' | 'lowered' | 'rendered'

export type Platform = 'web' | 'ios' | 'android'

export type Applicability = 'applicable' | 'limited' | 'inapplicable'

export type CandidateFamily = {
  family: string
  candidates: string[]
}

export type CandidateCatalog = {
  schemaVersion: 1
  generatedAt: string
  tailwindVersion: string
  candidateCount: number
  familyCount: number
  families: CandidateFamily[]
}

export type Observation = {
  framework: 'tamagui' | 'nativewind' | 'uniwind'
  capability: string
  candidate: string
  platform: Platform
  applicability: Applicability
  evidence: EvidenceLevel
  output?: unknown
  fixture?: string
  limitation?: string
}
