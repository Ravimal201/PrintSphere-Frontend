import { useMemo } from "react";
import * as THREE from "three";

export default function LogoPlane({
  logoTexture,
  logoScale,
  logoX,
  logoY,
  logoRotation,
}) {

  const texture = useMemo(() => {
    if (!logoTexture) return null;

    return new THREE.TextureLoader().load(
      logoTexture
    );
  }, [logoTexture]);

  if (!texture) return null;

  return (
    <mesh
      position={[
        logoX,
        logoY,
        0.2,
      ]}
      rotation={[
        0,
        0,
        THREE.MathUtils.degToRad(
          logoRotation
        ),
      ]}
    >
      <planeGeometry
        args={[
          logoScale,
          logoScale,
        ]}
      />

      <meshBasicMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}