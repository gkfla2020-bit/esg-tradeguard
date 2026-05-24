import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'

function Terrain() {
  const texture = useTexture('/satellite/orig_2021.png')
  const meshRef = useRef<THREE.Mesh>(null)
  const geoRef = useRef<THREE.PlaneGeometry>(null)

  // Generate realistic displacement from noise
  useMemo(() => {
    if (!geoRef.current) return
    const pos = geoRef.current.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getY(i)
      // Multi-octave noise for natural terrain
      const n1 = Math.sin(x * 0.8) * Math.cos(z * 0.6) * 0.4
      const n2 = Math.sin(x * 2.1 + 1) * Math.cos(z * 1.7 + 2) * 0.15
      const n3 = Math.sin(x * 4.3 + 3) * Math.cos(z * 3.9 + 1) * 0.05
      pos.setZ(i, n1 + n2 + n3)
    }
    pos.needsUpdate = true
    geoRef.current.computeVertexNormals()
  }, [])

  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 16

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry ref={geoRef} args={[20, 20, 200, 200]} />
      <meshStandardMaterial
        map={texture}
        roughness={0.85}
        metalness={0.0}
        envMapIntensity={0.3}
      />
    </mesh>
  )
}

function ScanBeam() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = clock.getElapsedTime()
    ref.current.position.z = Math.sin(t * 0.25) * 7
    ref.current.position.x = Math.cos(t * 0.18) * 3
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = 0.12 + Math.sin(t * 3) * 0.04
  })
  return (
    <mesh ref={ref} position={[0, 1.5, 0]}>
      <boxGeometry args={[12, 0.02, 0.04]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.15} />
    </mesh>
  )
}

function CameraRig() {
  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime()
    const speed = 0.06
    const r = 6 + Math.sin(t * 0.05) * 2
    camera.position.x = Math.sin(t * speed) * r
    camera.position.z = Math.cos(t * speed) * r
    camera.position.y = 2.8 + Math.sin(t * 0.1) * 0.6
    // Look at a point slightly ahead in orbit direction
    const lx = Math.sin(t * speed + 0.5) * 2
    const lz = Math.cos(t * speed + 0.5) * 2
    camera.lookAt(lx, -0.3, lz)
  })
  return null
}

function Atmosphere() {
  const ref = useRef<THREE.Points>(null)
  const [positions, sizes] = useMemo(() => {
    const count = 100
    const pos = new Float32Array(count * 3)
    const sz = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = Math.random() * 3 + 0.5
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20
      sz[i] = Math.random() * 0.02 + 0.005
    }
    return [pos, sz]
  }, [])

  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.rotation.y = clock.getElapsedTime() * 0.01
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#ffffff" transparent opacity={0.25} sizeAttenuation />
    </points>
  )
}

export default function TerrainView() {
  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 3, 6], fov: 45, near: 0.1, far: 50 }}
        gl={{ antialias: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.9
        }}
        style={{ background: 'linear-gradient(180deg, #0c0c0c 0%, #1a1a2e 100%)' }}
      >
        <fog attach="fog" args={['#0c0c0c', 5, 14]} />
        <ambientLight intensity={0.2} />
        <directionalLight position={[4, 6, 2]} intensity={2} color="#ffeedd" castShadow shadow-mapSize={1024} />
        <directionalLight position={[-5, 3, -4]} intensity={0.4} color="#aaccff" />
        <Suspense fallback={null}>
          <Terrain />
        </Suspense>
        <ScanBeam />
        <Atmosphere />
        <CameraRig />
      </Canvas>
    </div>
  )
}
