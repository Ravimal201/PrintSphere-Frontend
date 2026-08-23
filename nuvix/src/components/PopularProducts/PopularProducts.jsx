import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Star,
  Sparkles,
  X,
  Check,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  RefreshCw,
  ShoppingCart,
  Loader2,
  CheckCircle,
  Edit,
  ShoppingBag,
  SlidersHorizontal,
  ArrowRight,
  Filter,
} from "lucide-react";
import axios from "axios";
import Store3DCardPreview from "../Store3DCardPreview";
import Scene from "../../three/Scene";
import { API_BASE_URL } from "../../config/api";
import { resolveColorName, formatGsm } from "../../utils/colorHelper";

const fallbackProducts = [
  {
    _id: "fb-1",
    title: "Wolf Graphic Tee",
    basePrice: 24.99,
    discount: 0,
    averageRating: 4.7,
    ratingsCount: 18,
    category: "Graphic Tee",
    colors: ["#ffffff", "#111827", "#3b82f6"],
    sizes: ["S", "M", "L", "XL"],
    gsms: ["180", "200"],
    images: ["/images/dumyImage.png"],
    description: "Premium cotton wolf illustration tee with vivid print finish and ultra-breathable texture.",
  },
  {
    _id: "fb-2",
    title: "NOWIX Classic Tee",
    basePrice: 22.99,
    discount: 10,
    averageRating: 4.6,
    ratingsCount: 24,
    category: "Crew Neck",
    colors: ["#111827", "#ffffff", "#4b5563"],
    sizes: ["M", "L", "XL", "XXL"],
    gsms: ["180"],
    images: ["/images/dumyImage.png"],
    description: "Signature streetwear classic black tee with minimalist chest print and modern relaxed fit.",
  },
  {
    _id: "fb-3",
    title: "Splash Design Tee",
    basePrice: 23.99,
    discount: 15,
    averageRating: 4.8,
    ratingsCount: 32,
    category: "V-Neck",
    colors: ["#ffffff", "#93c5fd", "#dc2626"],
    sizes: ["S", "M", "L"],
    gsms: ["200"],
    images: ["/images/dumyImage.png"],
    description: "Abstract paint-splash dynamic artwork on soft combed ring-spun jersey cotton.",
  },
  {
    _id: "fb-4",
    title: "Neon Wolf Tee",
    basePrice: 25.99,
    discount: 0,
    averageRating: 4.9,
    ratingsCount: 45,
    category: "Oversized",
    colors: ["#111827", "#6d28d9", "#16a34a"],
    sizes: ["M", "L", "XL", "XXL"],
    gsms: ["220", "240"],
    images: ["/images/dumyImage.png"],
    description: "Cyberpunk neon wolf aesthetic heavyweight tee with reinforced ribbing and boxy silhouette.",
  },
];

const getModalModelPath = (product) => {
  if (!product) return "/images/models/male normal t-shirt1.glb";
  if (
    product.modelPath &&
    typeof product.modelPath === "string" &&
    (product.modelPath.toLowerCase().endsWith(".glb") ||
      product.modelPath.toLowerCase().endsWith(".gltf") ||
      product.modelPath.toLowerCase().endsWith(".fbx"))
  ) {
    return product.modelPath;
  }
  if (
    product.modelUrl &&
    typeof product.modelUrl === "string" &&
    (product.modelUrl.toLowerCase().endsWith(".glb") ||
      product.modelUrl.toLowerCase().endsWith(".gltf") ||
      product.modelUrl.toLowerCase().endsWith(".fbx"))
  ) {
    return product.modelUrl;
  }
  const title = (product.title || product.name || "").toLowerCase();
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

const getModalLayers = (product) => {
  if (!product) return [];
  if (product.layers && Array.isArray(product.layers) && product.layers.length > 0) {
    return product.layers;
  }
  const designImg = product.images?.[0] || product.thumbnailUrl || product.designUrl;
  if (designImg && designImg !== "/images/dumyImage.png") {
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

export default function PopularProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDot, setActiveDot] = useState(0);
  const scrollRef = useRef(null);
  const filterDropdownsRef = useRef(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All");
  const [selectedColor, setSelectedColor] = useState("All");
  const [openDropdown, setOpenDropdown] = useState(null); // 'category' | 'color' | 'size' | null

  // 3D Modal state
  const [selected3DProduct, setSelected3DProduct] = useState(null);
  const [modalColor, setModalColor] = useState("");
  const [modalSize, setModalSize] = useState("");
  const [modalGsm, setModalGsm] = useState("");
  const [modalQty, setModalQty] = useState(1);
  const [modalSide, setModalSide] = useState("front");
  const [modalZoom, setModalZoom] = useState(0.85);
  const [modalRotation, setModalRotation] = useState(0);
  const [modalAutoRotate, setModalAutoRotate] = useState(false);

  // User feedback toast state
  const [toastMessage, setToastMessage] = useState("");
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("printsphere_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  const toggleFavorite = (product, e) => {
    e.stopPropagation();
    const pid = product._id || product.title;
    let nextFavs;
    if (favorites.includes(pid)) {
      nextFavs = favorites.filter((id) => id !== pid);
      showToast(`Removed "${product.title || product.name}" from favorites`);
    } else {
      nextFavs = [...favorites, pid];
      showToast(`Added "${product.title || product.name}" to favorites! ❤️`);
    }
    setFavorites(nextFavs);
    localStorage.setItem("printsphere_favorites", JSON.stringify(nextFavs));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/auth/products`);
        if (Array.isArray(response.data) && response.data.length > 0) {
          setProducts(response.data);
        } else {
          setProducts(fallbackProducts);
        }
      } catch (err) {
        console.error("Error loading popular products, using fallbacks:", err);
        setProducts(fallbackProducts);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        filterDropdownsRef.current &&
        !filterDropdownsRef.current.contains(e.target)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initialize modal fields when product is selected
  useEffect(() => {
    if (selected3DProduct) {
      setModalColor(selected3DProduct.colors?.[0] || "#ffffff");
      setModalSize(selected3DProduct.sizes?.[0] || "M");
      setModalGsm(
        formatGsm(
          selected3DProduct.gsms?.[0] ||
            selected3DProduct.gsm ||
            "GSM 180"
        )
      );
      setModalQty(1);
      setModalSide("front");
      setModalZoom(0.85);
      setModalRotation(0);
      setModalAutoRotate(false);
    }
  }, [selected3DProduct]);

  // Extract unique filter lists from available products
  const allAvailableProducts = products.length > 0 ? products : fallbackProducts;
  
  const categoriesList = [
    "All",
    ...new Set(allAvailableProducts.map((p) => p.category).filter(Boolean)),
  ];

  const sizesList = ["All", "S", "M", "L", "XL", "XXL"];

  const colorsList = [
    "All",
    ...new Set(
      allAvailableProducts
        .flatMap((p) => p.colors || [])
        .filter(Boolean)
    ),
  ];

  // Filtering products
  const filteredProducts = allAvailableProducts.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSize =
      selectedSize === "All" || (product.sizes || []).includes(selectedSize);
    const matchesColor =
      selectedColor === "All" || (product.colors || []).includes(selectedColor);

    return matchesCategory && matchesSize && matchesColor;
  });

  const displayProducts = filteredProducts.slice(0, 12);
  const dotCount = Math.max(1, Math.ceil(displayProducts.length / 4));

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedSize !== "All" ||
    selectedColor !== "All";

  const clearAllFilters = () => {
    setSelectedCategory("All");
    setSelectedSize("All");
    setSelectedColor("All");
    setOpenDropdown(null);
  };

  // Carousel scroll handling
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const card = container.querySelector("[data-product-card]");
      if (!card) return;

      const cardWidth = card.getBoundingClientRect().width;
      const pageWidth = (cardWidth + 24) * 2;
      const nextIndex = Math.min(
        dotCount - 1,
        Math.round(container.scrollLeft / pageWidth)
      );
      setActiveDot(nextIndex);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [dotCount]);

  const scrollToDot = (dotIndex) => {
    const container = scrollRef.current;
    if (!container) return;

    const card = container.querySelector("[data-product-card]");
    if (!card) return;

    const cardWidth = card.getBoundingClientRect().width;
    const pageWidth = (cardWidth + 24) * 2;
    container.scrollTo({ left: dotIndex * pageWidth, behavior: "smooth" });
    setActiveDot(dotIndex);
  };

  const goPrev = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: "smooth" });
    }
  };

  const goNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: "smooth" });
    }
  };

  // Add to cart from 3D Detail Modal
  const handleAddToCart = () => {
    if (!selected3DProduct) return;

    const colorName = resolveColorName(modalColor);
    const formattedGsmVal = formatGsm(modalGsm);
    const cartKey = `${selected3DProduct._id || selected3DProduct.title}-${modalSize}-${colorName}-${formattedGsmVal}`;

    let currentCart = [];
    try {
      const saved = localStorage.getItem("printsphere_cart");
      if (saved) currentCart = JSON.parse(saved);
    } catch (e) {
      console.error("Cart read error:", e);
    }

    const existingIndex = currentCart.findIndex(
      (item) => item.cartKey === cartKey
    );
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += modalQty;
    } else {
      const finalUnitPrice = selected3DProduct.discount > 0
        ? selected3DProduct.basePrice * (1 - selected3DProduct.discount / 100)
        : selected3DProduct.basePrice;

      currentCart.push({
        cartKey,
        productId: selected3DProduct._id,
        title: selected3DProduct.title || selected3DProduct.name,
        tShirtStyle: selected3DProduct.category || "Crew Neck",
        basePrice: selected3DProduct.basePrice,
        discount: selected3DProduct.discount || 0,
        category: selected3DProduct.category,
        size: modalSize,
        color: colorName,
        gsm: formattedGsmVal,
        quantity: modalQty,
        image: selected3DProduct.images?.[0] || "/images/dumyImage.png",
      });
    }

    localStorage.setItem("printsphere_cart", JSON.stringify(currentCart));
    showToast(
      `Added ${modalQty}x "${selected3DProduct.title || selected3DProduct.name}" to cart!`
    );
    setSelected3DProduct(null);
  };

  const handleCustomizeDesign = () => {
    if (!selected3DProduct) return;
    const designToLoad = {
      ...selected3DProduct,
      fabricColor: modalColor,
      size: modalSize,
      gsm: modalGsm,
      layers: getModalLayers(selected3DProduct),
    };
    localStorage.setItem("load_custom_design", JSON.stringify(designToLoad));
    window.location.href = "/designer";
  };

  return (
    <section className="mb-10 rounded-4xl border border-slate-200/80 bg-white p-5 sm:p-7 lg:p-9 shadow-sm relative">
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="text-center select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Interactive 3D Catalog</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Popular Products
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-1">
          Explore top-rated designs with realistic 3D angles, custom fabric colors, and instant previews.
        </p>
        <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-indigo-600" />
      </div>

      {/* Filter and Action Bar */}
      <div
        ref={filterDropdownsRef}
        className="mt-8 flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-center lg:justify-between select-none"
      >
        {/* Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* ALL Button */}
          <button
            type="button"
            onClick={clearAllFilters}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition shadow-xs cursor-pointer ${
              !hasActiveFilters
                ? "bg-indigo-600 text-white shadow-indigo-200 shadow-md ring-2 ring-indigo-200"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            All Products
          </button>

          {/* CATEGORY Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === "category" ? null : "category")
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedCategory !== "All"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>
                {selectedCategory !== "All"
                  ? `Category: ${selectedCategory}`
                  : "Category"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                  openDropdown === "category" ? "rotate-180 text-indigo-600" : ""
                }`}
              />
            </button>

            {openDropdown === "category" && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {categoriesList.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span className="truncate">{cat === "All" ? "All Categories" : cat}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLOR Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === "color" ? null : "color")
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedColor !== "All"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {selectedColor !== "All" && (
                <span
                  className="h-3 w-3 rounded-full border border-slate-300 inline-block shadow-2xs"
                  style={{ backgroundColor: selectedColor }}
                />
              )}
              <span>
                {selectedColor !== "All"
                  ? `Color: ${resolveColorName(selectedColor)}`
                  : "Color"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                  openDropdown === "color" ? "rotate-180 text-indigo-600" : ""
                }`}
              />
            </button>

            {openDropdown === "color" && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {colorsList.map((col) => {
                    const isSelected = selectedColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => {
                          setSelectedColor(col);
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {col !== "All" ? (
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0 shadow-2xs"
                              style={{ backgroundColor: col }}
                            />
                          ) : (
                            <span className="h-3.5 w-3.5 rounded-full border border-dashed border-slate-400 shrink-0" />
                          )}
                          <span className="truncate">
                            {col === "All" ? "All Colors" : resolveColorName(col)}
                          </span>
                        </div>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SIZE Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setOpenDropdown(openDropdown === "size" ? null : "size")
              }
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-bold transition shadow-2xs cursor-pointer ${
                selectedSize !== "All"
                  ? "border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span>
                {selectedSize !== "All" ? `Size: ${selectedSize}` : "Size"}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                  openDropdown === "size" ? "rotate-180 text-indigo-600" : ""
                }`}
              />
            </button>

            {openDropdown === "size" && (
              <div className="absolute left-0 top-full mt-1.5 z-40 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="space-y-1">
                  {sizesList.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setSelectedSize(sz);
                          setOpenDropdown(null);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white"
                            : "text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <span>{sz === "All" ? "All Sizes" : `Size ${sz}`}</span>
                        {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* View All Store link */}
        <a
          href="/store"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-600 transition hover:text-indigo-700 hover:translate-x-0.5 group"
        >
          <span>Explore Entire Store</span>
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </a>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 select-none">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Active Filters:
          </span>

          {selectedCategory !== "All" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              Category: {selectedCategory}
              <button
                type="button"
                onClick={() => setSelectedCategory("All")}
                className="hover:text-indigo-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedColor !== "All" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              Color: {resolveColorName(selectedColor)}
              <button
                type="button"
                onClick={() => setSelectedColor("All")}
                className="hover:text-indigo-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {selectedSize !== "All" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
              Size: {selectedSize}
              <button
                type="button"
                onClick={() => setSelectedSize("All")}
                className="hover:text-indigo-900 cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={clearAllFilters}
            className="text-xs font-bold text-rose-500 hover:text-rose-700 ml-1 cursor-pointer underline"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Products Grid & Horizontal Carousel Container */}
      <div className="mt-6 relative select-none">
        {/* Navigation Arrow Left */}
        {displayProducts.length > 0 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous products"
            className="absolute -left-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 backdrop-blur-md p-2.5 text-slate-700 shadow-md transition hover:scale-110 hover:border-indigo-300 hover:text-indigo-600 md:inline-flex cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {displayProducts.length > 0 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next products"
            className="absolute -right-3 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white/95 backdrop-blur-md p-2.5 text-slate-700 shadow-md transition hover:scale-110 hover:border-indigo-300 hover:text-indigo-600 md:inline-flex cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Loading 3D Popular Collection...
            </p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-3xl bg-slate-50 border border-dashed border-slate-200">
            <ShoppingBag className="h-10 w-10 text-slate-300 mx-auto mb-2.5" />
            <h3 className="text-sm font-bold text-slate-800">
              No products found matching filters
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try removing some active category, size, or color filters to view more items.
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-xs cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto pb-4 pt-1 px-1 scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 xl:grid-cols-4 md:overflow-visible md:pb-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {displayProducts.map((product) => {
              const pid = product._id || product.title;
              const isFav = favorites.includes(pid);
              const hasDiscount = product.discount > 0;
              const finalPrice = hasDiscount
                ? product.basePrice * (1 - product.discount / 100)
                : product.basePrice;

              const ratingCount = product.ratingsCount || 0;
              const ratingVal =
                ratingCount > 0
                  ? product.averageRating
                    ? product.averageRating.toFixed(1)
                    : "0.0"
                  : "0 review";

              const categoryName = product.category || "T-Shirt";

              return (
                <article
                  key={pid}
                  data-product-card
                  onClick={() => setSelected3DProduct(product)}
                  className="w-72 shrink-0 snap-start md:w-auto md:shrink group rounded-3xl border border-slate-200/80 bg-white p-3.5 shadow-xs transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-indigo-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    {/* Top Row: Category badge & Favorite Button */}
                    <div className="flex items-center justify-between px-1 pb-2">
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-indigo-600">
                        {categoryName}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(product, e)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border transition cursor-pointer ${
                          isFav
                            ? "bg-rose-50 border-rose-200 text-rose-600"
                            : "border-slate-200 bg-white text-slate-400 hover:border-rose-200 hover:text-rose-600"
                        }`}
                        aria-label="Toggle favorite"
                        title={isFav ? "Remove favorite" : "Add to favorites"}
                      >
                        <Heart
                          className={`h-4 w-4 ${isFav ? "fill-rose-500 text-rose-500" : ""}`}
                        />
                      </button>
                    </div>

                    {/* 3D T-Shirt Card Preview with Front/Back/Side hover controls */}
                    <div className="relative">
                      <Store3DCardPreview
                        product={product}
                        activeColor={
                          selectedColor !== "All"
                            ? selectedColor
                            : product.colors?.[0]
                        }
                        onClick={() => setSelected3DProduct(product)}
                        className="rounded-2xl h-52 w-full"
                      />
                      {hasDiscount && (
                        <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-xs z-20 pointer-events-none">
                          {product.discount}% Off
                        </span>
                      )}
                    </div>

                    {/* Product Details info */}
                    <div className="mt-3.5 px-1 space-y-1.5">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-1">
                        {product.title || product.name}
                      </h3>

                      {product.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed min-h-[2rem]">
                          {product.description}
                        </p>
                      )}

                      {/* Ratings & Price */}
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-slate-950">
                            Rs. {finalPrice ? finalPrice.toFixed(2) : "0.00"}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-slate-400 line-through">
                              Rs. {product.basePrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-amber-500 text-xs">
                          <Star
                            className={`h-3.5 w-3.5 ${
                              ratingCount > 0
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300"
                            }`}
                          />
                          <span
                            className={`text-xs ${
                              ratingCount > 0
                                ? "font-bold text-slate-800"
                                : "text-slate-400 font-medium text-[11px]"
                            }`}
                          >
                            {ratingVal}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            ({ratingCount})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Button: View Details & 3D */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 px-1">
                      <span>Sizes: {(product.sizes || ["S", "M", "L"]).join(", ")}</span>
                      <span className="text-indigo-600">
                        GSM: {(product.gsms || []).join(", ") || product.gsm || "180"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelected3DProduct(product)}
                      className="w-full py-2 bg-slate-900 group-hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                      <span>View Details & 3D</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination Dots (Mobile) */}
      {displayProducts.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-2 md:hidden select-none">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous products"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {Array.from({ length: dotCount }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollToDot(index)}
              aria-label={`Go to product group ${index + 1}`}
              className={`h-2 rounded-full transition-all ${
                index === activeDot ? "w-6 bg-indigo-600" : "w-2 bg-slate-300"
              }`}
            />
          ))}

          <button
            type="button"
            onClick={goNext}
            aria-label="Next products"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-xs"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Interactive 3D Product Detail Modal */}
      {selected3DProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px] select-none animate-in fade-in zoom-in-95 duration-200">
            {/* Left 3D Canvas Panel */}
            <div className="flex-1 bg-slate-50 relative flex flex-col justify-between p-5 border-b md:border-b-0 md:border-r border-slate-200">
              {/* Top Left Info Badge */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
                <span className="px-3 py-1 bg-indigo-50/90 backdrop-blur-md border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
                  Interactive 3D Viewer
                </span>
                <span className="text-[10px] text-slate-400 font-bold pl-1">
                  Drag to rotate • Wheel to zoom
                </span>
              </div>

              {/* Top Right Preset Angle Buttons */}
              <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-xs">
                {[
                  { id: "front", label: "Front", rot: 0 },
                  { id: "side", label: "Side", rot: Math.PI / 2 },
                  { id: "back", label: "Back", rot: Math.PI },
                ].map((view) => {
                  const isActive = modalSide === view.id && !modalAutoRotate;
                  return (
                    <button
                      key={view.id}
                      type="button"
                      onClick={() => {
                        setModalSide(view.id);
                        setModalRotation(view.rot);
                        setModalAutoRotate(false);
                      }}
                      className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {view.label}
                    </button>
                  );
                })}
              </div>

              {/* 3D Scene Viewport */}
              <div className="w-full flex-1 relative min-h-[280px] md:min-h-0">
                <Scene
                  modelPath={getModalModelPath(selected3DProduct)}
                  shirtColor={modalColor}
                  activeSide={modalSide}
                  zoomLevel={modalZoom}
                  layers={getModalLayers(selected3DProduct)}
                  selectedLayerId={null}
                  onSelectLayer={() => {}}
                  onUpdateLayers={() => {}}
                  modelRotation={modalRotation}
                  orbitEnabled={true}
                  autoRotate={modalAutoRotate}
                />
              </div>

              {/* Controls Toolbar (Zoom & Rotate) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 z-20 shadow-md">
                {/* Zoom */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                    Zoom
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setModalZoom((prev) =>
                        Math.max(0.5, parseFloat((prev - 0.1).toFixed(2)))
                      )
                    }
                    className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 rounded-lg transition border border-slate-200 cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>

                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={modalZoom}
                    onChange={(e) => setModalZoom(parseFloat(e.target.value))}
                    className="w-20 accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setModalZoom((prev) =>
                        Math.min(1.5, parseFloat((prev + 0.1).toFixed(2)))
                      )
                    }
                    className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 rounded-lg transition border border-slate-200 cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>

                  <span className="text-[10px] font-black text-slate-800 min-w-[2.2rem] text-center">
                    {Math.round(modalZoom * 100)}%
                  </span>
                </div>

                {/* Divider */}
                <div className="h-4 w-px bg-slate-200 hidden sm:block" />

                {/* Rotate Buttons */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Rotate
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setModalRotation((prev) => prev - Math.PI / 4);
                      setModalAutoRotate(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 rounded-lg transition border border-slate-200 cursor-pointer"
                    title="Rotate Left 45°"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalRotation((prev) => prev + Math.PI / 4);
                      setModalAutoRotate(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 rounded-lg transition border border-slate-200 cursor-pointer"
                    title="Rotate Right 45°"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalAutoRotate((prev) => !prev)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition flex items-center gap-1 cursor-pointer ${
                      modalAutoRotate
                        ? "bg-indigo-600 text-white border-indigo-700 shadow-xs"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                    title="Toggle Auto 360° Spin"
                  >
                    <RotateCw
                      className={`h-3 w-3 ${modalAutoRotate ? "animate-spin" : ""}`}
                    />
                    <span>{modalAutoRotate ? "Spinning" : "Auto-Rotate"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setModalSide("front");
                      setModalRotation(0);
                      setModalZoom(0.85);
                      setModalAutoRotate(false);
                    }}
                    className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition border border-slate-200 cursor-pointer"
                    title="Reset 3D View"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Product Details & Settings Panel */}
            <div className="w-full md:w-[400px] flex flex-col justify-between p-6 bg-white overflow-y-auto">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                      {selected3DProduct.category || "T-Shirt"}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
                      {selected3DProduct.title || selected3DProduct.name}
                    </h3>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => {
                          const ratingVal =
                            selected3DProduct.averageRating || 0;
                          return (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${
                                s <= Math.round(ratingVal) && ratingVal > 0
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-slate-200"
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-xs font-black text-slate-800">
                        {selected3DProduct.ratingsCount > 0
                          ? selected3DProduct.averageRating
                            ? selected3DProduct.averageRating.toFixed(1)
                            : "0.0"
                          : "0 review"}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">
                        ({selected3DProduct.ratingsCount || 0})
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelected3DProduct(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Price block */}
                <div className="flex items-baseline gap-2 pb-3.5 border-b border-slate-100">
                  {selected3DProduct.discount > 0 ? (
                    <>
                      <span className="text-2xl font-black text-slate-950">
                        Rs.{" "}
                        {(
                          selected3DProduct.basePrice *
                          (1 - selected3DProduct.discount / 100)
                        ).toFixed(2)}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        Rs. {selected3DProduct.basePrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase ml-1">
                        {selected3DProduct.discount}% Off
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-slate-950">
                      Rs. {selected3DProduct.basePrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Description */}
                {selected3DProduct.description && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Description
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selected3DProduct.description}
                    </p>
                  </div>
                )}

                {/* Color Selector */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Select Fabric Color
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {resolveColorName(modalColor)}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {(selected3DProduct.colors || ["#ffffff", "#111827", "#3b82f6"]).map((col) => {
                      const isSelected = modalColor === col;
                      return (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setModalColor(col)}
                          className={`w-7 h-7 rounded-full border shadow-xs relative transition hover:scale-105 cursor-pointer ${
                            isSelected
                              ? "ring-2 ring-indigo-600 ring-offset-2 border-transparent"
                              : "border-slate-300"
                          }`}
                          style={{ backgroundColor: col }}
                          title={resolveColorName(col)}
                        >
                          {isSelected && (
                            <span className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Size Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select Size
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(selected3DProduct.sizes || ["S", "M", "L", "XL"]).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setModalSize(sz)}
                        className={`w-9 h-9 text-xs font-bold rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          modalSize === sz
                            ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {sz}
                      </button>
                    ))}
                  </div>
                </div>

                {/* GSM Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select Fabric GSM
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(selected3DProduct.gsms && selected3DProduct.gsms.length > 0
                      ? selected3DProduct.gsms
                      : [selected3DProduct.gsm || "180"]
                    ).map((gsmVal) => {
                      const formatted = formatGsm(gsmVal);
                      const isSelected = modalGsm === formatted;
                      return (
                        <button
                          key={gsmVal}
                          type="button"
                          onClick={() => setModalGsm(formatted)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-700 text-white shadow-xs"
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          {formatted}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quantity
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                        className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 font-bold transition"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-black text-slate-900 min-w-[2rem] text-center">
                        {modalQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalQty((q) => q + 1)}
                        className="px-2.5 py-1 text-slate-600 hover:text-indigo-600 font-bold transition"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 border-t border-slate-100 flex flex-col gap-2.5 select-none">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCustomizeDesign}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5 text-indigo-600" />
                    <span>Customize</span>
                  </button>

                  <a
                    href="/store"
                    className="py-2.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <span>Store Page</span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}