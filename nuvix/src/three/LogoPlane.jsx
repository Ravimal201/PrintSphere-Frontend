import { useMemo } from "react";
import * as THREE from "three";

export default function LogoPlane({
  design,
  side,
}) {
  const texture = useMemo(() => {
    if (!design.texture)
      return null;

    return new THREE.TextureLoader().load(
      design.texture
    );
  }, [design.texture]);

  if (!texture) return null;

  const z =
    side === "front"
      ? 0.2
      : -0.2;

  return (
    <mesh
      position={[
        design.x,
        design.y,
        z,
      ]}
      rotation={[
        0,
        side === "back"
          ? Math.PI
          : 0,
        THREE.MathUtils.degToRad(
          design.rotation
        ),
      ]}
    >
      <planeGeometry
        args={[
          design.scale,
          design.scale,
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