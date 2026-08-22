import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import Store3DCardPreview from "../components/Store3DCardPreview";
import TShirt3DModal from "../components/TShirt3DModal";
import Scene from "../three/Scene";
import {
  Palette,
  Edit,
  AlertCircle,
  Trash2,
  Eye,
  RotateCw,
  Sparkles,
  Layers,
  Box,
  LayoutGrid,
  Camera,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCircle2,
  Plus
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const getModelPath = (design) => {
  if (!design) return "/images/models/male normal t-shirt1.glb";
  if (design.modelPath && typeof design.modelPath === "string" && (design.modelPath.endsWith(".glb") || design.modelPath.endsWith(".gltf") || design.modelPath.endsWith(".fbx"))) {
    return design.modelPath;
  }
  if (design.modelUrl && typeof design.modelUrl === "string" && (design.modelUrl.endsWith(".glb") || design.modelUrl.endsWith(".gltf") || design.modelUrl.endsWith(".fbx"))) {
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
    ""
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
  if (textStr.includes("fbx") || textStr.includes("classic")) {
    return "/images/models/T SHIRT.fbx";
  }
  return "/images/models/male normal t-shirt1.glb";
};

const getLayersFromDesign = (design) => {
  if (!design) return [];
  if (design.layers && Array.isArray(design.layers) && design.layers.length > 0) {
    return design.layers.map((l, idx) => ({
      id: l.id || `layer-${idx}`,
      type: l.type || "image",
      name: l.name || (l.type === "text" ? "Custom Text" : "Graphic Decal"),
      text: l.text || "",
      fontFamily: l.fontFamily || "Outfit",
      color: l.color || "#1e293b",
      bold: Boolean(l.bold),
      italic: Boolean(l.italic),
      url: l.url || l.image || l.src || "",
      visible: l.visible !== undefined ? Boolean(l.visible) : true,
      locked: false,
      flipX: Boolean(l.flipX),
      flipY: Boolean(l.flipY),
      position: Array.isArray(l.position) && l.position.length === 3 ? l.position : [0, 0.1, 0.15],
      rotation: Array.isArray(l.rotation) && l.rotation.length === 3 ? l.rotation : [0, 0, 0],
      scale: Array.isArray(l.scale) && l.scale.length === 3 ? l.scale : [0.35, 0.35, 0.35],
    }));
  }
  const designImg = design.thumbnailUrl || design.designUrl || (design.images && design.images[0]);
  if (designImg && designImg !== "/images/dumyImage.png") {
    return [
      {
        id: "logo-layer",
        type: "image",
        name: "Custom Graphic",
        url: designImg,
        visible: true,
        locked: false,
        position: [0, 0.1, 0.15],
        rotation: [0, 0, 0],
        scale: [0.35, 0.35, 0.35],
      },
    ];
  }
  return [];
};

export default function MyDesignsPage() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("showcase"); // "showcase" | "grid"

  // Active design in 3D Showcase Stage
  const [activeDesignIndex, setActiveDesignIndex] = useState(0);
  const [activeSide, setActiveSide] = useState("front");
  const [modelRotation, setModelRotation] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.85);

  // Modal Inspector
  const [selected3DDesign, setSelected3DDesign] = useState(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);

  useEffect(() => {
    fetchDesigns();
  }, []);

  const fetchDesigns = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login?redirect=/my-designs";
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/designs`, { headers });
      setDesigns(res.data || []);
    } catch (err) {
      console.error("Fetch customer designs error:", err);
      setError("Failed to load saved designs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Turntable auto spin handler
  useEffect(() => {
    let interval = null;
    if (isAutoRotating) {
      interval = setInterval(() => {
        setModelRotation((prev) => (prev + 0.03) % (Math.PI * 2));
      }, 30);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoRotating]);

  const handleAngleChange = (side) => {
    setIsAutoRotating(false);
    setActiveSide(side);
    if (side === "front") setModelRotation(0);
    else if (side === "back") setModelRotation(Math.PI);
    else if (side === "left") setModelRotation(Math.PI / 2);
    else if (side === "right") setModelRotation(-Math.PI / 2);
  };

  const handleLoadDesign = (design) => {
    localStorage.setItem("load_custom_design", JSON.stringify(design));
    window.location.href = "/designer";
  };

  const handleDeleteDesign = async (id, e) => {
    e?.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this design?")) {
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.delete(`${API_BASE_URL}/auth/designs/${id}`, { headers });
      setDesigns((prev) => prev.filter((d) => d._id !== id));
      if (activeDesignIndex >= designs.length - 1) {
        setActiveDesignIndex(Math.max(0, designs.length - 2));
      }
    } catch (err) {
      console.error("Delete custom design error:", err);
      alert(err.response?.data?.message || "Failed to delete design. Please try again.");
    }
  };

  const activeDesign = designs[activeDesignIndex] || designs[0];

  // Stats calculation
  const totalLayers = useMemo(() => {
    return designs.reduce((sum, d) => sum + (d.layers?.length || (d.thumbnailUrl ? 1 : 0)), 0);
  }, [designs]);

  const totalValue = useMemo(() => {
    return designs.reduce((sum, d) => sum + (d.estimatedCost || 0), 0);
  }, [designs]);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 lg:ml-72 select-none">
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* Header & Quick Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider mb-2">
                  <Palette className="h-3.5 w-3.5" />
                  Wardrobe Customizer Cloud
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  My Saved 3D Designs
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Manage, preview in real-time 3D, export screenshots, or continue editing your creations.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                {designs.length > 0 && (
                  <div className="inline-flex items-center p-1 bg-white rounded-2xl border border-slate-200 shadow-xs">
                    <button
                      onClick={() => setViewMode("showcase")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        viewMode === "showcase"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <Box className="h-3.5 w-3.5" />
                      <span>3D Studio</span>
                    </button>
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        viewMode === "grid"
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <LayoutGrid className="h-3.5 w-3.5" />
                      <span>3D Grid</span>
                    </button>
                  </div>
                )}

                <a
                  href="/designer"
                  className="flex items-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-200 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Design</span>
                </a>
              </div>
            </div>

            {/* Stats Overview Banner */}
            {designs.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Saved</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {designs.length} <span className="text-xs font-bold text-indigo-600">Creations</span>
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Decals & Layers</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {totalLayers} <span className="text-xs font-bold text-emerald-600">Assets</span>
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Portfolio Value</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    Rs. {totalValue.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {/* Content States */}
            {loading ? (
              <div className="flex flex-col justify-center items-center h-80 space-y-3 bg-white rounded-3xl border border-slate-200/80">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading your 3D creations...</p>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 p-4 rounded-2xl border border-rose-100 bg-rose-50 text-rose-600 text-sm font-semibold">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : designs.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm space-y-5">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 shadow-inner">
                  <Palette className="h-10 w-10" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h3 className="text-xl font-black text-slate-900">No Saved 3D Designs Yet</h3>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Use our interactive 3D Studio to place graphics, custom text fonts, and logos onto your apparel in real-time.
                  </p>
                </div>
                <a
                  href="/designer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition shadow-lg shadow-indigo-200"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Launch 3D Customizer</span>
                </a>
              </div>
            ) : viewMode === "showcase" && activeDesign ? (
              
              /* ========================================================================= */
              /* 3D SHOWCASE STUDIO MODE (INTERACTIVE LIVE STAGE + SELECTOR) */
              /* ========================================================================= */
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left 3D Stage Viewer (7 Columns) */}
                  <div className="lg:col-span-7 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl border border-slate-800 min-h-[460px] md:min-h-[520px]">
                    
                    {/* Glowing Backdrop */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 h-8 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />

                    {/* Top Bar Controls */}
                    <div className="relative z-10 flex items-center justify-between">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                        <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
                        Live 3D Customizer Stage
                      </span>

                      {/* Turntable Auto Spin */}
                      <button
                        onClick={() => setIsAutoRotating((prev) => !prev)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                          isAutoRotating
                            ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30"
                            : "bg-white/10 text-slate-300 border-white/15 hover:bg-white/20 hover:text-white"
                        }`}
                      >
                        <RotateCw className={`h-3.5 w-3.5 ${isAutoRotating ? "animate-spin" : ""}`} />
                        <span>{isAutoRotating ? "Auto-Spinning" : "Auto-Spin"}</span>
                      </button>
                    </div>

                    {/* Live 3D Scene */}
                    <div className="relative flex-1 w-full my-2 min-h-[320px]">
                      <Scene
                        modelPath={getModelPath(activeDesign)}
                        shirtColor={activeDesign.fabricColor || activeDesign.color || "#ffffff"}
                        activeSide={activeSide}
                        zoomLevel={zoomLevel}
                        layers={getLayersFromDesign(activeDesign)}
                        selectedLayerId={null}
                        onSelectLayer={() => {}}
                        onUpdateLayers={() => {}}
                        modelRotation={modelRotation}
                        orbitEnabled={true}
                      />

                      <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
                        <div className="w-48 h-3 rounded-full bg-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-indigo-400/30" />
                      </div>
                    </div>

                    {/* Bottom Controls */}
                    <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-2xl border border-white/10">
                        {[
                          { id: "front", label: "Front" },
                          { id: "back", label: "Back" },
                          { id: "left", label: "Left" },
                          { id: "right", label: "Right" },
                        ].map((side) => (
                          <button
                            key={side.id}
                            onClick={() => handleAngleChange(side.id)}
                            className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-xl transition cursor-pointer ${
                              activeSide === side.id && !isAutoRotating
                                ? "bg-indigo-600 text-white shadow-xs"
                                : "text-slate-300 hover:text-white hover:bg-white/10"
                            }`}
                          >
                            {side.label}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setSelected3DDesign(activeDesign);
                          setIs3DModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                      >
                        <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Inspect & Download</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Details & Layer Inspector (5 Columns) */}
                  <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-sm">
                    
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                            Custom Creation #{activeDesignIndex + 1}
                          </span>
                          <h3 className="text-xl font-black text-slate-900 mt-2 capitalize">
                            {activeDesign.tShirtType || activeDesign.title || "Custom Apparel"}
                          </h3>
                        </div>

                        <button
                          onClick={(e) => handleDeleteDesign(activeDesign._id, e)}
                          className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl transition cursor-pointer shadow-2xs"
                          title="Delete Design"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Specs Breakdown */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Fabric Color</span>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-slate-300 shadow-2xs"
                              style={{ backgroundColor: activeDesign.fabricColor || activeDesign.color || "#ffffff" }}
                            />
                            <span className="font-extrabold text-slate-800 capitalize">
                              {activeDesign.fabricColor || activeDesign.color || "White"}
                            </span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Apparel Material</span>
                          <span className="font-extrabold text-slate-800">
                            {activeDesign.material || "180GSM Cotton"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Selected Size</span>
                          <span className="font-extrabold text-slate-800">
                            {activeDesign.size || "M"}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-bold uppercase text-[10px]">Estimated Price</span>
                          <span className="font-black text-indigo-600">
                            Rs. {(activeDesign.estimatedCost || 24.99).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Attached Layers / Decals List */}
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-slate-500" />
                          Custom Layers & Decals ({getLayersFromDesign(activeDesign).length})
                        </h4>

                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {getLayersFromDesign(activeDesign).map((layer, idx) => (
                            <div
                              key={layer.id || idx}
                              className="p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs"
                            >
                              <div className="truncate pr-2">
                                <p className="font-extrabold text-slate-800 capitalize truncate">
                                  {layer.type}: {layer.name || `Layer ${idx + 1}`}
                                </p>
                                {layer.type === "text" && (
                                  <p className="text-[10px] text-slate-400 truncate italic">
                                    "{layer.text}"
                                  </p>
                                )}
                              </div>

                              {layer.url && layer.url !== "/images/dumyImage.png" && (
                                <a
                                  href={layer.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-600 transition flex items-center gap-1 shrink-0"
                                >
                                  <Download className="h-3 w-3" /> Asset
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-4 border-t border-slate-100">
                      <button
                        onClick={() => handleLoadDesign(activeDesign)}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit Design in 3D Customizer</span>
                      </button>

                      <button
                        onClick={() => {
                          setSelected3DDesign(activeDesign);
                          setIs3DModalOpen(true);
                        }}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="h-3.5 w-3.5 text-indigo-600" />
                        <span>Download 4-Angle Screenshots</span>
                      </button>
                    </div>

                  </div>

                </div>

                {/* Bottom Selector Carousel for Saved Designs */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Box className="h-3.5 w-3.5 text-indigo-600" />
                      Select Saved Creation to Preview ({designs.length})
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveDesignIndex((prev) => (prev > 0 ? prev - 1 : designs.length - 1))}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setActiveDesignIndex((prev) => (prev < designs.length - 1 ? prev + 1 : 0))}
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none snap-x">
                    {designs.map((d, idx) => {
                      const isActive = idx === activeDesignIndex;
                      return (
                        <div
                          key={d._id || idx}
                          onClick={() => setActiveDesignIndex(idx)}
                          className={`w-52 shrink-0 snap-start rounded-2xl border-2 p-3 bg-white transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                            isActive
                              ? "border-indigo-600 shadow-md ring-2 ring-indigo-100 -translate-y-1"
                              : "border-slate-200/80 hover:border-indigo-200 hover:-translate-y-0.5"
                          }`}
                        >
                          <div className="relative mb-2">
                            <Store3DCardPreview
                              product={d}
                              activeColor={d.fabricColor}
                              showControls={false}
                              hideBadge={true}
                              className="h-32 rounded-xl bg-slate-50"
                            />
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-indigo-600 uppercase">
                              {d.material || "180GSM"}
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 line-clamp-1 capitalize">
                              {d.tShirtType || d.title || "Custom T-Shirt"}
                            </h5>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs font-black text-slate-950">
                                Rs. {(d.estimatedCost || 24.99).toFixed(2)}
                              </span>
                              {isActive && (
                                <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  Active
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            ) : (

              /* ========================================================================= */
              /* 3D CARD GRID MODE */
              /* ========================================================================= */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {designs.map((design) => (
                  <div
                    key={design._id}
                    className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm hover:shadow-lg transition duration-200 flex flex-col justify-between space-y-4"
                  >
                    {/* 3D T-Shirt Card Preview with Front/Back/Side hover controls */}
                    <div className="relative mb-2">
                      <Store3DCardPreview
                        product={design}
                        activeColor={design.fabricColor}
                        onClick={() => {
                          setSelected3DDesign(design);
                          setIs3DModalOpen(true);
                        }}
                      />
                      <button
                        onClick={(e) => handleDeleteDesign(design._id, e)}
                        className="absolute top-2.5 right-2.5 z-40 p-2 bg-white/90 hover:bg-rose-600 text-slate-500 hover:text-white rounded-xl shadow-sm border border-slate-100 transition-all duration-200 cursor-pointer active:scale-95"
                        title="Delete Design"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-slate-900 text-sm capitalize">
                          {design.tShirtType || design.title || "Custom T-Shirt"}
                        </h4>
                        <span className="text-indigo-600 font-bold text-sm">
                          Rs. {(design.estimatedCost || 24.99).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">{design.material || "180GSM"}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">Size {design.size || "M"}</span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded-full">
                          {design.layers?.length || (design.thumbnailUrl ? 1 : 0)} Layers
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleLoadDesign(design)}
                        className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        Customize
                      </button>
                      <button
                        onClick={() => {
                          setSelected3DDesign(design);
                          setIs3DModalOpen(true);
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5 text-indigo-600" />
                        View 3D
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            )}

          </div>
        </main>
      </div>

      <Footer withSidebarOffset />

      {/* 3D Inspector Modal */}
      <TShirt3DModal
        isOpen={is3DModalOpen}
        onClose={() => {
          setIs3DModalOpen(false);
          setSelected3DDesign(null);
        }}
        design={selected3DDesign}
        onCustomize={(design) => handleLoadDesign(design)}
      />
    </div>
  );
}

