import threeMfSerializer from '@jscad/3mf-serializer'
import stlSerializer from '@jscad/stl-serializer'
import type { DerivedDimensions } from '../domain/derive'
import { createAssembly, createBeam, createLeg, type JscadGeometry } from '../geometry/model'

function download(parts: BlobPart[], type: string, filename: string) {
  const url = URL.createObjectURL(new Blob(parts, { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.append(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000)
}

export function downloadStl(geometry: JscadGeometry, filename: string) {
  const data = stlSerializer.serialize({ binary: true }, geometry) as BlobPart[]
  download(data, 'model/stl', filename)
}

export function downloadLeg(d: DerivedDimensions) {
  downloadStl(createLeg(d), 'flex-stand-leg.stl')
}

export function downloadFrontBeam(d: DerivedDimensions) {
  downloadStl(createBeam(d, d.frontBeamChamber), 'flex-stand-front-beam.stl')
}

export function downloadRearBeam(d: DerivedDimensions) {
  downloadStl(createBeam(d, d.rearBeamChamber), 'flex-stand-rear-beam.stl')
}

export function downloadAssembly3mf(d: DerivedDimensions) {
  const geometries = createAssembly(d).map((part) => part.geometry)
  const data = threeMfSerializer.serialize({ unit: 'millimeter', compress: true }, ...geometries) as BlobPart[]
  download(data, 'model/3mf', 'flex-stand.3mf')
}
