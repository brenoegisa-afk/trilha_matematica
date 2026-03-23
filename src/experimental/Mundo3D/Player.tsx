import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface PlayerProps {
  position: THREE.Vector3;
  isHappy?: boolean;
}

export default function Player({ position, isHappy = false }: PlayerProps) {
  const meshRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      // 🚀 Smooth Lerp Movement
      meshRef.current.position.lerp(position, 0.1);
      
      // 🔄 Faster rotation if happy
      const rotationSpeed = isHappy ? 3 : 0.6;
      meshRef.current.rotation.y += delta * rotationSpeed;
    }
    
    // 💓 Pulse emissive intensity for magical effect
    if (glowRef.current) {
      const material = glowRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 2 + Math.sin(state.clock.elapsedTime * 4) * 1.5;
    }
  });

  return (
    <group ref={meshRef}>
      <Float 
        speed={isHappy ? 10 : 3} 
        rotationIntensity={isHappy ? 3 : 0.5} 
        floatIntensity={isHappy ? 3 : 0.8}
      >
        {/* 🤖 MAIN CHASSIS (Deep Metallic) */}
        <mesh castShadow>
          <sphereGeometry args={[0.6, 64, 64]} />
          <meshStandardMaterial 
            color={isHappy ? "#f1c40f" : "#01a3d4"} 
            roughness={0} 
            metalness={1} 
          />
        </mesh>
        
        {/* 🥽 CINEMATIC GLASS HELMET */}
        <mesh scale={1.12}>
          <sphereGeometry args={[0.6, 64, 64, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
          <meshPhysicalMaterial 
            color="#ffffff" 
            transmission={0.9}
            thickness={2}
            roughness={0}
            metalness={0.1}
            ior={1.5}
            transparent 
            opacity={0.4} 
          />
        </mesh>

        {/* 💓 GLOWING CORE (Bloom ready) */}
        <mesh ref={glowRef} position={[0, 0.1, 0.52]}>
          <boxGeometry args={[0.6, 0.25, 0.05]} />
          <meshStandardMaterial 
            color={isHappy ? "#00ff00" : "#ffffff"} 
            emissive={isHappy ? "#00ff00" : "#ffffff"} 
            emissiveIntensity={4} 
          />
        </mesh>

        {/* 🫧 MAGICAL AURA */}
        <mesh scale={1.6}>
          <sphereGeometry args={[0.6, 16, 16]} />
          <MeshDistortMaterial
            speed={isHappy ? 8 : 1.5}
            distort={isHappy ? 0.8 : 0.25}
            color={isHappy ? "#f1c40f" : "#a29bfe"}
            transparent
            opacity={0.2}
          />
        </mesh>

        {/* 🚀 ENGINE GLOW PARTICLES */}
        <group position={[0, -0.7, 0]}>
          <Sparkles 
            count={isHappy ? 50 : 20} 
            scale={1.2} 
            size={isHappy ? 6 : 3} 
            speed={3} 
            color={isHappy ? "#ffd700" : "#00d2ff"} 
          />
        </group>
      </Float>
    </group>
  );
}
