import threeMfSerializer from '@jscad/3mf-serializer'
import stlSerializer from '@jscad/stl-serializer'
import { describe, expect, it } from 'vitest'
import { deriveDimensions } from '../domain/derive'
import { defaultParameters } from '../domain/parameters'
import { createAssembly, createBeam, createLeg, retentionHoleYPositions } from '../geometry/model'

describe('model serialization', () => {
  const dimensions = deriveDimensions(defaultParameters)

  it('serializes a leg as binary STL', () => {
    const parts = stlSerializer.serialize({ binary: true }, createLeg(dimensions))
    const size = parts.reduce((total: number, part: ArrayBuffer) => total + part.byteLength, 0)
    expect(size).toBeGreaterThan(1_000)
  })

  it('serializes the four-part assembly as 3MF', () => {
    const geometries = createAssembly(dimensions).map((part) => part.geometry)
    const parts = threeMfSerializer.serialize({ unit: 'millimeter', compress: true }, ...geometries)
    const size = parts.reduce((total: number, part: ArrayBuffer) => total + part.byteLength, 0)
    expect(size).toBeGreaterThan(1_000)
  })

  it('creates different beam profiles from the selected grid chambers', () => {
    const front = stlSerializer.serialize({ binary: true }, createBeam(dimensions, dimensions.frontBeamChamber))
    const rear = stlSerializer.serialize({ binary: true }, createBeam(dimensions, dimensions.rearBeamChamber))
    const frontSize = front.reduce((total: number, part: ArrayBuffer) => total + part.byteLength, 0)
    const rearSize = rear.reduce((total: number, part: ArrayBuffer) => total + part.byteLength, 0)
    expect(frontSize).toBeGreaterThan(1_000)
    expect(rearSize).toBeGreaterThan(1_000)
    expect(frontSize).not.toBe(rearSize)
  })

  it('places retention holes on both sides of each leg', () => {
    const positions = retentionHoleYPositions(dimensions)
    const halfStandWidth = dimensions.standWidth / 2
    const holeOffset = dimensions.retentionHoleDiameter / 2 + dimensions.fitClearance

    expect(positions).toEqual([
      -halfStandWidth - holeOffset,
      -halfStandWidth + dimensions.legThickness + holeOffset,
      halfStandWidth - dimensions.legThickness - holeOffset,
      halfStandWidth + holeOffset,
    ])
  })
})
