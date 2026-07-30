import { geometries } from '@jscad/modeling'
import { BufferGeometry, Float32BufferAttribute } from 'three'
import type { JscadGeometry } from './model'

export function toThreeGeometry(source: JscadGeometry): BufferGeometry {
  const positions: number[] = []
  const polygons = geometries.geom3.toPolygons(source)

  for (const polygon of polygons) {
    const vertices = polygon.vertices
    for (let index = 1; index < vertices.length - 1; index += 1) {
      for (const vertex of [vertices[0], vertices[index], vertices[index + 1]]) {
        positions.push(vertex[0], vertex[2], -vertex[1])
      }
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}
