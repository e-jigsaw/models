import { booleans, measurements, primitives } from '@jscad/modeling'
import { describe, expect, it } from 'vitest'
import { deriveMicrophoneStand } from './derive'
import {
  createConnectorReference,
  createMicrophoneAssembly,
  createMicrophoneBase,
  createMicrophoneHolder,
  createMicrophoneReference,
  createMicrophoneMast,
} from './model'
import { defaultMicrophoneStandParameters } from './parameters'

const { intersect } = booleans
const { measureBoundingBox, measureVolume } = measurements
const { cylinder } = primitives
const dimensions = deriveMicrophoneStand(defaultMicrophoneStandParameters)

describe('VideoMic Me-C stand geometry', () => {
  it('keeps the tripod base on the floor and inside its circumscribed diameter', () => {
    const [minimum, maximum] = measureBoundingBox(createMicrophoneBase(dimensions))
    expect(minimum[2]).toBeCloseTo(0)
    expect(maximum[2]).toBeCloseTo(dimensions.hubHeight)
    expect(Math.max(Math.abs(minimum[0]), Math.abs(maximum[0]))).toBeLessThanOrEqual(dimensions.footprintRadius + 0.01)
    expect(Math.max(Math.abs(minimum[1]), Math.abs(maximum[1]))).toBeLessThanOrEqual(dimensions.footprintRadius + 0.01)
  })

  it('creates one solid 325 mm mast without a middle joint or cable slit', () => {
    const mast = createMicrophoneMast(dimensions)
    const [minimum, maximum] = measureBoundingBox(mast)
    expect(minimum[2]).toBeCloseTo(0)
    expect(maximum[2]).toBeCloseTo(325)
    expect(measureVolume(mast)).toBeCloseTo(measureVolume(cylinder({
      height: dimensions.mastLength,
      radius: dimensions.mastDiameter / 2,
      segments: 48,
    })), 5)
  })

  it('marks the microphone and USB-C mockups as reference-only', () => {
    const parts = createMicrophoneAssembly(dimensions)
    expect(parts.filter((part) => part.printable !== false)).toHaveLength(3)
    expect(parts.filter((part) => part.printable === false).map((part) => part.id)).toEqual([
      'videomic-reference',
      'usb-c-reference',
    ])
  })

  it('keeps the holder and yoke outside the microphone and USB-C envelopes', () => {
    const holder = createMicrophoneHolder(dimensions)
    expect(measureVolume(intersect(holder, createMicrophoneReference(dimensions)))).toBeLessThan(0.01)
    expect(measureVolume(intersect(holder, createConnectorReference(dimensions)))).toBeLessThan(0.01)
  })

  it('lifts the default holder directly above the mast axis', () => {
    const [minimum, maximum] = measureBoundingBox(createMicrophoneHolder(dimensions))
    expect(dimensions.holderForwardOffset).toBe(0)
    expect(Math.abs(minimum[0] + maximum[0])).toBeLessThan(1)
    expect(dimensions.standHeight - dimensions.holderOuterRadius - dimensions.mastTopZ)
      .toBeCloseTo(dimensions.holderLift)
  })
})
