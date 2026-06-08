import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
} from "@react-three/drei";

import ShirtModel from "./ShirtModel";
import LogoPlane from "./LogoPlane";

export default function Scene({
  shirtColor,
  logoTexture,
  logoScale,
  logoX,
  logoY,
  logoRotation,
}) {
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

      <gridHelper args={[10, 10]} />
      <axesHelper args={[5]} />

      <Environment preset="city" />

      <ShirtModel
        shirtColor={shirtColor}
      />

      <LogoPlane
        logoTexture={logoTexture}
        logoScale={logoScale}
        logoX={logoX}
        logoY={logoY}
        logoRotation={logoRotation}
      />

      <OrbitControls />
    </Canvas>
  );
}