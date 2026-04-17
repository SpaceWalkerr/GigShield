import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

function RobotBody() {
  const group = useRef();
  
  // Animation for slight head tilt/movement
  useFrame((state) => {
    const t = state.elapsedTime || state.clock.getElapsedTime();
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.5) * 0.1;
      group.current.position.y = Math.sin(t * 1.5) * 0.05;
    }
  });

  return (
    <group ref={group}>
      {/* Head - Main Shell */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} metalness={0.2} />
      </mesh>

      {/* Face/Screen Area */}
      <mesh position={[0, 0.4, 0.25]} rotation={[0, 0, 0]}>
        <sphereGeometry args={[0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color="#1a1c24" roughness={0.1} />
      </mesh>

      {/* Eyes */}
      <mesh position={[-0.18, 0.42, 0.45]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
      </mesh>
      <mesh position={[0.18, 0.42, 0.45]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2} />
      </mesh>

      {/* Head Headphones/Ears */}
      <mesh position={[-0.5, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 32]} />
        <meshStandardMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0.5, 0.4, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 0.1, 32]} />
        <meshStandardMaterial color="#22d3ee" />
      </mesh>

      {/* Antenna */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
        <meshStandardMaterial color="#22d3ee" />
      </mesh>
      <mesh position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} />
      </mesh>

      {/* Body Area */}
      <mesh position={[0, -0.2, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#ffffff" roughness={0.1} />
      </mesh>
      
      {/* Red Highlights (like the bike) */}
      <mesh position={[0, 0.1, 0]}>
        <torusGeometry args={[0.42, 0.02, 16, 100]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* Delivery Box (Optional small one) */}
      <mesh position={[0, -0.4, -0.5]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
    </group>
  );
}

export default function CookieByteBot() {
  return (
    <div className="h-full w-full">
      <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 2.5]} fov={45} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <RobotBody />
        </Float>
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          minPolarAngle={Math.PI / 2.5}
          maxPolarAngle={Math.PI / 1.5}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
      </Canvas>
    </div>
  );
}
