import { Float, MeshWobbleMaterial, MeshDistortMaterial, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

interface IslandProps {
  onMoveRequested?: (point: THREE.Vector3) => void;
  onTriggerChallenge?: () => void;
}

export default function Island({ onMoveRequested, onTriggerChallenge }: IslandProps) {
  const handleGroundClick = (e: any) => {
    e.stopPropagation();
    if (onMoveRequested) {
      onMoveRequested(e.point);
    }
  };

  const handleChallengeClick = (e: any) => {
    e.stopPropagation();
    if (onTriggerChallenge) {
      onTriggerChallenge();
    }
  };

  return (
    <group>
      {/* 🏞️ MAGICAL TERRAIN (Organic Floating Rock) */}
      <group position={[0, -2, 0]}>
        {/* Grass Top - Multi-layered & Textured look */}
        <mesh receiveShadow onPointerDown={handleGroundClick}>
          <cylinderGeometry args={[13.5, 12, 1, 64]} />
          <MeshDistortMaterial speed={0} distort={0.08} color="#15a34e" roughness={1} />
        </mesh>
        
        {/* Irregular Stone Base */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh 
            key={i} 
            position={[
              (Math.random() - 0.5) * 18, 
              -1.5 - Math.random() * 3, 
              (Math.random() - 0.5) * 18
            ]}
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, 0]}
          >
            <boxGeometry args={[4 + Math.random() * 4, 2 + Math.random() * 2, 4 + Math.random() * 4]} />
            <meshStandardMaterial color="#2d3436" roughness={1} metalness={0.1} />
          </mesh>
        ))}
      </group>

      {/* 🌊 GLOWING MAGICAL POND (New) */}
      <group position={[-3, -1.35, 5]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.5, 32]} />
          <meshStandardMaterial 
            color="#00d2ff" 
            emissive="#00d2ff" 
            emissiveIntensity={3} 
            transparent 
            opacity={0.6} 
            roughness={0}
          />
        </mesh>
        <Sparkles count={30} scale={4} size={3} speed={1.5} color="#00d2ff" />
      </group>

      {/* 🌌 NEBULA HAZE (Magic effect from mockup) */}
      <group position={[0, 5, 0]}>
        <Sparkles count={100} scale={30} size={2} speed={0.5} opacity={0.3} color="#a29bfe" />
        <mesh scale={40}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color="#4834d4" transparent opacity={0.02} side={THREE.BackSide} />
        </mesh>
      </group>

      {/* 🏛️ ANCIENT RUINS (Math Hub) */}
      <group position={[-7, -1.5, -7]} onPointerDown={handleChallengeClick}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[7, 0.8, 7]} />
          <meshStandardMaterial color="#2d3436" roughness={1} />
        </mesh>
        {/* Magic Core */}
        <mesh position={[0, 2.8, 0]}>
          <cylinderGeometry args={[1.5, 0.5, 4.5, 4]} />
          <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={6} transparent opacity={0.75} />
        </mesh>
        {/* Floating Stone Pillars */}
        {[[-3, 2, -3], [3, 2, -3], [-3, 2, 3], [3, 2, 3]].map((pos, i) => (
          <mesh key={i} position={pos as [number, number, number]} castShadow>
            <boxGeometry args={[0.8, 4, 0.8]} />
            <meshStandardMaterial color="#444" roughness={1} />
          </mesh>
        ))}
      </group>

      {/* 🏃‍♂️ STYLIZED PARKOUR (Glow-stones) */}
      <group position={[12, -0.5, -10]}>
        {[
          { pos: [0, 0, 0], color: "#00d2ff" },
          { pos: [3, 2, 2], color: "#a29bfe" },
          { pos: [6, 4, 0], color: "#f1c40f" },
          { pos: [9, 6, -2], color: "#00d2ff" },
          { pos: [12, 8, 0], color: "#a29bfe" },
        ].map((step, i) => (
          <Float key={i} speed={3}>
            <mesh position={step.pos as [number, number, number]} castShadow onPointerDown={handleGroundClick}>
              <boxGeometry args={[2.5, 0.8, 2.5]} />
              <meshStandardMaterial color="#2d3436" roughness={1} />
              <mesh position={[0, 0.45, 0]}>
                <boxGeometry args={[2.2, 0.1, 2.2]} />
                <meshStandardMaterial color={step.color} emissive={step.color} emissiveIntensity={10} />
              </mesh>
            </mesh>
          </Float>
        ))}
      </group>

      {/* 🌳 DISNEY-STYLE TREES (Dense & Emissive) */}
      {[
        { pos: [8, -1.5, -6], color: "#2ecc71", glow: "#2ecc71" },
        { pos: [-10, -1.5, 8], color: "#27ae60", glow: "#00ff00" },
        { pos: [11, -1.5, 7], color: "#219150", glow: "#2ecc71" },
        { pos: [-8, -1.5, -12], color: "#32ff7e", glow: "#32ff7e" }
      ].map((tree, i) => (
        <group key={i} position={tree.pos as [number, number, number]}>
          <mesh position={[0, 2, 0]}>
            <cylinderGeometry args={[0.2, 0.4, 4]} />
            <meshStandardMaterial color="#1a110a" />
          </mesh>
          <mesh position={[0, 4.5, 0]} castShadow>
            <sphereGeometry args={[2.2, 12, 12]} />
            <meshStandardMaterial color={tree.color} roughness={1} />
          </mesh>
          {/* Glowing Spirit/Fruit inside the tree */}
          <Sparkles count={10} scale={2} size={4} speed={1} color={tree.glow} />
        </group>
      ))}

      {/* 🧚 MAGICAL FIREFLIES (Everywhere) */}
      <Sparkles count={80} scale={30} size={5} speed={2} color="#f1c40f" opacity={0.6} />

      {/* 🚀 NEW: MATH RUNNER PORTAL (Gateway to 2D Game) */}
      <group position={[-11, 0, -3]} onPointerDown={() => window.location.href = '/experimental/runner'}>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[2.5, 2.8, 0.4, 32]} />
          <meshStandardMaterial color="#3498db" emissive="#3498db" emissiveIntensity={2} />
        </mesh>
        <Float speed={5} rotationIntensity={0.5}>
          <mesh position={[0, 1.5, 0]}>
            <torusKnotGeometry args={[0.8, 0.3, 100, 16]} />
            <meshStandardMaterial color="#f1c40f" emissive="#f1c40f" emissiveIntensity={3} />
          </mesh>
        </Float>
      </group>
      
      {/* 🏗️ INDUSTRIAL CRANE (High-End Metal) */}
      <group position={[10, -1.5, 10]}>
        <mesh position={[0, 4.5, 0]} castShadow>
          <boxGeometry args={[0.8, 9, 0.8]} />
          <meshStandardMaterial color="#111" metalness={1} roughness={0.1} />
        </mesh>
        <mesh position={[3, 9, 0]} castShadow>
          <boxGeometry args={[7.5, 0.8, 0.8]} />
          <meshStandardMaterial color="#111" metalness={1} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}
