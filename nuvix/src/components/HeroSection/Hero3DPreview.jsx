import { Canvas, useFrame } from "@react-three/fiber";
import { Center, Float, OrbitControls, useGLTF } from "@react-three/drei";
import { Suspense, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { RepeatWrapping, TextureLoader, SRGBColorSpace } from "three";

function ShirtModel({ modelRef, color, imageUrl, onPointerDown }) {
  const { scene } = useGLTF("/images/models/t_shirt.glb");
  const imageTextureRef = useRef(null);

  useFrame((state) => {
    if (!modelRef.current) return;
    const baseX = modelRef.current.userData.baseX ?? 0;
    const baseY = modelRef.current.userData.baseY ?? 0;
    const baseZ = modelRef.current.userData.baseZ ?? 0;
    modelRef.current.rotation.y = baseY + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
    modelRef.current.rotation.x = baseX + Math.sin(state.clock.elapsedTime * 0.25) * 0.05;
    modelRef.current.rotation.z = baseZ;
  });

  useEffect(() => {
    scene.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          if (material.color) material.color.set(color);
          material.needsUpdate = true;
        });
      } else {
        if (child.material.color) child.material.color.set(color);
        child.material.needsUpdate = true;
      }
    });
  }, [scene, color]);

  useEffect(() => {
    if (imageTextureRef.current) {
      imageTextureRef.current.dispose();
      imageTextureRef.current = null;
    }

    if (!imageUrl) {
      scene.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          if (material.map) {
            material.map.dispose();
            material.map = null;
          }
          material.needsUpdate = true;
        });
      });
      return;
    }

    const loader = new TextureLoader();
    const texture = loader.load(imageUrl, () => {
      scene.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((material) => {
          material.map = texture;
          material.color.set(color);
          material.needsUpdate = true;
        });
      });
    });

    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(1, 1);
    imageTextureRef.current = texture;

    return () => {
      texture.dispose();
      imageTextureRef.current = null;
    };
  }, [scene, imageUrl, color]);



  return (
    <group ref={modelRef} onPointerDown={onPointerDown}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
}

useGLTF.preload("/images/models/t_shirt.glb");

const Hero3DPreview = forwardRef(function Hero3DPreview({ scale, onScaleChange, color, onColorChange, imageUrl }, ref) {
  const modelRef = useRef();
  const defaultScale = 0.8;
  const scaleRef = useRef(defaultScale);
  const rotationRef = useRef({ x: 0, y: 0, z: 0 });

  useImperativeHandle(ref, () => ({
    reset() {
      scaleRef.current = defaultScale;
      rotationRef.current = { x: 0, y: 0, z: 0 };
      if (modelRef.current) {
        modelRef.current.scale.setScalar(defaultScale);
        modelRef.current.rotation.set(0, 0, 0);
        modelRef.current.userData.baseX = 0;
        modelRef.current.userData.baseY = 0;
        modelRef.current.userData.baseZ = 0;
      }
      if (onScaleChange) onScaleChange(scaleRef.current);
    },
    fit() {
      scaleRef.current = defaultScale;
      if (modelRef.current) modelRef.current.scale.setScalar(scaleRef.current);
      if (onScaleChange) onScaleChange(scaleRef.current);
    },
    setScale(v) {
      scaleRef.current = Math.min(2.5, Math.max(0.5, v));
      if (modelRef.current) modelRef.current.scale.setScalar(scaleRef.current);
      if (onScaleChange) onScaleChange(scaleRef.current);
    },
    rotateBy(x = 0, y = 0, z = 0) {
      rotationRef.current = {
        x: rotationRef.current.x + x,
        y: rotationRef.current.y + y,
        z: rotationRef.current.z + z,
      };
      if (modelRef.current) {
        modelRef.current.userData.baseX = rotationRef.current.x;
        modelRef.current.userData.baseY = rotationRef.current.y;
        modelRef.current.userData.baseZ = rotationRef.current.z;
      }
    },
    getScale() {
      return scaleRef.current;
    },
    setColor(nextColor) {
      if (onColorChange) onColorChange(nextColor);
    }
  }));

  function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    scaleRef.current = Math.min(2.5, Math.max(0.5, scaleRef.current + delta));
    if (modelRef.current) modelRef.current.scale.setScalar(scaleRef.current);
    if (onScaleChange) onScaleChange(scaleRef.current);
  }

  function handleClick(e) {
    // single click increments zoom a bit (useful for users who expect clicking to zoom)
    e.preventDefault();
    scaleRef.current = Math.min(2.5, scaleRef.current + 0.2);
    if (modelRef.current) modelRef.current.scale.setScalar(scaleRef.current);
    if (onScaleChange) onScaleChange(scaleRef.current);
  }

  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.userData.baseX = rotationRef.current.x;
      modelRef.current.userData.baseY = rotationRef.current.y;
      modelRef.current.userData.baseZ = rotationRef.current.z;
    }
    if (modelRef.current) modelRef.current.scale.setScalar(scaleRef.current);
    if (onScaleChange) onScaleChange(scaleRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply external `scale` prop when it changes (keeps UI slider and model in sync)
  useEffect(() => {
    if (typeof scale === "number") {
      const clamped = Math.min(2.5, Math.max(0.5, scale));
      scaleRef.current = clamped;
      if (modelRef.current) modelRef.current.scale.setScalar(scaleRef.current);
      if (onScaleChange) onScaleChange(scaleRef.current);
    }
  }, [scale, onScaleChange]);

  return (
    <div onWheel={handleWheel} onClick={handleClick} className="relative h-72 w-full max-w-80 sm:h-90 sm:max-w-90 lg:h-105 lg:max-w-115 cursor-pointer">
      <div className="absolute inset-0 rounded-4xl bg-linear-to-br from-white via-indigo-50 to-violet-100 shadow-[0_24px_60px_rgba(99,102,241,0.14)]" />
      <Canvas camera={{ position: [0, 0.18, 2.6], fov: 38 }} shadows className="relative z-10 h-full w-full">
        <ambientLight intensity={1.4} />
        <directionalLight position={[3, 4, 5]} intensity={2.1} castShadow />
        <directionalLight position={[-3, 1, 2]} intensity={0.9} />
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
            <ShirtModel modelRef={modelRef} color={color} imageUrl={imageUrl} onPointerDown={handleClick} />
          </Float>
        </Suspense>
        <OrbitControls enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 2.8} maxPolarAngle={Math.PI / 2.2} />
      </Canvas>
    </div>
  );
});

export default Hero3DPreview;
