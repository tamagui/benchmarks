import { describe, expect, test } from 'bun:test'

import { createReactNativeContract } from '../src/reactNativeContract'

describe('pinned React Native host contract', () => {
  test('rejects serialized CSS that React Native cannot render', () => {
    const contract = createReactNativeContract()

    expect(contract.properties.padding.hosts).toContain('ViewStyle')
    expect(contract.properties.display.values).toEqual(['contents', 'flex', 'none'])
    expect(contract.properties.maskImage).toBeUndefined()
    expect(contract.properties.experimental_backgroundImage.hosts).toContain('ViewStyle')
  })
})
