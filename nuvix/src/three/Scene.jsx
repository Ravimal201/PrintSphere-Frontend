import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
} from "@react-three/drei";

import ShirtModel from "./ShirtModel";
import LogoPlane from "./LogoPlane";
import PrintableArea from "./PrintableArea";

export default function Scene({
  shirtColor,
  activeSide,
  frontDesign,
  backDesign,
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

      <Environment preset="city" />

      <ShirtModel
        shirtColor={shirtColor}
        activeSide={activeSide}
      />
      <PrintableArea side="front" />

      <PrintableArea side="back" />

      <LogoPlane
        design={frontDesign}
        side="front"
      />

      <LogoPlane
        design={backDesign}
        side="back"
      />

      <OrbitControls />
    </Canvas>
  );
}