import { geometries } from '@jscad/modeling'
import { BufferGeometry, Float32BufferAttribute, ShapeUtils, Vector2 } from 'three'
import type { JscadGeometry } from './types'

type Vertex = [number, number, number]

function polygonNormal(vertices: Vertex[]): Vertex {
  let x = 0
  let y = 0
  let z = 0
  for (let index = 0; index < vertices.length; index += 1) {
    const current = vertices[index]
    const next = vertices[(index + 1) % vertices.length]
    x += (current[1] - next[1]) * (current[2] + next[2])
    y += (current[2] - next[2]) * (current[0] + next[0])
    z += (current[0] - next[0]) * (current[1] + next[1])
  }
  return [x, y, z]
}

function triangulate(vertices: Vertex[]): Array<[number, number, number]> {
  const normal = polygonNormal(vertices)
  const dropAxis = Math.abs(normal[0]) > Math.abs(normal[1])
    ? (Math.abs(normal[0]) > Math.abs(normal[2]) ? 0 : 2)
    : (Math.abs(normal[1]) > Math.abs(normal[2]) ? 1 : 2)
  const projected = vertices.map((vertex) => {
    if (dropAxis === 0) return new Vector2(vertex[1], vertex[2])
    if (dropAxis === 1) return new Vector2(vertex[0], vertex[2])
    return new Vector2(vertex[0], vertex[1])
  })
  const triangles = ShapeUtils.triangulateShape(projected, []) as Array<[number, number, number]>
  return triangles.map(([a, b, c]) => {
    const va = vertices[a]
    const vb = vertices[b]
    const vc = vertices[c]
    const ab: Vertex = [vb[0] - va[0], vb[1] - va[1], vb[2] - va[2]]
    const ac: Vertex = [vc[0] - va[0], vc[1] - va[1], vc[2] - va[2]]
    const triangleNormal: Vertex = [
      ab[1] * ac[2] - ab[2] * ac[1],
      ab[2] * ac[0] - ab[0] * ac[2],
      ab[0] * ac[1] - ab[1] * ac[0],
    ]
    const aligned = triangleNormal[0] * normal[0] + triangleNormal[1] * normal[1] + triangleNormal[2] * normal[2]
    return aligned >= 0 ? [a, b, c] : [a, c, b]
  })
}

export function toThreeGeometry(source: JscadGeometry): BufferGeometry {
  const positions: number[] = []
  const polygons = geometries.geom3.toPolygons(source)

  for (const polygon of polygons) {
    const vertices = polygon.vertices as Vertex[]
    for (const triangle of triangulate(vertices)) {
      for (const vertex of triangle.map((index) => vertices[index])) {
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
