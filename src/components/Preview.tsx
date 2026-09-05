import { ContactShadows, Grid, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import type { AssemblyPart } from '../geometry/model'
import { toThreeGeometry } from '../geometry/toThree'

function Part({ part }: { part: AssemblyPart }) {
  const geometry = useMemo(() => toThreeGeometry(part.geometry), [part.geometry])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color={part.color} roughness={0.62} metalness={0.04} />
    </mesh>
  )
}

export function Preview({
  parts,
  framing = 'instrument',
}: {
  parts: AssemblyPart[]
  framing?: 'instrument' | 'microphone' | 'clip'
}) {
  const microphone = framing === 'microphone'
  const clip = framing === 'clip'
  return (
    <Canvas
      key={framing}
      shadows
      camera={{
        position: microphone ? [420, 300, 430] : clip ? [155, 115, 165] : [340, 260, 420],
        fov: 38,
        near: 0.1,
        far: 3000,
      }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#20221c']} />
      <ambientLight intensity={1.25} />
      <directionalLight
        castShadow
        position={[180, 320, 180]}
        intensity={2.4}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <Suspense fallback={null}>
        <group position={microphone || clip ? [0, 0, 0] : [-95, 0, 0]}>
          {parts.map((part) => <Part key={part.id} part={part} />)}
        </group>
        <ContactShadows position={[0, -0.5, 0]} opacity={0.45} scale={800} blur={2.5} far={400} />
      </Suspense>
      <Grid
        position={[0, -0.8, 0]}
        args={[900, 900]}
        cellSize={10}
        cellThickness={0.45}
        cellColor="#4b4e42"
        sectionSize={50}
        sectionThickness={0.8}
        sectionColor="#65695a"
        fadeDistance={800}
        infiniteGrid
      />
      <OrbitControls
        makeDefault
        target={microphone ? [0, 170, 0] : clip ? [0, 16, 0] : [20, 45, 0]}
        minDistance={clip ? 90 : 160}
        maxDistance={clip ? 500 : 1100}
      />
    </Canvas>
  )
}
