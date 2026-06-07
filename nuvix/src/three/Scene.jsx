import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";

import ShirtModel from "./ShirtModel";

export default function Scene() {
  return (
    <Canvas
      camera={{
        position: [0, 0, 4],
        fov: 45,
      }}
    >
      <ambientLight intensity={2} />

      <directionalLight
        position={[5, 5, 5]}
        intensity={3}
      />

      <Environment preset="city" />

      <ShirtModel />

      <OrbitControls />
    </Canvas>
  );
}