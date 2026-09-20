import { booleans, measurements, primitives } from '@jscad/modeling'
import threeMfSerializer from '@jscad/3mf-serializer'
import { describe, expect, it } from 'vitest'
import {
  createKeycapAssembly,
  createKeycap3mfAssembly,
  createKeycapSolid,
  createMxStem,
  createStemSupports,
  keycapBounds,
  MX_CROSS_BASE,
  MX_STEM_OUTER_DIAMETER,
  mxStemMinimumWall,
  mxCrossCutoutDimensions,
  STEM_SUPPORT_ANGLES,
  STEM_SUPPORT_REACH,
} from './model'
import { cherryRowProfiles, defaultKeycapParameters } from './parameters'
import { validateKeycap } from './validate'
import { parseKeycapSettings, serializeKeycapSettings } from './preset'

const { intersect, union } = booleans
const { measureBoundingBox, measureVolume } = measurements
const { cuboid } = primitives

describe('Cherry profile keycap', () => {
  it.each([1, 2, 3, 4] as const)('creates the expected 1U envelope for R%s', (row) => {
    const parameters = { ...defaultKeycapParameters, row }
    const bounds = keycapBounds(parameters)
    expect(bounds.width).toBeCloseTo(18.16, 1)
    expect(bounds.depth).toBeGreaterThanOrEqual(18.1)
    expect(bounds.height).toBeGreaterThan(cherryRowProfiles[row].height - 1)
    expect(measureVolume(createKeycapSolid(parameters))).toBeGreaterThan(250)
  })

  it('uses independently adjustable MX cross clearance', () => {
    expect(MX_CROSS_BASE.horizontal).toEqual([4.03, 1.25])
    expect(MX_CROSS_BASE.vertical).toEqual([1.15, 4.23])
    const tight = measureVolume(createMxStem({ ...defaultKeycapParameters, stemFitClearance: 0 }))
    const loose = measureVolume(createMxStem({ ...defaultKeycapParameters, stemFitClearance: 0.3 }))
    expect(loose).toBeLessThan(tight)
  })

  it('starts the MX stem at the underside and leaves the cross open', () => {
    const stem = createMxStem(defaultKeycapParameters)
    const [minimum, maximum] = measureBoundingBox(stem)
    expect(minimum[2]).toBeCloseTo(0)
    expect(maximum[2]).toBeCloseTo(cherryRowProfiles[3].height - defaultKeycapParameters.topThickness + 0.3)
    const crossProbe = cuboid({ size: [0.4, 0.4, 0.6], center: [0, 0, 0.3] })
    const stemWallProbe = cuboid({ size: [0.3, 0.3, 0.6], center: [2.5, 0, 0.3] })
    expect(measureVolume(intersect(stem, crossProbe))).toBeLessThan(0.001)
    expect(measureVolume(intersect(stem, stemWallProbe))).toBeGreaterThan(0.05)
  })

  it('retains a thickened round stem for comparison', () => {
    const parameters = { ...defaultKeycapParameters, stemShape: 'round' as const, stemOuterDiameter: 6.2, stemFitClearance: 0.15 }
    const stem = createMxStem(parameters)
    const [minimum, maximum] = measureBoundingBox(stem)
    expect(maximum[0] - minimum[0]).toBeCloseTo(MX_STEM_OUTER_DIAMETER, 2)
    expect(maximum[1] - minimum[1]).toBeCloseTo(MX_STEM_OUTER_DIAMETER, 2)
    expect(MX_STEM_OUTER_DIAMETER).toBe(6.2)
    expect(mxStemMinimumWall(parameters)).toBeGreaterThanOrEqual(0.9)
  })

  it('keeps the three T ribs confined to the root above the socket', () => {
    expect(STEM_SUPPORT_ANGLES).toEqual([0, 180, 270])

    const supports = createStemSupports(defaultKeycapParameters)
    for (const degrees of STEM_SUPPORT_ANGLES) {
      const radians = degrees * Math.PI / 180
      const probe = cuboid({
        size: [0.45, 0.45, 0.45],
        center: [Math.cos(radians) * 4.2, Math.sin(radians) * 4.2, 4.4],
      })
      expect(measureVolume(intersect(supports, probe)), `${degrees}° support`).toBeGreaterThan(0.005)
    }
    const [supportMinimum, supportMaximum] = measureBoundingBox(supports)
    expect(supportMaximum[0]).toBeLessThanOrEqual(STEM_SUPPORT_REACH + 0.3)
    expect(supportMinimum[0]).toBeGreaterThanOrEqual(-STEM_SUPPORT_REACH - 0.3)
    expect(supportMinimum[2]).toBeGreaterThanOrEqual(defaultKeycapParameters.stemDepth)
  })

  it('uses a rounded box with a blind MX socket at the selected depth', () => {
    const cross = mxCrossCutoutDimensions(defaultKeycapParameters)
    expect(defaultKeycapParameters.stemFitClearance).toBe(0.1)
    expect(cross.horizontal[0]).toBeCloseTo(4.1)
    expect(cross.horizontal[1]).toBeCloseTo(1.4)
    expect(cross.vertical[0]).toBeCloseTo(1.3)
    expect(cross.vertical[1]).toBeCloseTo(4.025)
    expect(mxStemMinimumWall(defaultKeycapParameters)).toBeCloseTo(0.635)
    const stem = createMxStem(defaultKeycapParameters)
    const [minimum, maximum] = measureBoundingBox(stem)
    expect(maximum[0] - minimum[0]).toBeCloseTo(5.37)
    const corner = cuboid({ size: [0.2, 0.2, 0.2], center: [2.1, 2.1, 1] })
    expect(measureVolume(intersect(stem, corner))).toBeCloseTo(0.008)
    const depthProbe = cuboid({ size: [0.2, 0.2, 0.2], center: [0, 0, 3.7] })
    expect(measureVolume(intersect(stem, depthProbe))).toBeLessThan(0.001)
    expect(measureVolume(intersect(createMxStem({ ...defaultKeycapParameters, stemDepth: 3.4 }), depthProbe))).toBeCloseTo(0.008)
    const rootProbe = cuboid({ size: [0.2, 0.2, 0.2], center: [0, 0, 4.2] })
    expect(measureVolume(intersect(stem, rootProbe))).toBeCloseTo(0.008)
  })

  it('round-trips box settings and preserves old round settings', () => {
    expect(parseKeycapSettings(serializeKeycapSettings(defaultKeycapParameters))).toEqual(defaultKeycapParameters)
    const { stemShape: _shape, ...legacy } = defaultKeycapParameters
    expect(parseKeycapSettings(JSON.stringify({ schemaVersion: 1, product: 'cherry-keycap', parameters: legacy })).stemShape).toBe('round')
  })

  it('keeps the underside open around the central stem', () => {
    const openingProbe = cuboid({ size: [1, 2, 0.4], center: [5, 0, 0.1] })
    expect(measureVolume(intersect(createKeycapSolid(defaultKeycapParameters), openingProbe))).toBeLessThan(0.01)
  })

  it('splits the rounded diamond into a non-overlapping accent part', () => {
    const parts = createKeycapAssembly(defaultKeycapParameters)
    expect(parts.map((part) => part.id)).toEqual(['keycap-body', 'top-accent'])
    for (const part of parts) expect(measureVolume(part.geometry), part.id).toBeGreaterThan(0.1)
    for (let left = 0; left < parts.length; left += 1) {
      for (let right = left + 1; right < parts.length; right += 1) {
        expect(measureVolume(intersect(parts[left].geometry, parts[right].geometry))).toBeLessThan(0.01)
      }
    }
    const recombined = union(...parts.map((part) => part.geometry))
    expect(measureVolume(recombined)).toBeCloseTo(measureVolume(createKeycapSolid(defaultKeycapParameters)), 2)
    const stemWallProbe = cuboid({ size: [0.3, 0.3, 0.6], center: [2.45, 0, 0.3] })
    expect(measureVolume(intersect(parts[0].geometry, stemWallProbe))).toBeGreaterThan(0.05)
  })

  it('serializes a two-part 3MF', () => {
    const chunks = threeMfSerializer.serialize(
      { unit: 'millimeter', compress: true },
      ...createKeycapAssembly(defaultKeycapParameters).map((part) => part.geometry),
    )
    const size = chunks.reduce((total: number, chunk: ArrayBuffer) => total + chunk.byteLength, 0)
    expect(size).toBeGreaterThan(1_000)
  })

  it('splits the 3MF into a body, printable stem, and accent', () => {
    const parts = createKeycap3mfAssembly(defaultKeycapParameters)
    expect(parts.map((part) => [part.id, part.color])).toEqual([
      ['keycap-body', '#f1eadc'],
      ['mx-stem', '#f1eadc'],
      ['top-accent', '#4f7cff'],
    ])
    for (const part of parts) expect(measureVolume(part.geometry), part.id).toBeGreaterThan(0.1)
    expect(measureVolume(intersect(parts[0].geometry, parts[2].geometry))).toBeLessThan(0.01)
    const stemWallProbe = cuboid({ size: [0.3, 0.3, 0.6], center: [2.45, 0, 0.3] })
    expect(measureVolume(intersect(parts[1].geometry, stemWallProbe))).toBeGreaterThan(0.05)
  })

  it('rejects an inlay that leaves too little top material', () => {
    const messages = validateKeycap({ ...defaultKeycapParameters, topThickness: 1.2, inlayDepth: 0.9 })
    expect(messages.some((message) => message.level === 'error' && message.message.includes('天面厚'))).toBe(true)
  })
})
