import { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import {
  Sparkles,
  Eye,
  Edit,
  RotateCw,
  ShoppingBag,
  Star,
  ChevronLeft,
  ChevronRight,
  Heart,
  Layers,
  Flame,
  LayoutGrid,
  Box,
  Check,
  ArrowRight,
  Maximize2
} from "lucide-react";
import Scene from "../../three/Scene";
import Store3DCardPreview from "../Store3DCardPreview";
import TShirt3DModal from "../TShirt3DModal";
import { API_BASE_URL } from "../../config/api";

const PRESET_COLORS = [
  { name: "White", hex: "#ffffff", border: "border-slate-300" },
  { name: "Black", hex: "#111827", border: "border-slate-800" },
  { name: "Charcoal", hex: "#374151", border: "border-slate-600" },
  { name: "Navy Blue", hex: "#1e3a8a", border: "border-blue-900" },
  { name: "Crimson Red", hex: "#dc2626", border: "border-red-600" },
  { name: "Forest Green", hex: "#15803d", border: "border-emerald-700" },
  { name: "Gold Yellow", hex: "#f59e0b", border: "border-amber-500" },
  { name: "Pastel Pink", hex: "#f472b6", border: "border-pink-400" },
];

const fallbackProducts = [
  {
    _id: "fb-1",
    title: "Wolf Cyberpunk Graphic Tee",
    name: "Wolf Cyberpunk Graphic Tee",
    basePrice: 24.99,
    price: "Rs. 24.99",
    rating: 4.8,
    averageRating: 4.8,
    ratingsCount: 42,
    discount: 15,
    category: "Graphic",
    colors: ["#ffffff", "#111827", "#1e3a8a"],
    images: ["/images/dumyImage.png"],
    tShirtType: "male normal t-shirt",
    material: "180GSM Combed Cotton",
    layers: [
      {
        id: "wolf-logo",
        type: "image",
        name: "Cyber Wolf Decal",
        url: "/images/dumyImage.png",
        visible: true,
        position: [0, 0.1, 0.15],
        scale: [0.38, 0.38, 0.38],
      }
    ]
  },
  {
    _id: "fb-2",
    title: "NOWIX Classic Streetwear Tee",
    name: "NOWIX Classic Streetwear Tee",
    basePrice: 22.99,
    price: "Rs. 22.99",
    rating: 4.7,
    averageRating: 4.7,
    ratingsCount: 38,
    discount: 0,
    category: "Oversized",
    colors: ["#111827", "#374151", "#ffffff"],
    images: ["/images/dumyImage.png"],
    tShirtType: "oversized t-sdirt1",
    material: "240GSM Heavyweight Cotton",
  },
  {
    _id: "fb-3",
    title: "Neon Splash Urban Edition",
    name: "Neon Splash Urban Edition",
    basePrice: 26.99,
    price: "Rs. 26.99",
    rating: 4.9,
    averageRating: 4.9,
    ratingsCount: 56,
    discount: 20,
    category: "Casual",
    colors: ["#1e3a8a", "#111827", "#dc2626"],
    images: ["/images/dumyImage.png"],
    tShirtType: "long_sleeve_t-_shirt",
    material: "Premium Organic Cotton",
  },
  {
    _id: "fb-4",
    title: "Minimalist Geometry Tee",
    name: "Minimalist Geometry Tee",
    basePrice: 21.99,
    price: "Rs. 21.99",
    rating: 4.6,
    averageRating: 4.6,
    ratingsCount: 19,
    discount: 10,
    category: "Minimal",
    colors: ["#ffffff", "#f472b6", "#374151"],
    images: ["/images/dumyImage.png"],
    tShirtType: "female normal t-shirt",
    material: "180GSM Ring-Spun Cotton",
  },
];

const getModelPath = (product) => {
  if (!product) return "/images/models/male normal t-shirt1.glb";
  if (product.modelPath && typeof product.modelPath === "string" && (product.modelPath.endsWith(".glb") || product.modelPath.endsWith(".gltf") || product.modelPath.endsWith(".fbx"))) {
    return product.modelPath;
  }
  if (product.modelUrl && typeof product.modelUrl === "string" && (product.modelUrl.endsWith(".glb") || product.modelUrl.endsWith(".gltf") || product.modelUrl.endsWith(".fbx"))) {
    return product.modelUrl;
  }
  const textStr = (
    product.tShirtType ||
    product.shirtType ||
    product.type ||
    product.model ||
    product.title ||
    product.name ||
    product.category ||
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

const getLayersFromProduct = (product) => {
  if (!product) return [];
  if (product.layers && Array.isArray(product.layers) && product.layers.length > 0) {
    return product.layers.map((l, idx) => ({
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
  const designImg = product.images?.[0] || product.thumbnailUrl || product.designUrl;
  if (designImg && designImg !== "/images/dumyImage.png") {
    return [
      {
        id: "logo-layer",
        type: "image",
        name: "Graphic Decal",
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

export default function PopularProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewMode, setViewMode] = useState("showroom"); // "showroom" | "grid"

  // Active product featured in the 3D Virtual Showroom Stage
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [activeSide, setActiveSide] = useState("front");
  const [modelRotation, setModelRotation] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.85);

  // 3D Modal Inspector
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectProduct, setInspectProduct] = useState(null);

  // Favorites tracking
  const [favorites, setFavorites] = useState(new Set());

  // Carousel ref
  const carouselRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/products`);
        if (response.data && response.data.length > 0) {
          setProducts(response.data);
        } else {
          setProducts(fallbackProducts);
        }
      } catch (err) {
        console.warn("Could not load products from API, using defaults:", err);
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const displayProducts = useMemo(() => {
    const list = products.length > 0 ? products : fallbackProducts;
    if (activeCategory === "All") return list;
    return list.filter((p) => {
      const cat = (p.category || "").toLowerCase();
      const title = (p.title || p.name || "").toLowerCase();
      const target = activeCategory.toLowerCase();
      return cat.includes(target) || title.includes(target);
    });
  }, [products, activeCategory]);

  const activeProduct = displayProducts[featuredIndex] || displayProducts[0] || fallbackProducts[0];

  // Sync color when active product changes
  useEffect(() => {
    if (activeProduct) {
      const firstColor = activeProduct.colors?.[0] || activeProduct.fabricColor || "#ffffff";
      setSelectedColor(firstColor);
      setActiveSide("front");
      setModelRotation(0);
    }
  }, [featuredIndex, activeCategory]);

  // Turn table auto spin handler
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

  const handleCustomizeProduct = (product, color) => {
    const designPayload = {
      ...product,
      fabricColor: color || selectedColor,
      color: color || selectedColor,
      title: product.title || product.name,
      tShirtType: product.tShirtType || product.category || "male normal t-shirt",
      modelPath: getModelPath(product),
      layers: getLayersFromProduct(product),
    };
    localStorage.setItem("load_custom_design", JSON.stringify(designPayload));
    window.location.href = "/designer";
  };

  const toggleFavorite = (id, e) => {
    e?.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categories = ["All", "Graphic", "Oversized", "Casual", "Minimal", "Hoodies"];

  // Price calculations
  const isDbProduct = Boolean(activeProduct?._id && !activeProduct._id.startsWith("fb-"));
  const hasDiscount = activeProduct?.discount > 0;
  const finalPrice = hasDiscount
    ? activeProduct.basePrice * (1 - (activeProduct.discount || 0) / 100)
    : activeProduct?.basePrice || 24.99;

  return (
    <section className="mb-12 rounded-4xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-6 lg:p-8 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider mb-2">
            <Flame className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            3D Virtual Apparel Store
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Popular T-Shirt Designs
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Explore and interact with trending apparel in our real-time 3D showroom.
          </p>
        </div>

        {/* View Mode & Filter Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Mode Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setViewMode("showroom")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === "showroom"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Box className="h-3.5 w-3.5" />
              <span>3D Showroom</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                viewMode === "grid"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>3D Grid</span>
            </button>
          </div>

          <a
            href="/store"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <span>Full Store</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat);
              setFeaturedIndex(0);
            }}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: 3D VIRTUAL SHOWROOM EXPERIENCE (FEATURED STAGE + PRODUCT TRAY) */}
      {/* ========================================================================= */}
      {viewMode === "showroom" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left 3D Stage Viewer (7 Columns) */}
            <div className="lg:col-span-7 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl border border-slate-800 min-h-[440px] md:min-h-[500px]">
              
              {/* Luxury Ambient Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-64 h-8 bg-indigo-400/20 rounded-full blur-xl pointer-events-none" />

              {/* Stage Top Bar Controls */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/15 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                    <Sparkles className="h-3 w-3 text-indigo-400 animate-pulse" />
                    3D Spotlight Stage
                  </span>
                  {hasDiscount && (
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white rounded-full text-[10px] font-black uppercase tracking-wide">
                      {activeProduct.discount}% OFF
                    </span>
                  )}
                </div>

                {/* 360 Turntable Auto-spin button */}
                <button
                  onClick={() => setIsAutoRotating((prev) => !prev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                    isAutoRotating
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/30"
                      : "bg-white/10 text-slate-300 border-white/15 hover:bg-white/20 hover:text-white"
                  }`}
                  title="Toggle continuous 360° rotation"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isAutoRotating ? "animate-spin" : ""}`} />
                  <span>{isAutoRotating ? "Auto-Spinning" : "Auto-Spin"}</span>
                </button>
              </div>

              {/* 3D Scene Viewport Canvas */}
              <div className="relative flex-1 w-full my-2 min-h-[300px]">
                <Scene
                  modelPath={getModelPath(activeProduct)}
                  shirtColor={selectedColor}
                  activeSide={activeSide}
                  zoomLevel={zoomLevel}
                  layers={getLayersFromProduct(activeProduct)}
                  selectedLayerId={null}
                  onSelectLayer={() => {}}
                  onUpdateLayers={() => {}}
                  modelRotation={modelRotation}
                  orbitEnabled={true}
                />

                {/* Pedestal Base Ring Graphic */}
                <div className="absolute bottom-2 inset-x-0 flex justify-center pointer-events-none">
                  <div className="w-48 h-3 rounded-full bg-indigo-500/20 shadow-[0_0_25px_rgba(99,102,241,0.5)] border border-indigo-400/30" />
                </div>
              </div>

              {/* Stage Bottom Floating Controls */}
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* Angle Presets */}
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

                {/* Inspect 3D Modal Action */}
                <button
                  onClick={() => {
                    setInspectProduct({
                      ...activeProduct,
                      fabricColor: selectedColor,
                    });
                    setInspectModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/15 transition flex items-center gap-1.5 cursor-pointer backdrop-blur-md"
                >
                  <Maximize2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span>Full 3D Inspector</span>
                </button>
              </div>
            </div>

            {/* Right Product Specs & Interactive Customizer Panel (5 Columns) */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                {/* Category & Favorite */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                    {activeProduct.category || "Popular Style"}
                  </span>

                  <button
                    onClick={(e) => toggleFavorite(activeProduct._id, e)}
                    className={`h-9 w-9 rounded-full border flex items-center justify-center transition cursor-pointer ${
                      favorites.has(activeProduct._id)
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "bg-white border-slate-200 text-slate-400 hover:text-rose-500"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${favorites.has(activeProduct._id) ? "fill-rose-600" : ""}`} />
                  </button>
                </div>

                {/* Title & Price */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug capitalize">
                    {activeProduct.title || activeProduct.name}
                  </h3>
                  
                  {/* Ratings */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-black text-slate-800">
                      {activeProduct.averageRating ? activeProduct.averageRating.toFixed(1) : activeProduct.rating || "4.8"}
                    </span>
                    <span className="text-xs text-slate-400">
                      ({activeProduct.ratingsCount || 24} customer reviews)
                    </span>
                  </div>

                  {/* Price Tag */}
                  <div className="flex items-baseline gap-2.5 mt-3">
                    <span className="text-2xl font-black text-slate-950">
                      Rs. {finalPrice.toFixed(2)}
                    </span>
                    {hasDiscount && (
                      <span className="text-sm font-semibold text-slate-400 line-through">
                        Rs. {(activeProduct.basePrice || 29.99).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Material & Specs */}
                <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Apparel Cut</span>
                    <span className="font-extrabold text-slate-800 capitalize">
                      {(activeProduct.tShirtType || "Standard Crewneck").replace(/[-_]/g, " ")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Fabric Quality</span>
                    <span className="font-extrabold text-slate-800">
                      {activeProduct.material || "100% Bio-Washed Cotton"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Print Technology</span>
                    <span className="font-extrabold text-indigo-600">High-Res Direct to Film (DTF)</span>
                  </div>
                </div>

                {/* Dynamic 3D Color Swatch Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                      Fabric Color Simulator
                    </label>
                    <span className="text-xs font-bold text-indigo-600 capitalize">
                      {PRESET_COLORS.find((c) => c.hex.toLowerCase() === selectedColor.toLowerCase())?.name || "Selected"}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_COLORS.map((c) => {
                      const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                      return (
                        <button
                          key={c.hex}
                          onClick={() => setSelectedColor(c.hex)}
                          className={`h-7 w-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                            c.border
                          } ${
                            isSelected
                              ? "ring-2 ring-indigo-600 ring-offset-2 scale-110 shadow-sm"
                              : "hover:scale-105 opacity-85 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {isSelected && (
                            <Check
                              className={`h-3.5 w-3.5 ${
                                c.hex === "#ffffff" || c.hex === "#f59e0b" || c.hex === "#f472b6"
                                  ? "text-slate-900"
                                  : "text-white"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleCustomizeProduct(activeProduct, selectedColor)}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-sm font-bold rounded-2xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  <span>Customize this Design in 3D</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setInspectProduct({
                        ...activeProduct,
                        fabricColor: selectedColor,
                      });
                      setInspectModalOpen(true);
                    }}
                    className="py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Inspect 3D</span>
                  </button>

                  <a
                    href="/store"
                    className="py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                  >
                    <ShoppingBag className="h-3.5 w-3.5" />
                    <span>Buy in Store</span>
                  </a>
                </div>
              </div>

            </div>

          </div>

          {/* Synchronized Bottom Product Selector Carousel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-indigo-600" />
                Select Apparel to Spotlight on 3D Stage ({displayProducts.length})
              </h4>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFeaturedIndex((prev) => (prev > 0 ? prev - 1 : displayProducts.length - 1))}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  title="Previous Design"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setFeaturedIndex((prev) => (prev < displayProducts.length - 1 ? prev + 1 : 0))}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition cursor-pointer"
                  title="Next Design"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div
              ref={carouselRef}
              className="flex gap-4 overflow-x-auto pb-3 scrollbar-none scroll-smooth snap-x"
            >
              {displayProducts.map((prod, idx) => {
                const isActive = idx === featuredIndex;
                const pPrice = prod.discount > 0
                  ? prod.basePrice * (1 - prod.discount / 100)
                  : prod.basePrice || 24.99;

                return (
                  <div
                    key={prod._id || idx}
                    onClick={() => setFeaturedIndex(idx)}
                    className={`w-52 shrink-0 snap-start rounded-2xl border-2 p-3 bg-white transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                      isActive
                        ? "border-indigo-600 shadow-md ring-2 ring-indigo-100 -translate-y-1"
                        : "border-slate-200/80 hover:border-indigo-200 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="relative mb-2">
                      <Store3DCardPreview
                        product={prod}
                        activeColor={prod.colors?.[0] || "#ffffff"}
                        showControls={false}
                        hideBadge={true}
                        className="h-32 rounded-xl bg-slate-50"
                      />
                      {prod.discount > 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase">
                          {prod.discount}% Off
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-indigo-600 uppercase">
                        {prod.category || "Style"}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {prod.title || prod.name}
                      </h5>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-black text-slate-950">
                          Rs. {pPrice.toFixed(2)}
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
      )}

      {/* ========================================================================= */}
      {/* MODE 2: 3D GRID BOUTIQUE (FULL RESPONSIVE 3D CARD STORE GRID) */}
      {/* ========================================================================= */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pt-2">
          {displayProducts.map((product) => {
            const hasDiscount = product.discount > 0;
            const pFinalPrice = hasDiscount
              ? product.basePrice * (1 - (product.discount || 0) / 100)
              : product.basePrice || 24.99;
            const cardColor = product.colors?.[0] || "#ffffff";

            return (
              <article
                key={product._id}
                className="group bg-white border border-slate-200/80 rounded-3xl p-4 shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between select-none"
              >
                <div>
                  {/* 3D T-Shirt Card Preview with Front/Back/Side hover controls */}
                  <div className="relative mb-3.5">
                    <Store3DCardPreview
                      product={product}
                      activeColor={cardColor}
                      onClick={() => {
                        setInspectProduct(product);
                        setInspectModalOpen(true);
                      }}
                    />
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-xs z-20 pointer-events-none">
                        {product.discount}% Off
                      </span>
                    )}

                    <button
                      onClick={(e) => toggleFavorite(product._id, e)}
                      className={`absolute top-2 right-2 z-20 h-7 w-7 rounded-full border flex items-center justify-center transition cursor-pointer ${
                        favorites.has(product._id)
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-white/90 border-slate-200 text-slate-400 hover:text-rose-500"
                      }`}
                    >
                      <Heart className={`h-3.5 w-3.5 ${favorites.has(product._id) ? "fill-rose-600" : ""}`} />
                    </button>
                  </div>

                  {/* Card Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                        {product.category || "Casual"}
                      </span>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-extrabold text-slate-800">
                          {product.averageRating ? product.averageRating.toFixed(1) : product.rating || "4.8"}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-tight line-clamp-1">
                      {product.title || product.name}
                    </h4>

                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black text-slate-950">
                        Rs. {pFinalPrice.toFixed(2)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[11px] font-semibold text-slate-400 line-through">
                          Rs. {(product.basePrice || 29.99).toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleCustomizeProduct(product, cardColor)}
                    className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span>Customize</span>
                  </button>

                  <button
                    onClick={() => {
                      setInspectProduct(product);
                      setInspectModalOpen(true);
                    }}
                    className="py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Open full 3D viewer"
                  >
                    <Eye className="h-3.5 w-3.5 text-indigo-600" />
                    <span>3D</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* 3D Modal Inspector */}
      <TShirt3DModal
        isOpen={inspectModalOpen}
        onClose={() => {
          setInspectModalOpen(false);
          setInspectProduct(null);
        }}
        design={inspectProduct}
        onCustomize={(prod) => handleCustomizeProduct(prod, prod?.fabricColor || selectedColor)}
      />

    </section>
  );
}