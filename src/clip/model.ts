import { booleans, extrusions, primitives, transforms } from '@jscad/modeling'
import type { AssemblyPart, JscadGeometry } from '../geometry/types'
import { clipOpening, type ClipParameters } from './parameters'

const { union } = booleans
const { extrudeLinear } = extrusions
const { cuboid, polygon, roundedRectangle } = primitives
const { rotateX, translate } = transforms

export function clipWallBaseThickness(parameters: ClipParameters): number {
  const angleRadians = parameters.wallAngle * Math.PI / 180
  return parameters.wallThickness + parameters.clipHeight / Math.tan(angleRadians)
}

export function createMonitorClip(parameters: ClipParameters): JscadGeometry {
  const opening = clipOpening(parameters)
  const wallBaseThickness = clipWallBaseThickness(parameters)
  const base = extrudeLinear(
    { height: parameters.baseThickness },
    roundedRectangle({
      size: [parameters.baseDepth, parameters.baseWidth],
      roundRadius: parameters.cornerRadius,
      segments: 32,
    }),
  )
  const wallBottom = parameters.baseThickness - 0.1
  const wallTop = parameters.baseThickness + parameters.clipHeight
  const halfOpening = opening / 2
  const wall = (side: -1 | 1) => {
    const points: Array<[number, number]> = side === 1
      ? [
          [halfOpening, wallBottom],
          [halfOpening + wallBaseThickness, wallBottom],
          [halfOpening + parameters.wallThickness, wallTop],
          [halfOpening, wallTop],
        ]
      : [
          [-halfOpening - wallBaseThickness, wallBottom],
          [-halfOpening, wallBottom],
          [-halfOpening, wallTop],
          [-halfOpening - parameters.wallThickness, wallTop],
        ]

    return translate(
      [0, parameters.clipWidth / 2, 0],
      rotateX(
        Math.PI / 2,
        extrudeLinear({ height: parameters.clipWidth }, polygon({ points })),
      ),
    )
  }

  const bridge = parameters.clipBridgeHeight > 0
    ? translate(
        [0, 0, parameters.baseThickness + parameters.clipBridgeHeight / 2],
        cuboid({ size: [opening, parameters.clipWidth, parameters.clipBridgeHeight] }),
      )
    : undefined

  return union(base, wall(-1), wall(1), ...(bridge ? [bridge] : [])) as JscadGeometry
}

export function createMonitorClipPreview(parameters: ClipParameters): AssemblyPart[] {
  return [{ id: 'monitor-clip', color: '#70d7ff', geometry: createMonitorClip(parameters) }]
}
