import threeMfSerializer from '@jscad/3mf-serializer'
import stlSerializer from '@jscad/stl-serializer'
import { measurements, transforms } from '@jscad/modeling'
import { createMonitorClip } from '../clip/model'
import type { ClipParameters } from '../clip/parameters'
import type { DerivedDimensions } from '../domain/derive'
import { createAssembly, createBeam, createLeg } from '../geometry/model'
import type { JscadGeometry } from '../geometry/types'
import type { MicrophoneStandDimensions } from '../microphone/derive'
import {
  createMicrophoneAssembly,
  createMicrophoneBase,
  createMicrophoneHolder,
  createMicrophoneMast,
} from '../microphone/model'

const { measureBoundingBox } = measurements
const { translate } = transforms

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
  downloadStl(createLeg(d), 'instrument-stand-leg.stl')
}

export function downloadFrontBeam(d: DerivedDimensions) {
  downloadStl(createBeam(d, d.frontBeamChamber), 'instrument-stand-front-beam.stl')
}

export function downloadRearBeam(d: DerivedDimensions) {
  downloadStl(createBeam(d, d.rearBeamChamber), 'instrument-stand-rear-beam.stl')
}

export function downloadAssembly3mf(d: DerivedDimensions) {
  const geometries = createAssembly(d).map((part) => part.geometry)
  const data = threeMfSerializer.serialize({ unit: 'millimeter', compress: true }, ...geometries) as BlobPart[]
  download(data, 'model/3mf', 'instrument-stand.3mf')
}

function moveToOrigin(geometry: JscadGeometry): JscadGeometry {
  const [minimum] = measureBoundingBox(geometry)
  return translate([-minimum[0], -minimum[1], -minimum[2]], geometry) as JscadGeometry
}

export function downloadMicrophoneBase(d: MicrophoneStandDimensions) {
  downloadStl(moveToOrigin(createMicrophoneBase(d)), 'videomic-me-c-base.stl')
}

export function downloadMicrophoneMast(d: MicrophoneStandDimensions) {
  downloadStl(moveToOrigin(createMicrophoneMast(d)), 'videomic-me-c-mast.stl')
}

export function downloadMicrophoneHolder(d: MicrophoneStandDimensions) {
  downloadStl(moveToOrigin(createMicrophoneHolder(d)), 'videomic-me-c-holder.stl')
}

export function downloadMicrophoneAssembly3mf(d: MicrophoneStandDimensions) {
  const geometries = createMicrophoneAssembly(d)
    .filter((part) => part.printable !== false)
    .map((part) => part.geometry)
  const data = threeMfSerializer.serialize({ unit: 'millimeter', compress: true }, ...geometries) as BlobPart[]
  download(data, 'model/3mf', 'videomic-me-c-stand.3mf')
}

export function downloadMonitorClip(parameters: ClipParameters) {
  downloadStl(createMonitorClip(parameters), 'lg-49wl95c-stabilizer-clip.stl')
}
