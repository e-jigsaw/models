import threeMfSerializer from '@jscad/3mf-serializer'
import { createTesterAssembly, type TesterParameters } from '../switchTester/model'
import stlSerializer from '@jscad/stl-serializer'
import { measurements, transforms } from '@jscad/modeling'
import { strToU8, zipSync } from 'fflate'
import { createMonitorClip } from '../clip/model'
import type { ClipParameters } from '../clip/parameters'
import type { DerivedDimensions } from '../domain/derive'
import { createAssembly, createBeam, createLeg } from '../geometry/model'
import type { AssemblyPart, JscadGeometry } from '../geometry/types'
import type { MicrophoneStandDimensions } from '../microphone/derive'
import { createKeycap3mfAssembly, createKeycapAssembly } from '../keycap/model'
import type { KeycapParameters } from '../keycap/parameters'
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

export function downloadTester3mf(parameters: TesterParameters) {
  download(serializeBambuAssembly3mf(createTesterAssembly(parameters, true), 'three-key-switch-tester'), 'model/3mf', 'three-key-switch-tester.3mf')
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

export function downloadKeycapPart(parameters: KeycapParameters, partId: 'keycap-body' | 'top-accent') {
  const part = createKeycapAssembly(parameters).find((candidate) => candidate.id === partId)
  if (!part) throw new Error(`Unknown keycap part: ${partId}`)
  downloadStl(moveToOrigin(part.geometry), `cherry-keycap-${partId}.stl`)
}

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function serializeTriangleMesh(geometry: JscadGeometry) {
  const chunks = stlSerializer.serialize({ binary: true }, geometry) as ArrayBuffer[]
  const byteLength = chunks.reduce((total, chunk) => total + chunk.byteLength, 0)
  const bytes = new Uint8Array(byteLength)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(new Uint8Array(chunk), offset)
    offset += chunk.byteLength
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const triangleCount = view.getUint32(80, true)
  const vertices: string[] = []
  const vertexIndices = new Map<string, number>()
  const triangles: string[] = []
  for (let triangle = 0; triangle < triangleCount; triangle += 1) {
    const triangleOffset = 84 + triangle * 50
    const triangleVertices: number[] = []
    for (let vertex = 0; vertex < 3; vertex += 1) {
      const vertexOffset = triangleOffset + 12 + vertex * 12
      const x = view.getFloat32(vertexOffset, true)
      const y = view.getFloat32(vertexOffset + 4, true)
      const z = view.getFloat32(vertexOffset + 8, true)
      const key = `${x},${y},${z}`
      let index = vertexIndices.get(key)
      if (index === undefined) {
        index = vertices.length
        vertexIndices.set(key, index)
        vertices.push(`          <vertex x="${x}" y="${y}" z="${z}"/>`)
      }
      triangleVertices.push(index)
    }
    triangles.push(`          <triangle v1="${triangleVertices[0]}" v2="${triangleVertices[1]}" v3="${triangleVertices[2]}"/>`)
  }
  return { vertices, triangles }
}

function createMultipartModel(parts: AssemblyPart[], assemblyName: string) {
  const assemblyId = parts.length + 1
  const partColors = parts.map((part) => part.color.toUpperCase())
  const colors = [...new Set(partColors)]
  const colorGroup = [
    '    <m:colorgroup id="1">',
    ...colors.map((color) => `      <m:color color="${color}FF"/>`),
    '    </m:colorgroup>',
  ].join('\n')
  const components = parts
    .map((_, index) => `        <component objectid="${index + 1}"/>`)
    .join('\n')
  const assembly = [
    `    <object id="${assemblyId}" type="model" name="${escapeXml(assemblyName)}">`,
    '      <components>',
    components,
    '      </components>',
    '    </object>',
  ].join('\n')
  const objects = parts.map((part, index) => {
    const mesh = serializeTriangleMesh(part.geometry)
    return [
      `    <object id="${index + 1}" type="model" pid="1" pindex="${colors.indexOf(partColors[index])}" name="${escapeXml(part.id)}">`,
      '      <mesh>',
      '        <vertices>',
      ...mesh.vertices,
      '        </vertices>',
      '        <triangles>',
      ...mesh.triangles,
      '        </triangles>',
      '      </mesh>',
      '    </object>',
    ].join('\n')
  }).join('\n')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<model unit="millimeter" xml:lang="und" xmlns="http://schemas.microsoft.com/3dmanufacturing/core/2015/02" xmlns:m="http://schemas.microsoft.com/3dmanufacturing/material/2015/02" requiredextensions="m">',
    '  <metadata name="Application">Models</metadata>',
    '  <resources>',
    colorGroup,
    objects,
    assembly,
    '  </resources>',
    '  <build>',
    `    <item objectid="${assemblyId}"/>`,
    '  </build>',
    '</model>',
  ].join('\n')
}

export function serializeBambuAssembly3mf(parts: AssemblyPart[], assemblyName: string) {
  const model = createMultipartModel(parts, assemblyName)
  const archive = zipSync({
    '[Content_Types].xml': strToU8([
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '  <Default Extension="model" ContentType="application/vnd.ms-package.3dmanufacturing-3dmodel+xml"/>',
      '</Types>',
    ].join('\n')),
    '_rels/.rels': strToU8([
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '  <Relationship Target="/3D/3dmodel.model" Id="rel-1" Type="http://schemas.microsoft.com/3dmanufacturing/2013/01/3dmodel"/>',
      '</Relationships>',
    ].join('\n')),
    '3D/3dmodel.model': strToU8(model),
  })
  return [archive.buffer.slice(archive.byteOffset, archive.byteOffset + archive.byteLength) as ArrayBuffer] as BlobPart[]
}

export function downloadKeycap3mf(parameters: KeycapParameters) {
  const filename = `cherry-r${parameters.row}-keycap.3mf`
  const assemblyName = filename.replace(/\.3mf$/i, '')
  download(
    serializeBambuAssembly3mf(createKeycap3mfAssembly(parameters), assemblyName),
    'model/3mf',
    filename,
  )
}
