import { useRef, Suspense } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import ShirtModel from "./ShirtModel";

// Helper component to manage smooth turntable transitions and zoom changes
function ViewManager({ activeSide, zoomLevel, groupRef }) {
  const { camera } = useThree();

  useFrame(() => {
    if (!groupRef.current) return;

    // 1. Calculate target turntable rotation based on active view side
    let targetY = 0;
    if (activeSide === "back") targetY = Math.PI;
    if (activeSide === "left") targetY = Math.PI / 2;
    if (activeSide === "right") targetY = -Math.PI / 2;

    // Smoothly spin the model to the target Y angle
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      targetY,
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
  onDeleteLayer
}) {
  const groupRef = useRef();

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
          />
        </group>
      </Suspense>

      {/* Smoothly controls camera zoom and turntable rotation */}
      <ViewManager
        activeSide={activeSide}
        zoomLevel={zoomLevel}
        groupRef={groupRef}
      />

      {/* Allow the user to manually rotate the shirt, but constrain angles for a premium experience */}
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 2.5}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  );
}