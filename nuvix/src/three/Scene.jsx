import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

function Shirt() {
  return (
    <mesh>
      <boxGeometry args={[2, 3, 0.5]} />
      <meshStandardMaterial color="white" />
    </mesh>
  );
}

export default function Scene() {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={2} />
      <directionalLight position={[5, 5, 5]} />

      <Shirt />

      <OrbitControls />
    </Canvas>
  );
}