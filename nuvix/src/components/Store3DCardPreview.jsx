import React, { useState, useEffect, useRef, Suspense } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import ShirtModel from "../three/ShirtModel";
import TShirt2D from "./TShirt2D";
import { Sparkles, Image as ImageIcon } from "lucide-react";

// Global cache for frozen 3D model snapshot images
const snapshotCache = new Map();

// R3F Helper component to trigger single-frame render and capture Data URL snapshot
function SnapshotCapturer({ onCapture }) {
  const { gl, scene, camera } = useThree();
  const hasCapturedRef = useRef(false);

  useEffect(() => {
    hasCapturedRef.current = false;
    // Wait for initial render frame and textures to settle before capturing snapshot
    const timer = setTimeout(() => {
      if (!hasCapturedRef.current) {
        try {
          gl.render(scene, camera);
          const dataUrl = gl.domElement.toDataURL("image/png");
          if (dataUrl && dataUrl.length > 200) {
            hasCapturedRef.current = true;
            onCapture(dataUrl);
          }
        } catch (err) {
          console.warn("Could not capture 3D snapshot:", err);
        }
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [gl, scene, camera, onCapture]);

  return null;
}

export default function Store3DCardPreview({ product, activeColor, onClick }) {
  const [viewAngle, setViewAngle] = useState("front"); // "front", "back", "side"
  const [isHovered, setIsHovered] = useState(false);

  const getModelPath = () => {
    if (!product) return "/images/models/male normal t-shirt1.glb";
    if (product.modelPath) return product.modelPath;
    const title = (product.title || "").toLowerCase();
    const category = (product.category || "").toLowerCase();

    if (
      title.includes("female") ||
      title.includes("women") ||
      category.includes("female") ||
      category.includes("women")
    ) {
      return "/images/models/female normal t-shirt.glb";
    }
    if (title.includes("long sleeve") || category.includes("long sleeve")) {
      return "/images/models/long_sleeve_t-_shirt.glb";
    }
    if (title.includes("oversized") || category.includes("oversized")) {
      return "/images/models/oversized t-sdirt1.glb";
    }
    if (title.includes("hoodie") || category.includes("hoodie")) {
      return "/images/models/t_shirt_hoodie.glb";
    }
    return "/images/models/male normal t-shirt1.glb";
  };

  const getLayers = () => {
    if (!product) return [];
    if (product.layers && product.layers.length > 0) {
      return product.layers;
    }
    const designImg = product.images?.[0];
    if (designImg) {
      return [
        {
          id: "logo-layer",
          type: "image",
          url: designImg,
          visible: true,
          locked: true,
          position: [0, 0.1, 0.15],
          rotation: [0, 0, 0],
          scale: [0.35, 0.35, 0.35],
        },
      ];
    }
    return [];
  };

  const shirtColor = activeColor || product.colors?.[0] || "#ffffff";
  const designImg = product.images?.[0];
  const productId = product._id || product.id || product.title || "prod";
  const cacheKey = `${productId}_${shirtColor}_${viewAngle}_${designImg || ""}`;

  const [snapshotUrl, setSnapshotUrl] = useState(() => snapshotCache.get(cacheKey) || null);
  const [isCapturing, setIsCapturing] = useState(!snapshotCache.has(cacheKey));

  useEffect(() => {
    if (snapshotCache.has(cacheKey)) {
      setSnapshotUrl(snapshotCache.get(cacheKey));
      setIsCapturing(false);
    } else {
      setSnapshotUrl(null);
      setIsCapturing(true);
    }
  }, [cacheKey]);

  const handleCapture = (dataUrl) => {
    snapshotCache.set(cacheKey, dataUrl);
    setSnapshotUrl(dataUrl);
    setIsCapturing(false);
  };

  // Convert viewAngle string to model Y rotation
  let rotationY = 0;
  if (viewAngle === "back") {
    rotationY = Math.PI;
  } else if (viewAngle === "side") {
    rotationY = Math.PI / 2;
  }

  return (
    <div
      className="relative rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100 h-52 w-full overflow-hidden border border-slate-200/80 cursor-pointer group/card select-none shadow-2xs hover:border-indigo-300 transition duration-300 flex items-center justify-center p-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* 3 View Buttons Overlay at top of card on hover */}
      <div
        className={`absolute top-2.5 inset-x-0 z-30 flex justify-center items-center transition-all duration-300 ${
          isHovered
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="bg-slate-900/85 backdrop-blur-md px-1.5 py-1 rounded-xl shadow-lg flex items-center gap-1 border border-white/15">
          {[
            { id: "front", label: "Front" },
            { id: "back", label: "Back" },
            { id: "side", label: "Side" },
          ].map((view) => {
            const isActive = viewAngle === view.id;
            return (
              <button
                key={view.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewAngle(view.id);
                }}
                className={`px-2.5 py-0.5 text-[10px] font-black uppercase rounded-lg transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "text-slate-300 hover:text-white hover:bg-white/15"
                }`}
              >
                {view.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Frozen 3D Image Snapshot when captured */}
      {snapshotUrl ? (
        <div className="w-full h-full flex items-center justify-center pointer-events-none transition-transform duration-300 group-hover/card:scale-105">
          <img
            src={snapshotUrl}
            alt={`${product?.title || "3D T-shirt"} - ${viewAngle} view`}
            className="max-h-full max-w-full object-contain filter drop-shadow-xl select-none"
          />
        </div>
      ) : (
        /* Offscreen/Temporary 3D Canvas Snapshot Generator */
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Subtle background fallback while rendering single frame snapshot */}
          <div className="absolute inset-0 flex items-center justify-center opacity-60 pointer-events-none">
            <TShirt2D
              color={shirtColor}
              designUrl={designImg}
              layers={getLayers()}
              view={viewAngle}
              className="h-40 w-40 filter blur-[1px] grayscale-[20%]"
            />
          </div>

          {/* 3D Canvas running on-demand to capture snapshot frame */}
          <div className="w-full h-full opacity-95">
            <Canvas
              frameloop="demand"
              gl={{ preserveDrawingBuffer: true, antialias: true }}
              camera={{ position: [0, 0.1, 4.0], fov: 38 }}
              shadows
              className="w-full h-full pointer-events-none"
            >
              <ambientLight intensity={1.6} />
              <directionalLight position={[4, 5, 5]} intensity={2.2} />
              <directionalLight position={[-4, 3, -5]} intensity={1.2} />

              <Suspense fallback={null}>
                <Environment preset="city" />
                <group rotation={[0, rotationY, 0]}>
                  <ShirtModel
                    modelPath={getModelPath()}
                    shirtColor={shirtColor}
                    layers={getLayers()}
                    selectedLayerId={null}
                    onSelectLayer={() => {}}
                    onUpdateLayers={() => {}}
                  />
                </group>
                <SnapshotCapturer onCapture={handleCapture} />
              </Suspense>
            </Canvas>
          </div>
        </div>
      )}

      {/* View Badge Tag */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <span className="px-2 py-0.5 bg-slate-900/60 backdrop-blur-xs text-slate-200 text-[9px] font-bold rounded-md uppercase tracking-wider border border-white/10 flex items-center gap-1 shadow-xs">
          <ImageIcon className="h-2.5 w-2.5 text-indigo-400" />
          3D PREVIEW • {viewAngle.toUpperCase()}
        </span>
      </div>
    </div>
  );
}
