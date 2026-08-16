import React, { useState, useEffect } from "react";
import { X, ZoomIn, Download, RefreshCw, Layers, Sparkles, Edit } from "lucide-react";
import Scene from "../three/Scene";

const colorMap = {
  white: "#ffffff",
  black: "#111827",
  charcoal: "#4b5563",
  "navy blue": "#1e3a8a",
  navy: "#1e3a8a",
  red: "#dc2626",
  gold: "#fbbf24",
  yellow: "#fbbf24",
  green: "#16a34a",
  violet: "#6d28d9",
  purple: "#6d28d9",
  pink: "#f472b6",
  beige: "#f5f5dc",
  "light grey": "#e5e7eb",
  "light gray": "#e5e7eb",
  grey: "#9ca3af",
  gray: "#9ca3af",
  "light blue": "#93c5fd",
  blue: "#3b82f6",
  brown: "#78350f"
};

const getColorValue = (colorStr) => {
  if (!colorStr) return "#ffffff";
  if (colorStr.startsWith("#")) return colorStr;
  const lower = colorStr.toLowerCase().trim();
  return colorMap[lower] || colorStr;
};

const getModelPath = (design) => {
  if (!design) return "/images/models/male normal t-shirt1.glb";
  if (design.modelPath && typeof design.modelPath === "string" && design.modelPath.endsWith(".glb")) {
    return design.modelPath;
  }
  if (design.modelUrl && typeof design.modelUrl === "string" && design.modelUrl.endsWith(".glb")) {
    return design.modelUrl;
  }

  const textStr = (
    design.tShirtType ||
    design.shirtType ||
    design.type ||
    design.model ||
    design.title ||
    design.name ||
    design.category ||
    (typeof design === "string" ? design : "")
  ).toLowerCase();

  if (textStr.includes("female") || textStr.includes("women") || textStr.includes("v-neck") || textStr.includes("woman")) {
    return "/images/models/female normal t-shirt.glb";
  }
  if (textStr.includes("long sleeve") || textStr.includes("long-sleeve")) {
    return "/images/models/long_sleeve_t-_shirt.glb";
  }
  if (textStr.includes("oversized")) {
    return "/images/models/oversized t-sdirt1.glb";
  }
  if (textStr.includes("hoodie") || textStr.includes("polo")) {
    return "/images/models/t_shirt_hoodie.glb";
  }
  return "/images/models/male normal t-shirt1.glb";
};

const getLayersFromDesign = (design) => {
  if (!design) return [];
  if (design.layers && Array.isArray(design.layers) && design.layers.length > 0) {
    return design.layers.map((l, idx) => ({
      id: l.id || `layer-${idx}`,
      type: l.type || "image",
      name: l.name || (l.type === "text" ? "Custom Text" : "Custom Logo"),
      text: l.text || "",
      fontFamily: l.fontFamily || "Outfit",
      color: l.color || "#1e293b",
      bold: Boolean(l.bold),
      italic: Boolean(l.italic),
      url: l.url || l.image || l.src || "",
      visible: l.visible !== undefined ? Boolean(l.visible) : true,
      locked: l.locked !== undefined ? Boolean(l.locked) : false,
      flipX: Boolean(l.flipX),
      flipY: Boolean(l.flipY),
      position: Array.isArray(l.position) && l.position.length === 3 ? l.position : [0, 0, 0],
      rotation: Array.isArray(l.rotation) && l.rotation.length === 3 ? l.rotation : [0, 0, 0],
      scale: Array.isArray(l.scale) && l.scale.length === 3 ? l.scale : [0.3, 0.3, 0.25],
      projectedForModel: l.projectedForModel || null,
      targetMeshName: l.targetMeshName || null
    }));
  }
  const designImg = design.thumbnailUrl || design.designUrl || (design.images && design.images[0]);
  if (designImg && designImg !== "/images/dumyImage.png") {
    return [
      {
        id: "logo-layer",
        type: "image",
        name: "Custom Logo",
        url: designImg,
        visible: true,
        locked: false,
        flipX: false,
        flipY: false,
        position: [0, 0.1, 0.15],
        rotation: [0, 0, 0],
        scale: [0.35, 0.35, 0.35],
      },
    ];
  }
  return [];
};

export default function TShirt3DModal({ isOpen, onClose, design, onCustomize }) {
  const [activeSide, setActiveSide] = useState("front");
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [modelRotation, setModelRotation] = useState(0);

  useEffect(() => {
    if (activeSide === "front") setModelRotation(0);
    else if (activeSide === "back") setModelRotation(Math.PI);
    else if (activeSide === "left") setModelRotation(Math.PI / 2);
    else if (activeSide === "right") setModelRotation(-Math.PI / 2);
  }, [activeSide]);

  if (!isOpen || !design) return null;

  const handleCustomize = () => {
    if (onCustomize) {
      onCustomize(design);
    } else {
      localStorage.setItem("load_custom_design", JSON.stringify(design));
      window.location.href = "/designer";
    }
  };

  const resolvedColor = getColorValue(design.fabricColor || design.color || design.selectedColor);
  const resolvedModelPath = getModelPath(design);
  const layers = getLayersFromDesign(design);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px] select-none animate-in fade-in zoom-in duration-200">
        
        {/* Left 3D Canvas Panel */}
        <div className="flex-1 bg-slate-50 relative flex flex-col justify-between p-6 border-b md:border-b-0 md:border-r">
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
              Interactive 3D Preview
            </span>
            <span className="text-[10px] text-slate-400 pl-1 font-semibold">
              * Drag with mouse to orbit / inspect
            </span>
          </div>

          {/* Preset Side buttons */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            {["front", "back", "left", "right"].map((side) => (
              <button
                key={side}
                onClick={() => setActiveSide(side)}
                className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border transition shadow-xs ${activeSide === side
                  ? "bg-indigo-600 border-indigo-650 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {side}
              </button>
            ))}
          </div>

          {/* 3D canvas container */}
          <div className="w-full flex-1 relative min-h-[300px] md:min-h-0">
            <Scene
              modelPath={resolvedModelPath}
              shirtColor={resolvedColor}
              activeSide={activeSide}
              zoomLevel={zoomLevel}
              layers={layers}
              selectedLayerId={null}
              onSelectLayer={() => {}}
              onUpdateLayers={() => {}}
              modelRotation={modelRotation}
              orbitEnabled={true}
            />
          </div>

          {/* Zoom control slider */}
          <div className="flex items-center gap-3 bg-white/90 backdrop-blur-xs border rounded-2xl px-4 py-2 self-center z-10 shadow-xs">
            <ZoomIn className="h-3.5 w-3.5 text-slate-400" />
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
              className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <span className="text-[10px] font-black text-slate-700">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => {
                setActiveSide("front");
                setZoomLevel(0.85);
              }}
              title="Reset View"
              className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="w-full md:w-[320px] bg-white flex flex-col p-6 h-full justify-between">
          <div className="space-y-6 overflow-y-auto pr-1">
            {/* Header with Title, Customize button and Close button */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight capitalize">
                  {design.tShirtType || design.title || "Custom T-Shirt"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {design.material || "180GSM Cotton"}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCustomize}
                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Open in 3D Customizer"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span>Customize</span>
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Swatch & Spec cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <div
                  className="h-8 w-8 rounded-full border border-slate-200 shadow-sm shrink-0"
                  style={{ backgroundColor: resolvedColor }}
                />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Fabric Color</p>
                  <p className="text-xs font-extrabold text-slate-800 capitalize">
                    {design.fabricColor || design.color || design.selectedColor || "Custom"}
                  </p>
                </div>
              </div>

              {design.size && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Selected Size</span>
                  <span className="px-3 py-1 bg-white border rounded-xl text-xs font-black text-slate-800">
                    {design.size}
                  </span>
                </div>
              )}
            </div>

            {/* Layers details */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                Custom Decals ({layers.length})
              </h4>

              {layers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No customizable graphic or text layers added.</p>
              ) : (
                <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                  {layers.map((layer, idx) => (
                    <div
                      key={layer.id || idx}
                      className="p-2.5 border rounded-xl bg-white shadow-2xs hover:border-slate-300 transition flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold text-slate-900 capitalize truncate">
                          {layer.type}: {layer.name || `Layer ${idx + 1}`}
                        </p>
                        {layer.type === "text" && (
                          <p className="text-[10px] text-slate-400 font-semibold truncate italic mt-0.5">
                            "{layer.text}" ({layer.fontFamily})
                          </p>
                        )}
                      </div>

                      {layer.url && layer.url !== "/images/dumyImage.png" && (
                        <a
                          href={layer.url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 hover:bg-slate-100 rounded-lg text-indigo-650 transition shrink-0"
                          title="Download asset"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer with Customize Action & Estimated Cost */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-3 select-none">
            {design.estimatedCost && (
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase">Estimated Cost</span>
                <span className="text-lg font-black text-slate-900">
                  Rs. {typeof design.estimatedCost === "number" ? design.estimatedCost.toFixed(2) : design.estimatedCost}
                </span>
              </div>
            )}
            <button
              onClick={handleCustomize}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Edit className="h-4 w-4" />
              Customize Design in 3D
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
