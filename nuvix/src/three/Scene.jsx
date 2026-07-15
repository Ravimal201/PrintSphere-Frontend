import { useRef, useState, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import ShirtModel from "./ShirtModel";

// Helper component to manage smooth turntable transitions and zoom changes
function ViewManager({ modelRotation, zoomLevel, groupRef }) {
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;

    // Smoothly spin the model to the target Y angle Y rotation
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      modelRotation,
      0.08
    );

    // 2. Smoothly adjust camera distance based on zoom level slider
    const baseDistance = 3.8;
    const targetDistance = baseDistance / zoomLevel;
    const currentDistance = camera.position.length();
    const newDistance = THREE.MathUtils.lerp(currentDistance, targetDistance, 0.08);
    camera.position.setLength(newDistance);
  });

  return null;
}

export default function Scene({
  modelPath,
  shirtColor,
  activeSide,
  zoomLevel,
  layers,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayers,
  onDeleteLayer,
  modelRotation = 0
}) {
  const groupRef = useRef();
  const [isInteracting, setIsInteracting] = useState(false);

  return (
    <Canvas
      camera={{
        position: [0, 0.1, 3.8],
        fov: 40
      }}
      shadows
      className="w-full h-full"
    >
      {/* Studio Lighting */}
      <ambientLight intensity={1.5} />
      
      {/* Front Key Light */}
      <directionalLight
        position={[4, 5, 5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* Back Rim Light */}
      <directionalLight
        position={[-4, 3, -5]}
        intensity={1.2}
      />

      {/* Environment preset to add subtle realistic reflections */}
      <Suspense fallback={null}>
         <Environment preset="city" />

        {/* Rotatable Group containing the T-shirt */}
        <group ref={groupRef}>
          <ShirtModel
            modelPath={modelPath}
            shirtColor={shirtColor}
            layers={layers}
            selectedLayerId={selectedLayerId}
            onSelectLayer={onSelectLayer}
            onUpdateLayers={onUpdateLayers}
            onDeleteLayer={onDeleteLayer}
            onInteractionStart={() => setIsInteracting(true)}
            onInteractionEnd={() => setIsInteracting(false)}
          />
        </group>
      </Suspense>

      {/* Smoothly controls camera zoom and turntable rotation */}
      <ViewManager
        modelRotation={modelRotation}
        zoomLevel={zoomLevel}
        groupRef={groupRef}
      />

      {/* Allow the user to manually rotate the shirt, but constrain angles for a premium experience */}
      <OrbitControls
        enabled={false}
        enablePan={false}
        enableZoom={false}
      />
    </Canvas>
  );
}