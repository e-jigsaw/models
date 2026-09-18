import threeMfSerializer from '@jscad/3mf-serializer'
import stlSerializer from '@jscad/stl-serializer'
import { strFromU8, unzipSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { deriveDimensions } from '../domain/derive'
import { defaultParameters } from '../domain/parameters'
import { createAssembly, createBeam, createLeg, retentionHoleYPositions } from '../geometry/model'
import { createKeycap3mfAssembly } from '../keycap/model'
import { defaultKeycapParameters } from '../keycap/parameters'
import { serializeBambuAssembly3mf } from './download'

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

  it('serializes the keycap as one Bambu object with two colored parts', () => {
    const keycapParts = createKeycap3mfAssembly(defaultKeycapParameters)
    const [data] = serializeBambuAssembly3mf(keycapParts, 'cherry-r1-keycap')
    const archive = unzipSync(new Uint8Array(data as ArrayBuffer))
    const model = strFromU8(archive['3D/3dmodel.model'])

    expect(model).toContain('xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02"')
    expect(model).toContain('<m:colorgroup id="1">')
    expect(model).toContain('<m:color color="#F1EADCFF"/>')
    expect(model).toContain('<m:color color="#4F7CFFFF"/>')
    expect((model.match(/<component objectid=/g) ?? [])).toHaveLength(3)
    expect(model).toContain('<item objectid="4"/>')
    expect(model).toContain('<object id="1" type="model" pid="1" pindex="0" name="keycap-body">')
    expect(model).toContain('<object id="2" type="model" pid="1" pindex="0" name="mx-stem">')
    expect(model).toContain('<object id="3" type="model" pid="1" pindex="1" name="top-accent">')
    expect(archive['Metadata/project_settings.config']).toBeUndefined()
    expect(archive['Metadata/model_settings.config']).toBeUndefined()
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
