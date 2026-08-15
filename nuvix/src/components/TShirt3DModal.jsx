import React, { useState, useEffect, useRef } from "react";
import { X, ZoomIn, Download, RefreshCw, Layers, Sparkles, Camera, CheckCircle, Loader2 } from "lucide-react";
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

const getModelPath = (typeStr) => {
  if (!typeStr) return "/images/models/male normal t-shirt1.glb";
  const lower = typeStr.toLowerCase();
  if (lower.includes("female") || lower.includes("women")) {
    return "/images/models/female normal t-shirt.glb";
  }
  if (lower.includes("long sleeve") || lower.includes("long-sleeve")) {
    return "/images/models/long_sleeve_t-_shirt.glb";
  }
  if (lower.includes("oversized")) {
    return "/images/models/oversized t-sdirt1.glb";
  }
  if (lower.includes("hoodie")) {
    return "/images/models/t_shirt_hoodie.glb";
  }
  return "/images/models/male normal t-shirt1.glb";
};

export default function TShirt3DModal({ isOpen, onClose, design }) {
  const [activeSide, setActiveSide] = useState("front");
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [modelRotation, setModelRotation] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureFeedback, setCaptureFeedback] = useState("");
  const canvasContainerRef = useRef(null);

  useEffect(() => {
    if (activeSide === "front") setModelRotation(0);
    else if (activeSide === "back") setModelRotation(Math.PI);
    else if (activeSide === "left") setModelRotation(Math.PI / 2);
    else if (activeSide === "right") setModelRotation(-Math.PI / 2);
  }, [activeSide]);

  if (!isOpen || !design) return null;

  const resolvedColor = getColorValue(design.fabricColor || design.color || design.selectedColor);
  const resolvedModelPath = getModelPath(design.tShirtType || design.title);
  const layers = design.layers || [];
  const titleName = (design.tShirtType || design.title || "custom-shirt").replace(/[^a-z0-9]/gi, "-").toLowerCase();

  // Capture current canvas view as PNG
  const captureCurrentCanvasScreenshot = () => {
    if (!canvasContainerRef.current) return null;
    const canvas = canvasContainerRef.current.querySelector("canvas");
    if (!canvas) return null;
    try {
      return canvas.toDataURL("image/png");
    } catch (e) {
      console.error("Canvas screenshot capture error:", e);
      return null;
    }
  };

  const handleDownloadActiveScreenshot = () => {
    setIsCapturing(true);
    setTimeout(() => {
      const dataUrl = captureCurrentCanvasScreenshot();
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `${titleName}-${activeSide}-view-3d.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setCaptureFeedback(`Downloaded ${activeSide} view!`);
        setTimeout(() => setCaptureFeedback(""), 2500);
      } else {
        alert("Unable to capture canvas snapshot. Please try again.");
      }
      setIsCapturing(false);
    }, 150);
  };

  // Sequential capture of all 4 views (front, back, left, right)
  const handleDownloadAllAngles = async () => {
    setIsCapturing(true);
    setCaptureFeedback("Generating 4-angle screenshot pack...");

    const sides = [
      { side: "front", rot: 0 },
      { side: "back", rot: Math.PI },
      { side: "left", rot: Math.PI / 2 },
      { side: "right", rot: -Math.PI / 2 }
    ];

    try {
      for (const item of sides) {
        setActiveSide(item.side);
        setModelRotation(item.rot);
        // Wait for WebGL render & smooth transition
        await new Promise((resolve) => setTimeout(resolve, 350));
        const dataUrl = captureCurrentCanvasScreenshot();
        if (dataUrl) {
          const link = document.createElement("a");
          link.download = `${titleName}-${item.side}-view-3d.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      setCaptureFeedback("All 4 views downloaded successfully!");
      setTimeout(() => setCaptureFeedback(""), 3000);
    } catch (err) {
      console.error("Batch angle capture error:", err);
      alert("Error downloading all angles.");
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[92vh] md:h-[620px] select-none animate-in fade-in zoom-in duration-200">
        
        {/* Left 3D Canvas Panel */}
        <div className="flex-1 bg-slate-50 relative flex flex-col justify-between p-6 border-b md:border-b-0 md:border-r">
          
          {/* Top Info Bar */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
              Interactive 3D Inspector
            </span>
            <span className="text-[10px] text-slate-400 pl-1 font-medium">
              * Click & drag to rotate freely, or select an angle preset
            </span>
          </div>

          {/* Preset Side buttons */}
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
            {[
              { id: "front", label: "Front" },
              { id: "back", label: "Back" },
              { id: "left", label: "Left Side" },
              { id: "right", label: "Right Side" }
            ].map((sideObj) => (
              <button
                key={sideObj.id}
                onClick={() => setActiveSide(sideObj.id)}
                className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-xl border transition shadow-xs cursor-pointer ${
                  activeSide === sideObj.id
                    ? "bg-indigo-600 border-indigo-700 text-white shadow-indigo-200 shadow-md ring-2 ring-indigo-200"
                    : "bg-white/90 backdrop-blur-xs border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                {sideObj.label}
              </button>
            ))}
          </div>

          {/* 3D canvas container */}
          <div ref={canvasContainerRef} className="w-full flex-1 relative min-h-[300px] md:min-h-0">
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

          {/* Bottom Bar: Zoom Controls & Capture buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 z-10">
            
            {/* Zoom Slider */}
            <div className="flex items-center gap-2.5 bg-white/90 backdrop-blur-xs border border-slate-200 rounded-2xl px-3.5 py-1.5 shadow-2xs">
              <ZoomIn className="h-3.5 w-3.5 text-slate-400" />
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <span className="text-[10px] font-black text-slate-700">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => {
                  setActiveSide("front");
                  setZoomLevel(0.85);
                }}
                title="Reset View"
                className="p-1 hover:bg-slate-100 rounded-md text-slate-500 transition cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {/* Screenshot Download Actions */}
            <div className="flex items-center gap-2">
              <button
                disabled={isCapturing}
                onClick={handleDownloadActiveScreenshot}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                title={`Download high-res PNG screenshot of ${activeSide} view`}
              >
                {isCapturing ? <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-600" /> : <Camera className="h-3.5 w-3.5 text-indigo-600" />}
                <span>Screenshot ({activeSide})</span>
              </button>

              <button
                disabled={isCapturing}
                onClick={handleDownloadAllAngles}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
                title="Automatically capture and download all 4 views (Front, Back, Left, Right)"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download All 4 Angles</span>
              </button>
            </div>
          </div>

          {/* Feedback banner */}
          {captureFeedback && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
              <span>{captureFeedback}</span>
            </div>
          )}
        </div>

        {/* Right Info Panel */}
        <div className="w-full md:w-[320px] bg-white flex flex-col p-6 h-full justify-between">
          <div className="space-y-5 overflow-y-auto pr-1">
            {/* Header with Title and Close button */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight capitalize">
                  {design.tShirtType || design.title || "Custom T-Shirt"}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  {design.material || "180GSM Cotton"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Swatch & Spec cards */}
            <div className="space-y-2.5">
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

            {/* Layers details & Asset Downloads */}
            <div className="space-y-2.5">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-slate-500" />
                Custom Decal Assets ({layers.length})
              </h4>

              {layers.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No customizable graphic or text layers added.</p>
              ) : (
                <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
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
                          download={`${titleName}-asset-${idx + 1}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition flex items-center gap-1 shrink-0"
                          title="Download original graphic file"
                        >
                          <Download className="h-3 w-3" /> Asset
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer estimated cost */}
          {design.estimatedCost && (
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between select-none">
              <span className="text-xs font-bold text-slate-400 uppercase">Unit Price</span>
              <span className="text-lg font-black text-slate-900">
                Rs. {Number(design.estimatedCost).toFixed(2)}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
