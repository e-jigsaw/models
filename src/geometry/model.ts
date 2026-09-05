import { booleans, extrusions, hulls, primitives, transforms } from '@jscad/modeling'
import type { BeamChamberProfile, DerivedDimensions } from '../domain/derive'

export type JscadGeometry = ReturnType<typeof primitives.cuboid>

const { circle, cylinder, polygon, rectangle } = primitives
const { hull } = hulls
const { extrudeLinear } = extrusions
const { rotateX, translate } = transforms
const { intersect, subtract, union } = booleans

function segment2d(
  from: [number, number],
  to: [number, number],
  width: number,
) {
  const radius = width / 2
  return hull(
    circle({ center: from, radius, segments: 32 }),
    circle({ center: to, radius, segments: 32 }),
  )
}

function profile2d(profile: BeamChamberProfile) {
  return polygon({ points: [
    [profile.left, profile.bottom],
    [profile.right, profile.bottom],
    [profile.right, profile.topRight],
    [profile.left, profile.topLeft],
  ] })
}

export function createLeg(d: DerivedDimensions): JscadGeometry {
  const floorZ = d.frameWidth / 2
  const slopeStart: [number, number] = [0, floorZ]
  const slopeEnd: [number, number] = [d.baseProjection, d.height + floorZ]
  const gridRegion = polygon({ points: [
    [0, floorZ],
    [d.baseProjection, floorZ],
    [d.baseProjection, d.height + floorZ],
  ] })
  const verticalRibs = d.ribPositions.map((x) => intersect(
    gridRegion,
    rectangle({
      center: [x, floorZ + d.height / 2],
      size: [d.ribWidth, d.height],
    }),
  ))
  const horizontalRibs = d.gridRowPositions.map((z) => intersect(
    gridRegion,
    rectangle({
      center: [d.baseProjection / 2, z],
      size: [d.baseProjection, d.ribWidth],
    }),
  ))
  const frame2d = union(
    segment2d([-d.frontFootExtra, floorZ], [d.baseProjection + d.rearFootExtra, floorZ], d.frameWidth),
    segment2d(slopeStart, slopeEnd, d.frameWidth),
    segment2d([d.baseProjection, floorZ], slopeEnd, d.frameWidth),
    segment2d([0, floorZ], [0, floorZ + d.lipHeight], d.frameWidth),
    ...verticalRibs,
    ...horizontalRibs,
  )
  const openedFrame2d = subtract(
    frame2d,
    profile2d(d.chamberOpeningProfiles.find((profile) => profile.id === d.frontBeamChamber)!),
    profile2d(d.chamberOpeningProfiles.find((profile) => profile.id === d.rearBeamChamber)!),
  )

  const solid = translate(
    [0, d.legThickness / 2, 0],
    rotateX(Math.PI / 2, extrudeLinear({ height: d.legThickness }, openedFrame2d)),
  )

  return solid as JscadGeometry
}

export function retentionHoleYPositions(d: DerivedDimensions): number[] {
  const halfStandWidth = d.standWidth / 2
  const holeOffset = d.retentionHoleDiameter / 2 + d.fitClearance
  const innerHoleY = halfStandWidth - d.legThickness - holeOffset
  const outerHoleY = halfStandWidth + holeOffset

  return [-outerHoleY, -innerHoleY, innerHoleY, outerHoleY]
}

export function createBeam(d: DerivedDimensions, chamberId: string): JscadGeometry {
  const profile = d.beamChamberProfiles.find((candidate) => candidate.id === chamberId)!
  const beam = translate(
    [0, d.beamLength / 2, 0],
    rotateX(Math.PI / 2, extrudeLinear({ height: d.beamLength }, profile2d(profile))),
  )
  const hole = (y: number) => translate(
    [profile.centerX, y, profile.centerZ],
    cylinder({ height: profile.maxHeight + 2, radius: d.retentionHoleDiameter / 2, segments: 24 }),
  )
  const retentionHoles = retentionHoleYPositions(d).map(hole)
  return subtract(beam, ...retentionHoles) as JscadGeometry
}

export type AssemblyPart = {
  id: string
  color: string
  geometry: JscadGeometry
  printable?: boolean
}

export function createAssembly(d: DerivedDimensions): AssemblyPart[] {
  const leg = createLeg(d)
  const frontBeam = createBeam(d, d.frontBeamChamber)
  const rearBeam = createBeam(d, d.rearBeamChamber)
  const legOffset = (d.standWidth - d.legThickness) / 2
  return [
    { id: 'left-leg', color: '#d9ff57', geometry: translate([0, -legOffset, 0], leg) as JscadGeometry },
    { id: 'right-leg', color: '#d9ff57', geometry: translate([0, legOffset, 0], leg) as JscadGeometry },
    { id: 'front-beam', color: '#ff784f', geometry: frontBeam },
    { id: 'rear-beam', color: '#ff784f', geometry: rearBeam },
  ]
}
