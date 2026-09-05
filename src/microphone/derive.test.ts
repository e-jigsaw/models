import { describe, expect, it } from 'vitest'
import { deriveMicrophoneStand, VIDEOMIC_ME_C } from './derive'
import { defaultMicrophoneStandParameters } from './parameters'

describe('deriveMicrophoneStand', () => {
  it('derives the approved 325 mm one-piece mast and 240 mm footprint', () => {
    const result = deriveMicrophoneStand(defaultMicrophoneStandParameters)
    expect(result.mastLength).toBe(325)
    expect(result.standHeight).toBeCloseTo(376.5)
    expect(result.footprintRadius).toBe(120)
    expect(result.holderForwardOffset).toBe(0)
    expect(result.holderLift).toBe(28)
    expect(result.holderInnerRadius * 2).toBeCloseTo(
      VIDEOMIC_ME_C.bodyDiameter + defaultMicrophoneStandParameters.holderClearance * 2,
    )
  })

  it('derives the microphone center from the mast and lifted holder', () => {
    const result = deriveMicrophoneStand(defaultMicrophoneStandParameters)
    expect(result.mastTopZ).toBeCloseTo(result.baseSocketBottomZ + result.mastLength)
    expect(result.standHeight).toBeCloseTo(result.mastTopZ + result.holderOuterRadius + result.holderLift)
  })
})
