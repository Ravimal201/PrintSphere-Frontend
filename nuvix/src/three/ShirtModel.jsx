import { useGLTF } from "@react-three/drei";

export default function ShirtModel() {
  const { scene } = useGLTF("/images/models/t_shirt.glb");

  return (
    <primitive
      object={scene}
      scale={2}
      position={[0, -1, 0]}
    />
  );
}

useGLTF.preload("/images/models/t_shirt.glb");