import threeMfSerializer from '@jscad/3mf-serializer'
import stlSerializer from '@jscad/stl-serializer'
import { describe, expect, it } from 'vitest'
import { deriveMicrophoneStand } from './derive'
import { createMicrophoneAssembly } from './model'
import { defaultMicrophoneStandParameters } from './parameters'

describe('VideoMic Me-C model serialization', () => {
  const dimensions = deriveMicrophoneStand(defaultMicrophoneStandParameters)
  const printable = createMicrophoneAssembly(dimensions).filter((part) => part.printable !== false)

  it('serializes each of the three printed parts as binary STL', () => {
    expect(printable).toHaveLength(3)
    for (const part of printable) {
      const chunks = stlSerializer.serialize({ binary: true }, part.geometry)
      const size = chunks.reduce((total: number, chunk: ArrayBuffer) => total + chunk.byteLength, 0)
      expect(size, part.id).toBeGreaterThan(1_000)
    }
  })

  it('serializes a three-part 3MF without the reference microphone', () => {
    const chunks = threeMfSerializer.serialize(
      { unit: 'millimeter', compress: true },
      ...printable.map((part) => part.geometry),
    )
    const size = chunks.reduce((total: number, chunk: ArrayBuffer) => total + chunk.byteLength, 0)
    expect(size).toBeGreaterThan(1_000)
  })
})
