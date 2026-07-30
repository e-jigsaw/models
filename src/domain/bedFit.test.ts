import { describe, expect, it } from 'vitest'
import { findRotatedRectangleFit } from './bedFit'

describe('findRotatedRectangleFit', () => {
  it('accepts a part that fits without rotation', () => {
    const result = findRotatedRectangleFit(240, 100, 256, 256)
    expect(result.fits).toBe(true)
  })

  it('accepts a long narrow part that fits diagonally', () => {
    const result = findRotatedRectangleFit(340, 20, 256, 256)
    expect(result.fits).toBe(true)
    expect(result.angle).toBeGreaterThan(40)
    expect(result.angle).toBeLessThan(50)
  })

  it('rejects a part whose width prevents diagonal placement', () => {
    const result = findRotatedRectangleFit(350, 20, 256, 256)
    expect(result.fits).toBe(false)
  })
})
