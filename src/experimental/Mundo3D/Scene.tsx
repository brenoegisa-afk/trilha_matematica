import { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { 
  OrbitControls, 
  Stars, 
  ContactShadows,
  Environment,
  Float,
  BakeShadows
} from '@react-three/drei';
import { EffectComposer, Bloom, Noise, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { Vector3, FogExp2 } from 'three';
import Island from './Island';
import Player from './Player';
import Celebration from './Celebration';

interface SceneProps {
  onTriggerChallenge: () => void;
  isCelebrating?: boolean;
}

export default function Scene({ onTriggerChallenge, isCelebrating = false }: SceneProps) {
  const [targetPosition, setTargetPosition] = useState(new Vector3(0, 0.5, 3));
  const [markerPosition, setMarkerPosition] = useState(new Vector3(0, -99, 0));

  const handleMove = (point: Vector3) => {
    setTargetPosition(new Vector3(point.x, 0.5, point.z));
    setMarkerPosition(new Vector3(point.x, 0.05, point.z));
  };

  return (
    <Canvas 
      shadows 
      camera={{ position: [20, 20, 20], fov: 40 }}
      gl={{ antialias: true, stencil: false, depth: true }}
      onCreated={(state) => {
        // Deep purple/blue fog for that "Magic Night" look
        state.scene.fog = new FogExp2('#05051a', 0.012);
      }}
    >
      <color attach="background" args={['#02020a']} />
      
      {/* 🌌 High Density Stars */}
      <Stars radius={150} depth={60} count={10000} factor={6} saturation={1} fade speed={2} />
      
      <Suspense fallback={null}>
        {/* 🌍 Cinematic Environment */}
        <Environment preset="forest" />
        
        {/* 🕯️ Global Ambience */}
        <ambientLight intensity={0.4} />
        
        {/* 🔦 RIM LIGHTING (The key to the Pixar look) */}
        <directionalLight 
          position={[-20, 15, -20]} 
          intensity={5} 
          color="#a29bfe" 
        />
        
        <pointLight position={[10, 20, 10]} intensity={4} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} />
        <pointLight position={[-15, 5, 15]} intensity={2} color="#4834d4" />

        {/* 🏞️ The World */}
        <Island onMoveRequested={handleMove} onTriggerChallenge={onTriggerChallenge} />
        
        {/* ✨ Effects */}
        <Celebration active={isCelebrating} position={[0, 4, 0]} />
        
        {/* 🖱️ Indicator */}
        <Float speed={4} rotationIntensity={1} floatIntensity={1}>
          <mesh position={markerPosition} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.45, 32]} />
            <meshBasicMaterial color="#00ff00" transparent opacity={0.6} glow />
          </mesh>
        </Float>

        <Player position={targetPosition} isHappy={isCelebrating} />

        {/* 🌑 High-Fidelity Shadows */}
        <ContactShadows 
          position={[0, -1.2, 0]} 
          resolution={1024} 
          scale={50} 
          blur={2.5} 
          opacity={0.7} 
          far={15} 
          color="#000000" 
        />
        
        {/* 🎬 Post-Processing (The "Magic" Sauce) */}
        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={0.5} 
            luminanceSmoothing={0.9} 
            height={300} 
            intensity={1.5} 
          />
          <Noise opacity={0.02} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
          <ChromaticAberration offset={[0.0005, 0.0005]} />
        </EffectComposer>

        <BakeShadows />
      </Suspense>
      
      <OrbitControls 
        makeDefault 
        enablePan={false} 
        maxPolarAngle={Math.PI / 2.1} 
        minDistance={10}
        maxDistance={45}
        dampingFactor={0.05}
      />
    </Canvas>
  );
}
