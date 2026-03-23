import { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Stars, 
  ContactShadows,
} from '@react-three/drei';
import { Vector3 } from 'three';
import Island from './Island';
import Player from './Player';

export default function Scene() {
  // Initial position for the player
  const [targetPosition, setTargetPosition] = useState(new Vector3(0, 0.5, 3));
  // Visual marker for where the user clicked
  const [markerPosition, setMarkerPosition] = useState(new Vector3(0, -99, 0));

  const handleMove = (point: Vector3) => {
    // 1. Move the actual player target
    // We adjust Y slightly to keep the player floating above the terrain
    const newTarget = new Vector3(point.x, 0.5, point.z);
    setTargetPosition(newTarget);
    
    // 2. Move the visual marker to the exact click point
    setMarkerPosition(new Vector3(point.x, 0.05, point.z));
  };

  return (
    <Canvas 
      shadows 
      camera={{ position: [20, 20, 20], fov: 50 }}
    >
      {/* 🌌 Cosmic Atmosphere */}
      <color attach="background" args={['#0a0a1a']} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* 💡 Dramatic Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[5, 10, 5]} intensity={2.5} color="#3498db" />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* 🏞️ World - Now handles its own clicks */}
      <Island onMoveRequested={handleMove} />
      
      {/* 📍 Click Marker (Visual Feedback) */}
      <mesh position={markerPosition} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
      </mesh>

      {/* 🤖 Interactive Player */}
      <Player position={targetPosition} />

      <ContactShadows resolution={1024} scale={30} blur={2} opacity={0.4} far={15} color="#000000" />
      
      {/* 🎥 Camera Controls */}
      <OrbitControls 
        makeDefault 
        enablePan={false} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={5}
        maxDistance={40}
      />
    </Canvas>
  );
}
