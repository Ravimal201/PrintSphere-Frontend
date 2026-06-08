import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

export default function ShirtModel({
  shirtColor,
}) {
  const { scene } = useGLTF("/images/models/t_shirt.glb");

  useEffect(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material.color.set(
          shirtColor
        );
      }
    });
  }, [scene, shirtColor]);

  return (
    <primitive
      object={scene}
      scale={1.8}
      position={[0.02, -1.0, -0.1]}
      rotation={[0.13, 0.5, -0.04]}
    />
  );
}

useGLTF.preload("/images/models/t_shirt.glb");