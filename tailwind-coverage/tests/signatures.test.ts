import { describe, expect, test } from 'bun:test'

import { createSignatureGroups } from '../src/signatures'

describe('semantic declaration signatures', () => {
  test('collapse token spellings without hiding selector semantics', async () => {
    const groups = await createSignatureGroups()
    const maskGroup = groups.find(
      ({ properties }) =>
        properties.includes('mask-image') && properties.includes('--tw-mask-*')
    )
    const siblingSpacing = groups.find(
      ({ properties, scopes }) =>
        properties.includes('margin-inline-start') && scopes.includes('related-node')
    )

    expect(groups.length).toBeLessThan(400)
    expect(maskGroup?.candidates.length).toBeGreaterThan(1_000)
    expect(siblingSpacing?.candidates).toContain('space-x-4')
  })
})
