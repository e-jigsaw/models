import { booleans, extrusions, primitives, transforms } from '@jscad/modeling'
import type { AssemblyPart } from '../geometry/types'

export type TesterParameters = { holeSize: number; height: number; wallThickness: number }
export const defaultTesterParameters: TesterParameters = { holeSize: 14.1, height: 12, wallThickness: 2 }
export const TESTER = { width: 62, depth: 24, pitch: 19.05, plateThickness: 1.5, radius: 3 }
export const testerCenters = [-TESTER.pitch, 0, TESTER.pitch]

export function validateTester(p: TesterParameters): Array<{ level: 'error'; message: string }> {
  const errors: Array<{ level: 'error'; message: string }> = []
  for (const [key, min, max, label] of [
    ['holeSize', 13.8, 14.5, '穴幅'], ['height', 10, 20, '全高'], ['wallThickness', 1.5, 3, '側壁厚'],
  ] as const) {
    if (!Number.isFinite(p[key]) || p[key] < min || p[key] > max) errors.push({ level: 'error', message: `${label}は${min}〜${max}mmに設定` })
  }
  return errors
}

// MX reference drawing: 14 mm square cutout, 1.5 mm mounting plate.
// https://www.smcelectronics.com/DOWNLOADS/CHERRYMX.PDF
export function createTester(p: TesterParameters) {
  if (validateTester(p).length) throw new Error('Invalid switch tester dimensions')
  const { subtract } = booleans
  const { extrudeLinear } = extrusions
  const { roundedRectangle, rectangle } = primitives
  const { translate } = transforms
  const outer = roundedRectangle({ size: [TESTER.width, TESTER.depth], roundRadius: TESTER.radius, segments: 32 })
  const inner = roundedRectangle({ size: [TESTER.width - 2 * p.wallThickness, TESTER.depth - 2 * p.wallThickness], roundRadius: 0.8, segments: 32 })
  const shell = subtract(
    extrudeLinear({ height: p.height }, outer),
    translate([0, 0, -0.1], extrudeLinear({ height: p.height - TESTER.plateThickness + 0.1 }, inner)),
  )
  return subtract(shell, ...testerCenters.map((x) => translate([x, 0, -0.1],
    extrudeLinear({ height: p.height + 0.2 }, rectangle({ size: [p.holeSize, p.holeSize] })),
  )))
}

export function createTesterPrint(p: TesterParameters) {
  return transforms.translate([0, 0, p.height], transforms.rotateX(Math.PI, createTester(p)))
}

export function createTesterAssembly(p: TesterParameters, print = false): AssemblyPart[] {
  return [{ id: 'three-key-switch-tester', color: '#b8c59a', geometry: print ? createTesterPrint(p) : createTester(p) }]
}
