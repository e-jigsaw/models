import { booleans, measurements, primitives } from '@jscad/modeling'
import { describe, expect, it } from 'vitest'
import { createTester, createTesterPrint, defaultTesterParameters as defaults, testerCenters, validateTester } from './model'

const volume = measurements.measureVolume
const probe = (x: number, y: number, z: number) => primitives.cuboid({ size: [0.1, 0.1, 0.1], center: [x, y, z] })
describe('three-key tester', () => {
  it('has the intended envelope in both orientations', () => {
    for (const model of [createTester(defaults), createTesterPrint(defaults)]) {
      const [min, max] = measurements.measureBoundingBox(model)
      expect(max[0] - min[0]).toBeCloseTo(62)
      expect(max[1] - min[1]).toBeCloseTo(24)
      expect(min[2]).toBeCloseTo(0)
      expect(max[2]).toBeCloseTo(12)
      expect(volume(model)).toBeGreaterThan(3500)
    }
  })
  it('leaves three through openings, an open underside, and intact webs', () => {
    const model = createTester(defaults)
    for (const x of testerCenters) {
      expect(volume(booleans.intersect(model, primitives.cuboid({ size: [14.09, 14.09, 14], center: [x, 0, 6] })))).toBeCloseTo(0)
    }
    expect(volume(booleans.intersect(model, probe(9.525, 0, 11)))).toBeCloseTo(0.001)
    expect(volume(booleans.intersect(model, probe(9.525, 0, 1)))).toBeCloseTo(0)
    expect(volume(booleans.intersect(model, probe(0, 11, 1)))).toBeCloseTo(0.001)
  })
  it('keeps the plate 1.5 mm and puts it on the print bed', () => {
    const model = createTesterPrint(defaults)
    expect(volume(booleans.intersect(model, probe(9.525, 0, 1.4)))).toBeCloseTo(0.001)
    expect(volume(booleans.intersect(model, probe(9.525, 0, 1.6)))).toBeCloseTo(0)
  })
  it('adjusts fit independently and guards invalid inputs', () => {
    expect(volume(createTester({ ...defaults, holeSize: 14.3 }))).toBeLessThan(volume(createTester(defaults)))
    expect(validateTester(defaults)).toEqual([])
    for (const p of [{ ...defaults, holeSize: NaN }, { ...defaults, height: 0 }, { ...defaults, wallThickness: 4 }]) {
      expect(validateTester(p).length).toBeGreaterThan(0)
      expect(() => createTester(p)).toThrow()
    }
  })
})
