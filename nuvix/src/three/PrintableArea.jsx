import * as THREE from "three";

export default function PrintableArea({
  side,
}) {
  const z =
    side === "front"
      ? 0.19
      : -0.19;

  return (
    <group
      position={[0, 1.35, z]}
      rotation={[
        0,
        side === "back"
          ? Math.PI
          : 0,
        0,
      ]}
    >
      {/* Area */}

      <mesh>
        <planeGeometry
          args={[1.5, 2]}
        />

        <meshBasicMaterial
          color="#00aaff"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Border */}

      <lineSegments>
        <edgesGeometry
          args={[
            new THREE.PlaneGeometry(
              1.5,
              2
            ),
          ]}
        />

        <lineBasicMaterial
          color="blue"
        />
      </lineSegments>
    </group>
  );
}