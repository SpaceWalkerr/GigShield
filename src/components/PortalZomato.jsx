import * as THREE from 'three'
import { Canvas, extend } from '@react-three/fiber'
import { MeshPortalMaterial, CameraControls, Text, Sky, Image as DreiImage } from '@react-three/drei'
import { geometry } from 'maath'
import { Suspense } from 'react'

extend(geometry)
const GOLDENRATIO = 1.61803398875

export default function PortalZomato() {
  return (
    <div className="w-full h-full relative rounded-[inherit] overflow-hidden bg-[#f0f0f0] animate-fade-in">
      <Canvas gl={{ localClippingEnabled: true }} camera={{ fov: 75, position: [0, 0, 1.5] }}>
        <color attach="background" args={['#f0f0f0']} />
        
        <Suspense fallback={null}>
          <Frame id="02" name="Delivery" author="Zomato">
            {/* Subtle sky background inside portal */}
            <Sky sunPosition={[100, 20, 100]} turbidity={1} rayleigh={0.5} />
            
            {/* Main Rider Image inside the portal. */}
            <DreiImage
              url="/rider.png"
              transparent
              scale={[1.6, 2.2]}
              position={[0, -0.1, -0.5]}
            />
          </Frame>
        </Suspense>

        <CameraControls 
          makeDefault 
          minAzimuthAngle={-Math.PI / 2.5} 
          maxAzimuthAngle={Math.PI / 2.5} 
          minPolarAngle={0.5} 
          maxPolarAngle={Math.PI / 2} 
        />
      </Canvas>
    </div>
  )
}

function Frame({ id, name, author, bg, width = 1.2, height = 1.2 * GOLDENRATIO, children, ...props }) {
  return (
    <group {...props}>
      <Text color="black" fontSize={0.3} letterSpacing={-0.025} anchorY="top" anchorX="left" lineHeight={0.8} position={[-0.45, 0.85, 0.01]}>
        {name}
      </Text>
      <Text color="black" fontSize={0.12} anchorX="right" position={[0.5, -0.8, 0.01]}>
        /{id}
      </Text>
      <Text color="black" fontSize={0.05} anchorX="left" position={[-0.1, -0.83, 0.01]}>
        {author}
      </Text>
      <mesh name={id}>
        <roundedPlaneGeometry args={[width, height, 0.1]} />
        <MeshPortalMaterial blend={0}>{children}</MeshPortalMaterial>
      </mesh>
      <mesh name={id} position={[0, 0, -0.001]}>
        <roundedPlaneGeometry args={[width + 0.05, height + 0.05, 0.12]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

