export type ScoredGroup = {
  id: string
  candidates: string[]
}

export type CoverageScore = {
  candidatePassed: number
  candidateTotal: number
  candidateRate: number
  familyMacroRate: number
  fullFamilies: number
  partialFamilies: number
  emptyFamilies: number
  familyTotal: number
}

/**
 * The two complementary coverage metrics.
 *
 * Candidate rate answers “what percentage of applicable Tailwind classnames can
 * I type and expect to work?” Family macro rate answers “how broadly are the
 * semantics covered?” by giving every family one vote, independent of palette
 * or spacing expansion.
 */
export function scoreCoverage(
  groups: ScoredGroup[],
  passes: (candidate: string) => boolean
): CoverageScore {
  let candidatePassed = 0
  let candidateTotal = 0
  let familyRateTotal = 0
  let fullFamilies = 0
  let partialFamilies = 0
  let emptyFamilies = 0

  for (const group of groups) {
    const passed = group.candidates.filter(passes).length
    const total = group.candidates.length
    if (!total) continue
    candidatePassed += passed
    candidateTotal += total
    familyRateTotal += passed / total
    if (passed === total) fullFamilies++
    else if (passed === 0) emptyFamilies++
    else partialFamilies++
  }

  const familyTotal = fullFamilies + partialFamilies + emptyFamilies
  return {
    candidatePassed,
    candidateTotal,
    candidateRate: candidateTotal ? candidatePassed / candidateTotal : 0,
    familyMacroRate: familyTotal ? familyRateTotal / familyTotal : 0,
    fullFamilies,
    partialFamilies,
    emptyFamilies,
    familyTotal,
  }
}
