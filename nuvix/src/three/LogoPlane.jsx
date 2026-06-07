export default function LogoPlane() {
  return (
    <mesh position={[-0.15, 0.95, 0.05]}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial color="red" />
    </mesh>
  );
}