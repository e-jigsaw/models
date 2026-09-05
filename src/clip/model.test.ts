import { measurements } from '@jscad/modeling'
import stlSerializer from '@jscad/stl-serializer'
import { describe, expect, it } from 'vitest'
import { clipWallBaseThickness, createMonitorClip } from './model'
import { clipOpening, defaultClipParameters } from './parameters'
import { validateClip } from './validate'

const { measureBoundingBox, measureVolume } = measurements

describe('monitor stabilizer clip', () => {
  it('uses the monitor thickness and two-sided clearance for its opening', () => {
    expect(clipOpening(defaultClipParameters)).toBe(32)
  })

  it('flares each wall from its top thickness to about 12 mm at the base', () => {
    expect(clipWallBaseThickness(defaultClipParameters)).toBeCloseTo(12, 1)
  })

  it('widens the wall base when the outer face angle is reduced', () => {
    const widerBase = clipWallBaseThickness({ ...defaultClipParameters, wallAngle: 60 })
    expect(widerBase).toBeGreaterThan(clipWallBaseThickness(defaultClipParameters))
  })

  it('creates the requested base footprint and total height', () => {
    const [minimum, maximum] = measureBoundingBox(createMonitorClip(defaultClipParameters))
    expect(maximum[0] - minimum[0]).toBeCloseTo(120)
    expect(maximum[1] - minimum[1]).toBeCloseTo(80)
    expect(maximum[2] - minimum[2]).toBeCloseTo(35)
  })

  it('raises only the base area between the walls without changing total height', () => {
    const flat = createMonitorClip(defaultClipParameters)
    const raised = createMonitorClip({ ...defaultClipParameters, clipBridgeHeight: 3 })
    const flatBounds = measureBoundingBox(flat)
    const raisedBounds = measureBoundingBox(raised)
    expect(raisedBounds[1][2] - raisedBounds[0][2]).toBeCloseTo(flatBounds[1][2] - flatBounds[0][2])
    expect(measureVolume(raised) - measureVolume(flat)).toBeCloseTo(32 * 45 * 3, -1)
  })

  it('serializes as a printable STL', () => {
    const parts = stlSerializer.serialize({ binary: true }, createMonitorClip(defaultClipParameters))
    const size = parts.reduce((total: number, part: ArrayBuffer) => total + part.byteLength, 0)
    expect(size).toBeGreaterThan(1_000)
  })

  it('rejects a base narrower than the clip', () => {
    const messages = validateClip({ ...defaultClipParameters, baseWidth: 40 })
    expect(messages.some((message) => message.level === 'error' && message.message.includes('クリップ幅'))).toBe(true)
  })

  it('warns when the clip does not fit the printer bed', () => {
    const messages = validateClip({ ...defaultClipParameters, printerBedX: 100, printerBedY: 100 })
    expect(messages.some((message) => message.message.includes('造形面'))).toBe(true)
  })

  it('rejects an outer face angle outside the supported range', () => {
    const messages = validateClip({ ...defaultClipParameters, wallAngle: 50 })
    expect(messages.some((message) => message.level === 'error' && message.message.includes('外側面角度'))).toBe(true)
  })

  it('rejects a negative bridge height', () => {
    const messages = validateClip({ ...defaultClipParameters, clipBridgeHeight: -1 })
    expect(messages.some((message) => message.level === 'error' && message.message.includes('盛り上げ'))).toBe(true)
  })
})
