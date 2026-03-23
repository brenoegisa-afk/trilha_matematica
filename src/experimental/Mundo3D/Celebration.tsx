import { Sparkles, Float } from '@react-three/drei';

interface CelebrationProps {
  active: boolean;
  position: [number, number, number];
}

export default function Celebration({ active, position }: CelebrationProps) {
  if (!active) return null;

  return (
    <group position={position}>
      {/* 🚀 Center Blast */}
      <Sparkles
        count={200}
        scale={10}
        size={5}
        speed={1.5}
        opacity={1}
        color="#00ff00"
      />
      
      {/* ✨ Floating magic dust */}
      <Float speed={5} rotationIntensity={2} floatIntensity={2}>
        <Sparkles
          count={50}
          scale={5}
          size={2}
          speed={0.5}
          opacity={0.5}
          color="#a29bfe"
        />
      </Float>

      {/* 🔮 Center Glow */}
      <mesh>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
