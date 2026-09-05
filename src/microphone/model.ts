import { booleans, hulls, primitives, transforms } from '@jscad/modeling'
import type { AssemblyPart, JscadGeometry } from '../geometry/model'
import { VIDEOMIC_ME_C, type MicrophoneStandDimensions } from './derive'

const { subtract, union } = booleans
const { hull } = hulls
const { cuboid, cylinder, sphere } = primitives
const { rotateY, translate } = transforms

function zCylinder(radius: number, height: number, z = height / 2): JscadGeometry {
  return translate([0, 0, z], cylinder({ height, radius, segments: 48 })) as JscadGeometry
}

export function createMicrophoneBase(d: MicrophoneStandDimensions): JscadGeometry {
  const hub = zCylinder(d.hubDiameter / 2, d.hubHeight)
  const feet = [Math.PI, Math.PI / 3, -Math.PI / 3].map((angle) => {
    const end: [number, number, number] = [
      Math.cos(angle) * (d.footprintRadius - d.footRadius),
      Math.sin(angle) * (d.footprintRadius - d.footRadius),
      d.baseHeight / 2,
    ]
    return hull(
      translate([0, 0, d.baseHeight / 2], cylinder({ height: d.baseHeight, radius: d.hubDiameter * 0.34, segments: 32 })),
      translate(end, cylinder({ height: d.baseHeight, radius: d.footRadius, segments: 40 })),
    )
  })
  const socket = translate(
    [0, 0, d.hubHeight - d.mastSocketDepth / 2 + 0.5],
    cylinder({
      height: d.mastSocketDepth + 1,
      radius: d.mastDiameter / 2 + d.fitClearance,
      segments: 48,
    }),
  )
  return subtract(union(hub, ...feet), socket) as JscadGeometry
}

export function createMicrophoneMast(d: MicrophoneStandDimensions): JscadGeometry {
  return zCylinder(d.mastDiameter / 2, d.mastLength)
}

function rotatePointY(point: [number, number, number], radians: number): [number, number, number] {
  const [x, y, z] = point
  return [
    x * Math.cos(radians) + z * Math.sin(radians),
    y,
    -x * Math.sin(radians) + z * Math.cos(radians),
  ]
}

export function createMicrophoneHolder(d: MicrophoneStandDimensions): JscadGeometry {
  const tilt = d.tiltAngle * Math.PI / 180
  const collarCenter: [number, number, number] = [d.holderForwardOffset, 0, d.standHeight]
  const outer = rotateY(
    Math.PI / 2,
    cylinder({ height: d.holderLength, radius: d.holderOuterRadius, segments: 64 }),
  )
  const inner = rotateY(
    Math.PI / 2,
    cylinder({ height: d.holderLength + 2, radius: d.holderInnerRadius, segments: 64 }),
  )
  const portSlotWidth = Math.max(11, d.cableDiameter + 5)
  const bottomOpening = cuboid({
    center: [0, 0, -d.holderOuterRadius],
    size: [d.holderLength + 4, portSlotWidth, d.holderOuterRadius * 2 + 2],
  })
  const collar = translate(
    collarCenter,
    rotateY(tilt, subtract(outer, inner, bottomOpening)),
  )

  const rodRadius = Math.max(2.6, d.holderWall * 0.9)
  const anchorY = d.holderOuterRadius - 0.2
  const localAnchorZ = -1
  const mastAnchorZ = d.mastTopZ + 1.5
  const supports = [-1, 1].map((side) => {
    const rotatedAnchor = rotatePointY([0, side * anchorY, localAnchorZ], tilt)
    const ringAnchor: [number, number, number] = [
      collarCenter[0] + rotatedAnchor[0],
      collarCenter[1] + rotatedAnchor[1],
      collarCenter[2] + rotatedAnchor[2],
    ]
    const mastAnchor: [number, number, number] = [0, side * d.mastDiameter * 0.27, mastAnchorZ]
    return hull(
      sphere({ center: ringAnchor, radius: rodRadius, segments: 24 }),
      sphere({ center: mastAnchor, radius: rodRadius, segments: 24 }),
    )
  })

  const bossBottom = d.mastTopZ - d.holderSocketDepth
  const bossHeight = d.holderSocketDepth + 5
  const bossOuter = translate(
    [0, 0, bossBottom + bossHeight / 2],
    cylinder({ height: bossHeight, radius: d.mastDiameter / 2 + d.holderWall, segments: 48 }),
  )
  const bossSocket = translate(
    [0, 0, bossBottom + d.holderSocketDepth / 2 - 0.5],
    cylinder({
      height: d.holderSocketDepth + 1,
      radius: d.mastDiameter / 2 + d.fitClearance,
      segments: 48,
    }),
  )

  return union(collar, ...supports, subtract(bossOuter, bossSocket)) as JscadGeometry
}

export function createMicrophoneReference(d: MicrophoneStandDimensions): JscadGeometry {
  const body = rotateY(
    Math.PI / 2 + d.tiltAngle * Math.PI / 180,
    cylinder({ height: VIDEOMIC_ME_C.length, radius: VIDEOMIC_ME_C.bodyDiameter / 2, segments: 64 }),
  )
  return translate([d.holderForwardOffset, 0, d.standHeight], body) as JscadGeometry
}

export function createConnectorReference(d: MicrophoneStandDimensions): JscadGeometry {
  const connector = cuboid({ size: [12, 8.4, 7.2] })
  const tilt = d.tiltAngle * Math.PI / 180
  const center = rotatePointY([0, 0, -VIDEOMIC_ME_C.bodyDiameter / 2 - 3.4], tilt)
  return translate([
    d.holderForwardOffset + center[0],
    center[1],
    d.standHeight + center[2],
  ], rotateY(tilt, connector)) as JscadGeometry
}

export function createMicrophoneAssembly(d: MicrophoneStandDimensions): AssemblyPart[] {
  return [
    { id: 'microphone-base', color: '#d9ff57', geometry: createMicrophoneBase(d) },
    {
      id: 'microphone-mast',
      color: '#d9ff57',
      geometry: translate([0, 0, d.baseSocketBottomZ], createMicrophoneMast(d)) as JscadGeometry,
    },
    { id: 'microphone-holder', color: '#ff784f', geometry: createMicrophoneHolder(d) },
    { id: 'videomic-reference', color: '#242721', geometry: createMicrophoneReference(d), printable: false },
    { id: 'usb-c-reference', color: '#b8bbaf', geometry: createConnectorReference(d), printable: false },
  ]
}
