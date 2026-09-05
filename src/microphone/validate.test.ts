import { describe, expect, it } from 'vitest'
import { deriveMicrophoneStand } from './derive'
import { defaultMicrophoneStandParameters } from './parameters'
import { validateMicrophoneStand } from './validate'

describe('validateMicrophoneStand', () => {
  it('accepts the default stand without warnings', () => {
    expect(validateMicrophoneStand(deriveMicrophoneStand(defaultMicrophoneStandParameters))).toEqual([])
  })

  it('warns when the footprint is narrow for the selected height', () => {
    const result = validateMicrophoneStand(deriveMicrophoneStand({
      ...defaultMicrophoneStandParameters,
      mastLength: 325,
      footprintDiameter: 200,
    }))
    expect(result.some((item) => item.level === 'warning' && item.message.includes('設置径'))).toBe(true)
  })

  it('rejects inadequate holder thickness and cable diameter', () => {
    const result = validateMicrophoneStand(deriveMicrophoneStand({
      ...defaultMicrophoneStandParameters,
      holderWall: 2,
      cableDiameter: 0,
    }))
    expect(result.filter((item) => item.level === 'error')).toHaveLength(2)
  })

  it('warns when the one-piece mast exceeds printer Z', () => {
    const result = validateMicrophoneStand(deriveMicrophoneStand({
      ...defaultMicrophoneStandParameters,
      mastLength: 326,
      printerBedZ: 325,
    }))
    expect(result.some((item) => item.level === 'warning' && item.message.includes('造形高さ'))).toBe(true)
  })
})
