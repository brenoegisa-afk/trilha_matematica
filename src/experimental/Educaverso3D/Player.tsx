import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

export default function Player({ position }: { position: THREE.Vector3 }) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      // 🚀 Smooth Lerp Movement (Movement logic)
      meshRef.current.position.lerp(position, 0.1);
      
      // 🔄 Idle rotation
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <group ref={meshRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        {/* 🤖 Mascot Body - Robotic Ball Style */}
        <mesh castShadow>
          <sphereGeometry args={[0.6, 32, 32]} />
          <meshStandardMaterial 
            color="#00d2ff" 
            roughness={0.05} 
            metalness={1} 
            emissive="#00d2ff" 
            emissiveIntensity={0.2}
          />
        </mesh>
        
        {/* 🦾 "Eyes" - Glowing Screen */}
        <mesh position={[0, 0.1, 0.45]}>
          <boxGeometry args={[0.5, 0.2, 0.1]} />
          <meshBasicMaterial color="#00ff00" />
        </mesh>

        {/* 🔆 Tech Aura / Glow Layer */}
        <mesh scale={1.4}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <MeshDistortMaterial
            speed={2}
            distort={0.3}
            color="#00d2ff"
            transparent
            opacity={0.1}
          />
        </mesh>

        {/* 🛸 Shadow Under Player */}
        <mesh position={[0, -0.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial color="black" transparent opacity={0.3} />
        </mesh>
      </Float>
    </group>
  );
}
