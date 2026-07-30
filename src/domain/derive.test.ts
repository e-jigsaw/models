import { describe, expect, it } from 'vitest'
import { defaultParameters } from './parameters'
import { deriveDimensions } from './derive'
import { validateDimensions } from './validate'

describe('deriveDimensions', () => {
  it('derives a right triangle from slope and angle', () => {
    const result = deriveDimensions({ ...defaultParameters, slopeLength: 200, angle: 30 })
    expect(result.baseProjection).toBeCloseTo(173.205, 3)
    expect(result.height).toBeCloseTo(100, 3)
  })

  it('derives slope from footprint and angle', () => {
    const result = deriveDimensions({ ...defaultParameters, mode: 'footprint', baseProjection: 200, angle: 60 })
    expect(result.slopeLength).toBeCloseTo(400, 3)
  })

  it('derives selectable grid chambers from bays and rows', () => {
    const result = deriveDimensions(defaultParameters)
    expect(result.ribCount).toBe(3)
    expect(result.bayCount).toBe(4)
    expect(result.ribSpacing).toBeCloseTo(result.baseProjection / 4)
    expect(result.gridRowCount).toBe(1)
    expect(result.beamChamberProfiles).toHaveLength(8)
    expect(result.availableBeamChambers).toEqual(['2:0', '3:0'])
    expect(result.frontBeamChamber).toBe('2:0')
    expect(result.rearBeamChamber).toBe('3:0')
    expect(result.frontBeamProfile.minHeight).toBeGreaterThan(4)
    expect(result.rearBeamProfile.maxHeight).toBeCloseTo(result.rearBeamProfile.minHeight)
    expect(result.ribSpacing).toBeLessThanOrEqual(defaultParameters.ribMaxSpacing)
  })

  it('rejects using the same grid chamber for both beams', () => {
    const result = deriveDimensions({ ...defaultParameters, frontBeamChamber: '2:0', rearBeamChamber: '2:0' })
    expect(validateDimensions(result).some((item) => item.message.includes('別の格子チャンバー'))).toBe(true)
  })

  it('warns when the beam does not fit the printer bed', () => {
    const result = deriveDimensions(defaultParameters)
    expect(validateDimensions(result).some((item) => item.message.includes('前梁の造形面'))).toBe(true)
  })
})
