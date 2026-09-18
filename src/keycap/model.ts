import { booleans, extrusions, hulls, measurements, primitives, transforms } from '@jscad/modeling'
import type { AssemblyPart, JscadGeometry } from '../geometry/types'
import { cherryRowProfiles, type KeycapParameters } from './parameters'

const { intersect, subtract, union } = booleans
const { extrudeLinear } = extrusions
const { hull } = hulls
const { measureBoundingBox } = measurements
const { circle, cuboid, cylinder, rectangle, roundedRectangle } = primitives
const { rotateX, rotateY, rotateZ, translate } = transforms

export const CHERRY_BOTTOM_SIZE = [18.16, 18.16] as const
export const CHERRY_TOP_SIZE = [11.85, 14.64] as const
export const CHERRY_TOP_SKEW = 2
export const CHERRY_DISH_DEPTH = 0.65
export const MX_STEM_OUTER_DIAMETER = 6.2
// Dimensional reference: riskable/keycap_playground, stems.scad (box_cherry).
// Independently constructed JSCAD geometry; round keeps the previous fit convention.
export const MX_BOX_CROSS_BASE = { horizontal: [4, 1.3], vertical: [1.1, 4] } as const
export const STEM_SUPPORT_ANGLES = [0, 180, 270] as const
export const STEM_SUPPORT_REACH = 4.25
export const MX_CROSS_BASE = {
  horizontal: [4.03, 1.25] as const,
  vertical: [1.15, 4.23] as const,
}

function thinRoundedPlate(width: number, depth: number, z: number, radius: number): JscadGeometry {
  const shape = roundedRectangle({ size: [width, depth], roundRadius: radius, segments: 24 })
  return translate([0, 0, z], extrudeLinear({ height: 0.12 }, shape)) as JscadGeometry
}

function placeAtKeyTop(geometry: JscadGeometry, parameters: KeycapParameters): JscadGeometry {
  const profile = cherryRowProfiles[parameters.row]
  return translate(
    [0, CHERRY_TOP_SKEW, profile.height],
    rotateX(-profile.tilt * Math.PI / 180, geometry),
  ) as JscadGeometry
}

function createOuterLoft(parameters: KeycapParameters): JscadGeometry {
  const bottom = thinRoundedPlate(CHERRY_BOTTOM_SIZE[0], CHERRY_BOTTOM_SIZE[1], 0, 1.15)
  const top = placeAtKeyTop(thinRoundedPlate(CHERRY_TOP_SIZE[0], CHERRY_TOP_SIZE[1], 0, 1.4), parameters)
  return hull(bottom, top) as JscadGeometry
}

function createDishCutter(parameters: KeycapParameters): JscadGeometry {
  const chord = CHERRY_TOP_SIZE[1] + 1
  const radius = chord ** 2 / (8 * CHERRY_DISH_DEPTH) + CHERRY_DISH_DEPTH / 2
  const cutter = rotateY(
    Math.PI / 2,
    cylinder({ radius, height: CHERRY_TOP_SIZE[0] + 4, segments: 64 }),
  ) as JscadGeometry
  return placeAtKeyTop(translate([0, 0, radius - CHERRY_DISH_DEPTH], cutter) as JscadGeometry, parameters)
}

function createInnerCavity(parameters: KeycapParameters): JscadGeometry {
  const wall = parameters.wallThickness
  const bottom = thinRoundedPlate(
    CHERRY_BOTTOM_SIZE[0] - wall * 2,
    CHERRY_BOTTOM_SIZE[1] - wall * 2,
    -0.55,
    Math.max(0.5, 1.15 - wall * 0.35),
  )
  const innerTop = thinRoundedPlate(
    CHERRY_TOP_SIZE[0] - wall * 2,
    CHERRY_TOP_SIZE[1] - wall * 2,
    -parameters.topThickness,
    Math.max(0.5, 1.4 - wall * 0.35),
  )
  return hull(bottom, placeAtKeyTop(innerTop, parameters)) as JscadGeometry
}

export function mxCrossCutoutDimensions(parameters: KeycapParameters) {
  const clearance = parameters.stemFitClearance
  if (parameters.stemShape === 'box') return {
    horizontal: [MX_BOX_CROSS_BASE.horizontal[0] + clearance, MX_BOX_CROSS_BASE.horizontal[1] + clearance] as const,
    vertical: [MX_BOX_CROSS_BASE.vertical[0] + clearance * 2, MX_BOX_CROSS_BASE.vertical[1] + clearance / 4] as const,
  }
  return {
    horizontal: [MX_CROSS_BASE.horizontal[0] + clearance, MX_CROSS_BASE.horizontal[1] + clearance / 3] as const,
    vertical: [MX_CROSS_BASE.vertical[0] + clearance / 3, MX_CROSS_BASE.vertical[1] + clearance / 3] as const,
  }
}

export function mxStemMinimumWall(parameters: KeycapParameters) {
  const cross = mxCrossCutoutDimensions(parameters)
  const longestArm = Math.max(cross.horizontal[0], cross.vertical[1])
  return (parameters.stemOuterDiameter - longestArm) / 2
}

function createStemOuterProfile(parameters: KeycapParameters) {
  return parameters.stemShape === 'box'
    ? roundedRectangle({ size: [parameters.stemOuterDiameter, parameters.stemOuterDiameter], roundRadius: 0.5, segments: 24 })
    : circle({ radius: parameters.stemOuterDiameter / 2, segments: 48 })
}

function createStemProfile(parameters: KeycapParameters) {
  const cross = mxCrossCutoutDimensions(parameters)
  const horizontal = rectangle({ size: [...cross.horizontal] })
  const vertical = rectangle({ size: [...cross.vertical] })
  const outer = createStemOuterProfile(parameters)
  return subtract(outer, union(horizontal, vertical))
}

export function createMxStem(parameters: KeycapParameters): JscadGeometry {
  const profile = cherryRowProfiles[parameters.row]
  const stemTop = profile.height - parameters.topThickness + 0.3
  const socket = extrudeLinear({ height: parameters.stemDepth }, createStemProfile(parameters))
  const root = translate([0, 0, parameters.stemDepth],
    extrudeLinear({ height: stemTop - parameters.stemDepth }, createStemOuterProfile(parameters)))
  return union(socket, root) as JscadGeometry
}

export function createStemSupports(parameters: KeycapParameters): JscadGeometry {
  const profile = cherryRowProfiles[parameters.row]
  const stemTop = profile.height - parameters.topThickness + 0.3
  const ribHeight = Math.min(1.8, stemTop - parameters.stemDepth)
  const ribStartZ = stemTop - ribHeight
  const stemRadius = parameters.stemOuterDiameter / 2
  const innerPost = cuboid({
    size: [0.55, 0.8, ribHeight],
    center: [stemRadius + 0.15, 0, (stemTop + ribStartZ) / 2],
  }) as JscadGeometry
  const outerPost = cuboid({
    size: [0.55, 0.8, 0.8],
    center: [STEM_SUPPORT_REACH, 0, stemTop - 0.4],
  }) as JscadGeometry
  const rib = hull(innerPost, outerPost) as JscadGeometry
  return union(...STEM_SUPPORT_ANGLES.map((degrees) => rotateZ(degrees * Math.PI / 180, rib))) as JscadGeometry
}

function stampCylinder(x: number, y: number, radius: number, parameters: KeycapParameters): JscadGeometry {
  return placeAtKeyTop(
    cylinder({
      radius,
      height: parameters.inlayDepth + 4.2,
      center: [x, y, 1.45 - parameters.inlayDepth / 2],
      segments: 36,
    }) as JscadGeometry,
    parameters,
  )
}

function createAccentStamp(parameters: KeycapParameters): JscadGeometry {
  const cornerRadius = 0.65
  const halfSpan = 2.55 - cornerRadius
  return hull(
    stampCylinder(0, -halfSpan, cornerRadius, parameters),
    stampCylinder(halfSpan, 0, cornerRadius, parameters),
    stampCylinder(0, halfSpan, cornerRadius, parameters),
    stampCylinder(-halfSpan, 0, cornerRadius, parameters),
  ) as JscadGeometry
}

export function createKeycapSolid(parameters: KeycapParameters): JscadGeometry {
  const dishedOuter = subtract(createOuterLoft(parameters), createDishCutter(parameters)) as JscadGeometry
  const shell = subtract(dishedOuter, createInnerCavity(parameters)) as JscadGeometry
  const supports = intersect(dishedOuter, createStemSupports(parameters)) as JscadGeometry
  return union(shell, createMxStem(parameters), supports) as JscadGeometry
}

function createKeycapShellWithSupports(parameters: KeycapParameters): JscadGeometry {
  const dishedOuter = subtract(createOuterLoft(parameters), createDishCutter(parameters)) as JscadGeometry
  const shell = subtract(dishedOuter, createInnerCavity(parameters)) as JscadGeometry
  const supports = intersect(dishedOuter, createStemSupports(parameters)) as JscadGeometry
  return union(shell, supports) as JscadGeometry
}

export function createKeycapAssembly(parameters: KeycapParameters): AssemblyPart[] {
  const complete = createKeycapSolid(parameters)
  const accent = intersect(complete, createAccentStamp(parameters)) as JscadGeometry
  const body = subtract(complete, accent) as JscadGeometry

  return [
    { id: 'keycap-body', color: '#f1eadc', geometry: body },
    { id: 'top-accent', color: '#4f7cff', geometry: accent, previewLift: 0.02 },
  ]
}

export function createKeycap3mfAssembly(parameters: KeycapParameters): AssemblyPart[] {
  const shellWithSupports = createKeycapShellWithSupports(parameters)
  const accent = intersect(shellWithSupports, createAccentStamp(parameters)) as JscadGeometry
  const body = subtract(shellWithSupports, accent) as JscadGeometry
  const stem = createMxStem(parameters)

  return [
    { id: 'keycap-body', color: '#f1eadc', geometry: body },
    { id: 'mx-stem', color: '#f1eadc', geometry: stem },
    { id: 'top-accent', color: '#4f7cff', geometry: accent, previewLift: 0.02 },
  ]
}

export function createKeycapUndersidePreview(parameters: KeycapParameters): AssemblyPart[] {
  const stemAndSupports = intersect(
    createKeycapSolid(parameters),
    union(createMxStem(parameters), createStemSupports(parameters)),
  ) as JscadGeometry
  return [
    ...createKeycapAssembly(parameters),
    {
      id: 'mx-stem-reference',
      color: '#d9ff57',
      geometry: stemAndSupports,
      printable: false,
      previewLift: -0.025,
    },
  ]
}

export function keycapBounds(parameters: KeycapParameters) {
  const [minimum, maximum] = measureBoundingBox(createKeycapSolid(parameters))
  return {
    width: maximum[0] - minimum[0],
    depth: maximum[1] - minimum[1],
    height: maximum[2] - minimum[2],
  }
}
