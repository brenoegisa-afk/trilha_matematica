import { Float, MeshWobbleMaterial, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface IslandProps {
  onMoveRequested?: (point: THREE.Vector3) => void;
}

export default function Island({ onMoveRequested }: IslandProps) {
  const handleGroundClick = (e: any) => {
    e.stopPropagation();
    if (onMoveRequested) {
      onMoveRequested(e.point);
    }
  };

  return (
    <group>
      {/* 🏝️ Main Island Platform - CLICKABLE AREA */}
      <mesh 
        receiveShadow 
        position={[0, -1, 0]} 
        onPointerDown={handleGroundClick}
      >
        <cylinderGeometry args={[14, 12, 1.5, 64]} />
        <meshStandardMaterial color="#1ed760" roughness={0.7} />
      </mesh>
      
      {/* 🟤 Earthy Base */}
      <mesh receiveShadow position={[0, -2.5, 0]}>
        <cylinderGeometry args={[12, 8, 2, 32]} />
        <meshStandardMaterial color="#4a3728" roughness={1} />
      </mesh>

      {/* 🛰️ Orbital Satellites / Floating Platforms */}
      {[
        { pos: [15, 2, -10], size: [4, 0.5, 4], color: "#3498db" },
        { pos: [-15, 4, 15], size: [3, 0.4, 3], color: "#9b59b6" },
        { pos: [10, 6, 12], size: [5, 0.5, 5], color: "#e67e22" },
      ].map((plate, i) => (
        <group key={i} position={plate.pos as [number, number, number]}>
          <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
            <mesh castShadow onPointerDown={handleGroundClick}>
              <boxGeometry args={plate.size as [number, number, number]} />
              <meshStandardMaterial color={plate.color} metalness={0.5} roughness={0.2} />
            </mesh>
            <mesh position={[0, -5, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 10]} />
              <meshBasicMaterial color={plate.color} transparent opacity={0.2} />
            </mesh>
          </Float>
        </group>
      ))}

      {/* 🏛️ The "Math Hub" */}
      <group position={[-5, 0, -5]} onPointerDown={(e) => e.stopPropagation()}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[6, 1, 6]} />
          <meshStandardMaterial color="#2d3436" />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <boxGeometry args={[5.5, 3, 5.5]} />
          <meshStandardMaterial color="#81ecec" transparent opacity={0.2} roughness={0} metalness={1} />
        </mesh>
        <mesh position={[0, 4.5, 0]} castShadow>
          <boxGeometry args={[6.5, 1, 6.5]} />
          <meshStandardMaterial color="#dfe6e9" />
        </mesh>
        <mesh position={[0, 2.5, 0]}>
          <cylinderGeometry args={[1, 1, 3]} />
          <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* 🏗️ Construction Crane */}
      <group position={[8, 0, 8]}>
        <mesh position={[0, 3, 0]} castShadow>
          <boxGeometry args={[0.5, 6, 0.5]} />
          <meshStandardMaterial color="#f1c40f" />
        </mesh>
        <mesh position={[2, 6, 0]} castShadow>
          <boxGeometry args={[5, 0.5, 0.5]} />
          <meshStandardMaterial color="#f1c40f" />
        </mesh>
        <Float speed={4}>
          <mesh position={[4, 4, 0]} castShadow>
            <octahedronGeometry args={[0.8]} />
            <meshStandardMaterial color="#e74c3c" emissive="#e74c3c" emissiveIntensity={0.5} />
          </mesh>
        </Float>
      </group>

      {/* 🌀 Energy Portal */}
      <group position={[0, 1.5, -12]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[2, 0.2, 16, 100]} />
          <MeshWobbleMaterial factor={0.5} speed={2} color="#a29bfe" emissive="#a29bfe" emissiveIntensity={2} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <circleGeometry args={[1.8, 32]} />
          <MeshDistortMaterial speed={3} distort={0.4} color="#6c5ce7" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* 🌳 Trees */}
      {[
        [10, 0, -5], [-10, 0, 5], [12, 0, 3], [-8, 0, -8], [0, 0, 10]
      ].map((pos, i) => (
        <group key={i} position={pos as [number, number, number]}>
          <mesh position={[0, 1, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 2]} />
            <meshStandardMaterial color="#795548" />
          </mesh>
          <mesh position={[0, 2.5, 0]} castShadow>
            <dodecahedronGeometry args={[1.2]} />
            <meshStandardMaterial color="#2ecc71" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
