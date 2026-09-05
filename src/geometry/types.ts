import { primitives } from '@jscad/modeling'

export type JscadGeometry = ReturnType<typeof primitives.cuboid>

export type AssemblyPart = {
  id: string
  color: string
  geometry: JscadGeometry
  printable?: boolean
}
