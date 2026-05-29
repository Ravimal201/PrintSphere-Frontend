import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Float, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useRef, useEffect, forwardRef, useImperativeHandle } from "react";

function ShirtModel({ modelRef }) {
  const { scene } = useGLTF("/images/models/t_shirt.glb");

  useFrame((state) => {
    if (!modelRef.current) return;
    modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    modelRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.25) * 0.05;
  });



  return (
    <group ref={modelRef}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

useGLTF.preload("/images/models/t_shirt.glb");

const Hero3DPreview = forwardRef(function Hero3DPreview({ onScaleChange }, ref) {
  const modelRef = useRef();
  const scaleRef = useRef(1.6);

  useImperativeHandle(ref, () => ({
    reset() {
      scaleRef.current = 1.6;
      if (modelRef.current) {
        modelRef.current.scale.setScalar(1.6);
        modelRef.current.rotation.set(0, 0, 0);
      }
      if (onScaleChange) onScaleChange(scaleRef.current);
    },
    setScale(v) {
      scaleRef.current = Math.min(2.5, Math.max(0.5, v));
      if (modelRef.current) modelRef.current.scale.setScalar(scaleRef.current);
      if (onScaleChange) onScaleChange(scaleRef.current);
    },
    getScale() {
      return scaleRef.current;
    }
  }));

  function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    scaleRef.current = Math.min(2.5, Math.max(0.5, scaleRef.current + delta));
    if (modelRef.current) modelRef.current.scale.setScalar(scaleRef.current);
    if (onScaleChange) onScaleChange(scaleRef.current);
  }

  useEffect(() => {
    if (modelRef.current) modelRef.current.scale.setScalar(scaleRef.current);
    if (onScaleChange) onScaleChange(scaleRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div onWheel={handleWheel} className="relative h-72 w-full max-w-80 sm:h-90 sm:max-w-90 lg:h-105 lg:max-w-115">
      <div className="absolute inset-0 rounded-4xl bg-linear-to-br from-white via-indigo-50 to-violet-100 shadow-[0_24px_60px_rgba(99,102,241,0.14)]" />
      <Canvas camera={{ position: [0, 0.2, 3.2], fov: 35 }} shadows className="relative z-10 h-full w-full">
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 4, 5]} intensity={2.1} castShadow />
        <directionalLight position={[-3, 1, 2]} intensity={0.9} />
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
            <ShirtModel modelRef={modelRef} />
          </Float>
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.8} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
});

export default Hero3DPreview;
