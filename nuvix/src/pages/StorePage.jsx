import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Filter,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
  Plus,
  Minus,
  Star,
  Heart,
  Sparkles,
  Check,
  ChevronRight,
  AlertCircle,
  ShoppingBag,
  Loader2,
  CheckCircle,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import Scene from "../three/Scene";
import TShirt2D from "../components/TShirt2D";
import Store3DCardPreview from "../components/Store3DCardPreview";
import { API_BASE_URL } from "../config/api";
import { resolveColorName, formatGsm } from "../utils/colorHelper";

const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem("printsphere_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
    localStorage.setItem("printsphere_session_id", sessionId);
  }
  return sessionId;
};

const logUserActivity = async (actionData, onLogged) => {
  try {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const sessionId = getOrCreateSessionId();
    await axios.post(
      `${API_BASE_URL}/auth/activity`,
      {
        ...actionData,
        sessionId,
      },
      { headers }
    );
    if (onLogged) onLogged();
  } catch (err) {
    console.error("Activity logging error:", err);
  }
};

export default function StorePage() {
  const isManagerPreview =
    new URLSearchParams(window.location.search).get("preview") === "manager";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Recommendations state
  const [popularProducts, setPopularProducts] = useState([]);
  const [frequentlyOrdered, setFrequentlyOrdered] = useState([]);
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  const [hasUserActivity, setHasUserActivity] = useState(false);

  // Active pricing rules for volume discounts
  const [pricingRules, setPricingRules] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All");
  const [selectedColor, setSelectedColor] = useState("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [maxLimit, setMaxLimit] = useState(5000);

  // Cart state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // 3D Detail modal state
  const [selected3DProduct, setSelected3DProduct] = useState(null);
  const [modalColor, setModalColor] = useState("");
  const [modalSize, setModalSize] = useState("");
  const [modalGsm, setModalGsm] = useState("");
  const [modalQty, setModalQty] = useState(1);
  const [modalSide, setModalSide] = useState("front");
  const [modalZoom, setModalZoom] = useState(0.85);
  const [modalRotation, setModalRotation] = useState(0);
  const [modalAutoRotate, setModalAutoRotate] = useState(false);

  useEffect(() => {
    if (selected3DProduct) {
      setModalColor(selected3DProduct.colors?.[0] || "#ffffff");
      setModalSize(selected3DProduct.sizes?.[0] || "M");
      setModalGsm(formatGsm(selected3DProduct.gsms?.[0] || selected3DProduct.gsm || "GSM 180"));
      setModalQty(1);
      setModalSide("front");
      setModalZoom(0.85);
      setModalRotation(0);
      setModalAutoRotate(false);

      if (selected3DProduct._id) {
        logUserActivity(
          {
            action: "VIEW_PRODUCT",
            productId: selected3DProduct._id,
            category: selected3DProduct.category,
          },
          fetchRecommendationsOnly
        );
      }
    }
  }, [selected3DProduct]);

  useEffect(() => {
    if (!searchTerm.trim()) return;
    const timer = setTimeout(() => {
      logUserActivity(
        {
          action: "SEARCH_PRODUCT",
          searchTerm: searchTerm.trim(),
        },
        fetchRecommendationsOnly
      );
    }, 1200);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const getModalLayers = () => {
    if (!selected3DProduct) return [];
    if (selected3DProduct.layers && selected3DProduct.layers.length > 0) {
      return selected3DProduct.layers;
    }
    return [
      {
        id: "logo-layer",
        type: "image",
        url: selected3DProduct.images?.[0] || "/images/dumyImage.png",
        visible: true,
        locked: true,
        position: [0, 0.1, 0.15],
        rotation: [0, 0, 0],
        scale: [0.35, 0.35, 0.35],
      },
    ];
  };

  const getModalModelPath = () => {
    if (!selected3DProduct) return "/images/models/male normal t-shirt1.glb";
    if (selected3DProduct.modelPath && typeof selected3DProduct.modelPath === "string" && (selected3DProduct.modelPath.toLowerCase().endsWith(".glb") || selected3DProduct.modelPath.toLowerCase().endsWith(".gltf"))) {
      return selected3DProduct.modelPath;
    }
    if (selected3DProduct.modelUrl && typeof selected3DProduct.modelUrl === "string" && (selected3DProduct.modelUrl.toLowerCase().endsWith(".glb") || selected3DProduct.modelUrl.toLowerCase().endsWith(".gltf"))) {
      return selected3DProduct.modelUrl;
    }
    const title = (selected3DProduct.title || "").toLowerCase();
    const category = (selected3DProduct.category || "").toLowerCase();

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

  const handleAddToCartFromModal = (
    product,
    selectedColor,
    selectedSize,
    quantity,
  ) => {
    const colorName = resolveColorName(selectedColor);
    const cartKey = `${product._id}-${selectedSize}-${colorName}`;

    const existingIndex = cart.findIndex((item) => item.cartKey === cartKey);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      saveCart(updatedCart);
    } else {
      const cartItem = {
        cartKey,
        productId: product._id,
        title: product.title,
        basePrice: product.basePrice,
        discount: product.discount || 0,
        category: product.category,
        size: selectedSize,
        color: colorName,
        quantity: quantity,
        image: product.images?.[0] || "/images/dumyImage.png",
      };
      saveCart([...cart, cartItem]);
    }

    if (product && product._id) {
      logUserActivity({
        action: "ADD_TO_CART",
        productId: product._id,
        category: product.category,
      });
    }

    setIsCartOpen(true);
  };

  useEffect(() => {
    // Load local cart if any
    const savedCart = localStorage.getItem("printsphere_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (err) {
        console.error("Load cart error:", err);
      }
    }

    fetchStoreData();
  }, []);

  const fetchRecommendationsOnly = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const sessionId = getOrCreateSessionId();
      const recomRes = await axios.get(
        `${API_BASE_URL}/auth/recommendations?sessionId=${sessionId}`,
        { headers }
      );
      setPopularProducts(recomRes.data.popular || []);
      setFrequentlyOrdered(recomRes.data.frequentlyOrdered || []);
      setIsLoggedInUser(!!recomRes.data.isLoggedIn || !!token);
      setHasUserActivity(!!recomRes.data.hasUserActivity);
    } catch (err) {
      console.error("Fetch recommendations error:", err);
    }
  };

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const sessionId = getOrCreateSessionId();

      const [productsRes, recomRes, pricingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/products`),
        axios.get(`${API_BASE_URL}/auth/recommendations?sessionId=${sessionId}`, { headers }),
        axios.get(`${API_BASE_URL}/auth/pricing-rules`),
      ]);

      setProducts(productsRes.data);
      setPopularProducts(recomRes.data.popular || []);
      setFrequentlyOrdered(recomRes.data.frequentlyOrdered || []);
      setIsLoggedInUser(!!recomRes.data.isLoggedIn || !!token);
      setHasUserActivity(!!recomRes.data.hasUserActivity);
      setPricingRules(pricingRes.data);

      // Calculate max price from products to set default slider
      if (productsRes.data.length > 0) {
        const prices = productsRes.data.map((p) => p.basePrice);
        const max = Math.max(...prices, 5000);
        setMaxLimit(Math.ceil(max));
        setMaxPrice(Math.ceil(max));
      } else {
        setMaxLimit(5000);
        setMaxPrice(5000);
      }
    } catch (err) {
      console.error("Fetch store data error:", err);
      setError("Failed to load store products. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Save cart changes
  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("printsphere_cart", JSON.stringify(newCart));
  };

  // Add to cart
  const handleAddToCart = (product, selectedOptions = {}) => {
    const defaultSize = selectedOptions.size || product.sizes?.[0] || "M";
    const defaultColor = resolveColorName(
      selectedOptions.color || product.colors?.[0] || "White"
    );
    const defaultGsm = formatGsm(
      selectedOptions.gsm || product.gsms?.[0] || product.gsm || "GSM 180"
    );
    const qty = selectedOptions.quantity || 1;
    const styleName = product.category || "Crew Neck";

    const cartKey = `${product._id}-${defaultSize}-${defaultColor}-${defaultGsm}`;

    const existingIndex = cart.findIndex((item) => item.cartKey === cartKey);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += qty;
      saveCart(updatedCart);
    } else {
      const cartItem = {
        cartKey,
        productId: product._id,
        title: product.title,
        tShirtStyle: styleName,
        basePrice: product.basePrice,
        discount: product.discount || 0,
        category: product.category,
        size: defaultSize,
        color: defaultColor,
        gsm: defaultGsm,
        quantity: qty,
        image: product.images?.[0] || "/images/dumyImage.png",
      };
      saveCart([...cart, cartItem]);
    }

    if (product && product._id) {
      logUserActivity(
        {
          action: "ADD_TO_CART",
          productId: product._id,
          category: product.category,
        },
        fetchRecommendationsOnly
      );
    }

    // Open cart drawer immediately
    setIsCartOpen(true);
  };

  // Cart operations
  const handleUpdateQuantity = (cartKey, delta) => {
    const updatedCart = cart.map((item) => {
      if (item.cartKey === cartKey) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    });
    saveCart(updatedCart);
  };

  const handleRemoveItem = (cartKey) => {
    const updatedCart = cart.filter((item) => item.cartKey !== cartKey);
    saveCart(updatedCart);
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to complete your checkout.");
      window.location.href = "/login?redirect=/store";
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    let userAddress = { street: "", city: "", country: "Sri Lanka" };
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.address) {
          userAddress = {
            street: parsedUser.address.street || "",
            city: parsedUser.address.city || "",
            country: parsedUser.address.country || "Sri Lanka",
          };
        }
      } catch (e) {
        console.error("Failed to parse user for address:", e);
      }
    }

    try {
      const resolvedItems = [];
      for (const item of cart) {
        if (item.isCustom || item.designId?.startsWith("custom-")) {
          // It's a local unsaved custom design. Let's save it to the DB first.
          const formattedGsm = formatGsm(item.gsm || item.material || "GSM 180");
          const payload = {
            tShirtType: item.tShirtStyle || item.tShirtType || item.title || "Custom T-Shirt",
            fabricColor: item.color,
            material: formattedGsm,
            size: item.size || "M",
            layers: item.layers || [],
            estimatedCost: item.basePrice,
            thumbnailUrl: item.image || "/images/dumyImage.png",
          };
          const designRes = await axios.post(
            `${API_BASE_URL}/auth/designs`,
            payload,
            { headers },
          );
          const dbDesignId = designRes.data.design._id;
          const colorName = resolveColorName(item.color);
          resolvedItems.push({
            designId: dbDesignId,
            quantity: item.quantity,
            price: item.basePrice,
            size: item.size,
            selectedSize: item.size,
            color: colorName,
            selectedColor: colorName,
            tShirtStyle: item.tShirtStyle || item.tShirtType || item.title || "Crew Neck",
            gsm: formattedGsm,
          });
        } else {
          // Standard product
          const colorName = resolveColorName(item.color);
          const formattedGsm = formatGsm(item.gsm || "GSM 180");
          resolvedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: item.basePrice * (1 - item.discount / 100),
            size: item.size,
            selectedSize: item.size,
            color: colorName,
            selectedColor: colorName,
            tShirtStyle: item.tShirtStyle || item.category || item.title || "Crew Neck",
            gsm: formattedGsm,
          });
        }
      }

      const orderPayload = {
        items: resolvedItems,
        subtotal: cartSubtotal,
        printCost: 0,
        complexityFee: 0,
        totalCost: cartTotal,
        shippingAddress: userAddress,
      };

      const orderRes = await axios.post(
        `${API_BASE_URL}/auth/orders`,
        orderPayload,
        { headers },
      );
      const orderId = orderRes.data.order._id;

      // Track purchase activity
      cart.forEach((item) => {
        if (item.productId) {
          logUserActivity({
            action: "PURCHASE",
            productId: item.productId,
            category: item.category,
          });
        }
      });

      // Save pending order ID, clear cart, and navigate to Payment Interface
      localStorage.setItem("printsphere_pending_order_id", orderId);
      saveCart([]);
      setIsCartOpen(false);
      window.location.href = `/payment?order_id=${orderId}`;
    } catch (err) {
      console.error("Checkout order error:", err);
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        "Failed to process checkout. Please try again.";
      alert(errMsg);
    }
  };

  // Calculations for cart
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const itemPrice = item.basePrice * (1 - item.discount / 100);
    return sum + itemPrice * item.quantity;
  }, 0);

  // Apply volume discount if quantity threshold met
  const isVolumeDiscountEligible =
    pricingRules &&
    pricingRules.volumeDiscount &&
    cartItemCount >= pricingRules.volumeDiscount.thresholdQty;

  const volumeDiscountAmount = isVolumeDiscountEligible
    ? cartSubtotal * (pricingRules.volumeDiscount.discountPercentage / 100)
    : 0;

  const cartTotal = cartSubtotal - volumeDiscountAmount;

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSize =
      selectedSize === "All" || (product.sizes || []).includes(selectedSize);
    const matchesColor =
      selectedColor === "All" || (product.colors || []).includes(selectedColor);

    const finalPrice = product.basePrice * (1 - (product.discount || 0) / 100);
    const matchesPrice = finalPrice <= maxPrice;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesSize &&
      matchesColor &&
      matchesPrice
    );
  });

  // Extract unique filter categories
  const categoriesList = [
    "All",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const sizesList = ["All", "S", "M", "L", "XL", "XXL"];
  const colorsList = [
    "All",
    ...new Set(products.flatMap((p) => p.colors || []).filter(Boolean)),
  ];

  return (
    <div
      className={`min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans ${isManagerPreview ? "p-4" : ""}`}
    >
      {!isManagerPreview && <Navbar />}

      <div
        className={`flex flex-1 overflow-hidden ${isManagerPreview ? "flex-col" : ""}`}
      >
        {!isManagerPreview && <Sidebar />}

        <main
          className={`${isManagerPreview ? "flex-1 overflow-y-auto" : "flex-1 overflow-y-auto p-8 lg:ml-72"}`}
        >
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Header section with Cart status */}
            <div className="flex justify-between items-center select-none border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  Online Store
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Browse and customize our catalog of T-shirts
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl px-5 py-2.5 font-bold text-sm shadow-md transition"
              >
                <ShoppingCart className="h-4.5 w-4.5" />
                <span>My Cart</span>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center animate-bounce">
                    {cartItemCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter controls panel */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm select-none">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4 border-b pb-2">
                <Filter className="h-4.5 w-4.5 text-indigo-600" />
                Filter Ready-made Catalog
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                {/* Search Term */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Search Keywords
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Search className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="e.g. Mountain..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Category Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Size selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Size
                  </label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                  >
                    {sizesList.map((sz) => (
                      <option key={sz} value={sz}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Color Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">
                    Color
                  </label>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                  >
                    {colorsList.map((col) => (
                      <option key={col} value={col}>
                        {col}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Max Price</span>
                    <span>Rs. {maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max={maxLimit}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-lg appearance-none mt-2"
                  />
                </div>
              </div>
            </div>

            {/* Catalog Grid products list */}
            {loading ? (
              <div className="flex justify-center items-center py-20 bg-white border rounded-3xl">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center gap-2.5 p-4 rounded-3xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-semibold select-none justify-center">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white border rounded-3xl shadow-xs">
                <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">
                  No products match your selected filters.
                </p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                  Catalog Products ({filteredProducts.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => {
                    const hasDiscount = p.discount > 0;
                    const finalPrice =
                      p.basePrice * (1 - (p.discount || 0) / 100);

                    return (
                      <article
                        key={p._id}
                        className="group bg-white border rounded-3xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
                      >
                        <div>
                          {/* 3D T-Shirt Card Preview with Front/Back/Side hover controls */}
                          <div className="relative mb-4">
                            <Store3DCardPreview
                              product={p}
                              activeColor={selectedColor !== "All" ? selectedColor : p.colors?.[0]}
                              onClick={() => setSelected3DProduct(p)}
                            />
                            {hasDiscount && (
                              <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-xs z-20 pointer-events-none">
                                {p.discount}% Off
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="space-y-1.5 select-none">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                                {p.category}
                              </span>
                              {/* Product Rating */}
                              <div className="flex items-center gap-1 text-[11px]">
                                <Star className={`h-3.5 w-3.5 ${p.ratingsCount > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                                {p.ratingsCount > 0 ? (
                                  <span className="font-extrabold text-slate-800">
                                    {p.averageRating ? p.averageRating.toFixed(1) : "0.0"}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium text-[10px]">0 review</span>
                                )}
                                <span className="text-slate-400 font-bold text-[10px]">
                                  ({p.ratingsCount || 0})
                                </span>
                              </div>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-tight">
                              {p.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 min-h-[2rem]">
                              {p.description}
                            </p>
                          </div>
                        </div>

                        {/* Buy section */}
                        <div className="mt-4 pt-3 border-t">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              {hasDiscount ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-slate-950">
                                    Rs. {finalPrice.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-slate-400 line-through">
                                    Rs. {p.basePrice.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-black text-slate-950">
                                  Rs. {p.basePrice.toFixed(2)}
                                </span>
                              )}
                            </div>
                            <div className="flex flex-col items-end text-[9px] font-bold text-slate-400">
                              <span>Sizes: {(p.sizes || []).join(", ")}</span>
                              <span className="text-indigo-600">GSM: {(p.gsms || []).join(", ") || p.gsm || "180GSM"}</span>
                            </div>
                          </div>

                          <button
                            onClick={() => setSelected3DProduct(p)}
                            className="w-full py-2 bg-slate-900 group-hover:bg-indigo-600 hover:!bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                            <span>View Details & 3D</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            )}

            {/* RECOMMENDATIONS CAROUSEL PANELS */}
            {!loading && products.length > 0 && (
              <div className="space-y-8 pt-8 border-t">
                {/* Popular recommendations */}
                {popularProducts.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Sparkles className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                      Popular Choices & Highly Recommended
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      {popularProducts.slice(0, 4).map((p) => {
                        const finalPrice =
                          p.basePrice * (1 - (p.discount || 0) / 100);
                        return (
                          <div
                            key={p._id}
                            className="bg-white border rounded-2xl p-3 shadow-xs hover:border-amber-200 transition flex items-center gap-3 cursor-pointer group"
                            onClick={() => setSelected3DProduct(p)}
                          >
                            <TShirt2D
                              color={p.colors?.[0]}
                              designUrl={p.images?.[0]}
                              className="h-12 w-12 bg-slate-50 rounded-lg border shrink-0 group-hover:scale-105 transition"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-amber-600 transition">
                                {p.title}
                              </h4>
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full inline-block mt-0.5 truncate max-w-full">
                                Popular Choice
                              </span>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs font-black text-slate-955">
                                  Rs. {finalPrice.toFixed(2)}
                                </span>
                                <div className="flex items-center gap-1 text-[10px]">
                                  <Star className={`h-3 w-3 ${p.ratingsCount > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                                  <span className={p.ratingsCount > 0 ? "font-bold text-slate-800" : "text-slate-400"}>
                                    {p.ratingsCount > 0 ? (p.averageRating ? p.averageRating.toFixed(1) : "0.0") : "0 review"}
                                  </span>
                                  <span className="text-slate-400 font-semibold">({p.ratingsCount || 0})</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Frequently Ordered recommendations (Only for Logged-In Users) */}
                {isLoggedInUser && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Star className="h-4.5 w-4.5 text-indigo-500" />
                      Frequently Ordered Items based on Activity
                    </h3>

                    {frequentlyOrdered.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {frequentlyOrdered.slice(0, 4).map((p) => {
                          const finalPrice =
                            p.basePrice * (1 - (p.discount || 0) / 100);
                          return (
                            <div
                              key={p._id}
                              className="bg-white border rounded-2xl p-3 shadow-xs hover:border-indigo-200 transition flex items-center gap-3 cursor-pointer group"
                              onClick={() => setSelected3DProduct(p)}
                            >
                              <TShirt2D
                                color={p.colors?.[0]}
                                designUrl={p.images?.[0]}
                                className="h-12 w-12 bg-slate-50 rounded-lg border shrink-0 group-hover:scale-105 transition"
                              />
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-900 truncate leading-tight group-hover:text-indigo-600 transition">
                                  {p.title}
                                </h4>
                                <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded-full inline-block mt-0.5 truncate max-w-full">
                                  {p.recommendationReason || "Recommended for you"}
                                </span>
                                <div className="flex justify-between items-center mt-1">
                                  <span className="text-xs font-black text-slate-955">
                                    Rs. {finalPrice.toFixed(2)}
                                  </span>
                                  <div className="flex items-center gap-1 text-[10px]">
                                    <Star className={`h-3 w-3 ${p.ratingsCount > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                                    <span className={p.ratingsCount > 0 ? "font-bold text-slate-800" : "text-slate-400"}>
                                      {p.ratingsCount > 0 ? (p.averageRating ? p.averageRating.toFixed(1) : "0.0") : "0 review"}
                                    </span>
                                    <span className="text-slate-400 font-semibold">({p.ratingsCount || 0})</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Fresh user state (No activity yet) */
                      <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-indigo-50/80 border border-indigo-100/80 rounded-2xl p-6 text-center shadow-xs">
                        <div className="mx-auto w-12 h-12 bg-indigo-600/10 rounded-full flex items-center justify-center mb-2.5">
                          <Sparkles className="h-6 w-6 text-indigo-600 animate-bounce" />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          We are studying your fashion preferences!
                        </h4>
                        <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                          Start exploring catalog products, searching your favorite styles, viewing 3D previews, or adding items to your cart. Your personalized activity feed will dynamically update here based on your unique behavior!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col justify-between select-none">
            {/* Cart Header */}
            <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-indigo-300" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                  Your Shopping Cart
                </h3>
                <span className="text-xs font-bold text-indigo-300">
                  ({cartItemCount} Items)
                </span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Cart Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {checkoutSuccess && (
                <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold">
                  <CheckCircle className="h-5 w-5 shrink-0" />
                  <span>
                    Order placed successfully! Thank you for your purchase.
                  </span>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-slate-350" />
                  <p className="text-sm font-bold">
                    Your cart is currently empty.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const priceAfterDiscount =
                      item.basePrice * (1 - item.discount / 100);
                    return (
                      <div
                        key={item.cartKey}
                        className="border rounded-2xl p-3 flex gap-3 hover:bg-slate-50 transition bg-slate-50/25"
                      >
                        <TShirt2D
                          color={item.color}
                          designUrl={item.image}
                          className="h-16 w-16 bg-white rounded-lg border shrink-0"
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight pr-2">
                                {item.title}
                              </h4>
                              <button
                                onClick={() => handleRemoveItem(item.cartKey)}
                                className="text-slate-450 hover:text-rose-500 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              Size: {item.size} / Color: {item.color}
                            </p>
                          </div>

                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs font-black text-slate-950">
                              Rs. {priceAfterDiscount.toFixed(2)}
                            </span>

                            <div className="flex items-center gap-1 bg-white border rounded-xl px-1">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(item.cartKey, -1)
                                }
                                className="p-1 hover:text-indigo-600 transition"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-bold min-w-[1.25rem] text-center">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(item.cartKey, 1)
                                }
                                className="p-1 hover:text-indigo-600 transition"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="border-t p-5 bg-slate-50 select-none space-y-4">
                <div className="space-y-1 text-xs text-slate-650">
                  <div className="flex justify-between">
                    <span>Cart Subtotal</span>
                    <span>Rs. {cartSubtotal.toFixed(2)}</span>
                  </div>

                  {isVolumeDiscountEligible && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>
                        Volume Discount (
                        {pricingRules.volumeDiscount.discountPercentage}%)
                      </span>
                      <span>-Rs. {volumeDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {pricingRules &&
                    pricingRules.volumeDiscount &&
                    !isVolumeDiscountEligible && (
                      <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-700 font-semibold flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>
                          Tip: Order {pricingRules.volumeDiscount.thresholdQty}{" "}
                          units or more to get a{" "}
                          {pricingRules.volumeDiscount.discountPercentage}% bulk
                          discount!
                        </span>
                      </div>
                    )}

                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t">
                    <span>Estimated Total</span>
                    <span>Rs. {cartTotal.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3D Product Detail Modal */}
      {selected3DProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px] select-none">
            {/* Left 3D Canvas Panel */}
            <div className="flex-1 bg-slate-50 relative flex flex-col justify-between p-5 border-b md:border-b-0 md:border-r">
              {/* Top Left info badge */}
              <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 pointer-events-none">
                <span className="px-3 py-1 bg-indigo-50/90 backdrop-blur-md border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-2xs">
                  <Sparkles className="h-3 w-3 text-indigo-600 animate-pulse" />
                  Interactive 3D Viewer
                </span>
                <span className="text-[10px] text-slate-400 font-bold pl-1">
                  Drag to rotate • Wheel to zoom
                </span>
              </div>

              {/* Top Right View Angle Preset buttons */}
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

              {/* 3D canvas container */}
              <div className="w-full flex-1 relative min-h-[300px] md:min-h-0">
                <Scene
                  modelPath={getModalModelPath()}
                  shirtColor={modalColor}
                  activeSide={modalSide}
                  zoomLevel={modalZoom}
                  layers={getModalLayers()}
                  selectedLayerId={null}
                  onSelectLayer={() => {}}
                  onUpdateLayers={() => {}}
                  modelRotation={modalRotation}
                  orbitEnabled={true}
                  autoRotate={modalAutoRotate}
                />
              </div>

              {/* Controls Toolbar (Adjustable Zoom & Rotation Controls) */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-2.5 z-20 shadow-md">
                {/* Zoom Controls */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1">
                    Zoom
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalZoom((prev) => Math.max(0.5, parseFloat((prev - 0.1).toFixed(2))))}
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
                    onClick={() => setModalZoom((prev) => Math.min(1.5, parseFloat((prev + 0.1).toFixed(2))))}
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

                {/* Rotate Controls */}
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
                    className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 rounded-lg transition border border-slate-200 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
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
                    className="p-1.5 hover:bg-slate-100 text-slate-700 hover:text-indigo-600 rounded-lg transition border border-slate-200 cursor-pointer flex items-center gap-1 text-[10px] font-bold"
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
                    <RotateCw className={`h-3 w-3 ${modalAutoRotate ? "animate-spin" : ""}`} />
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
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                      {selected3DProduct.category}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
                      {selected3DProduct.title}
                    </h3>
                    {/* Star Rating & Review Count */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => {
                          const ratingVal = selected3DProduct.averageRating || 0;
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
                          ? (selected3DProduct.averageRating ? selected3DProduct.averageRating.toFixed(1) : "0.0")
                          : "0 review"}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">
                        ({selected3DProduct.ratingsCount || 0})
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelected3DProduct(null)}
                    className="p-1 rounded-lg hover:bg-slate-105 text-slate-400 hover:text-slate-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Price block */}
                <div className="flex items-baseline gap-2 pb-4 border-b">
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
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Description
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selected3DProduct.description}
                  </p>
                </div>

                {/* Color Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select Fabric Color
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    {selected3DProduct.colors?.map((col) => {
                      const isSelected = modalColor === col;
                      return (
                        <button
                          key={col}
                          onClick={() => setModalColor(col)}
                          className={`w-7 h-7 rounded-full border shadow-xs relative transition hover:scale-105 ${
                            isSelected
                              ? "ring-2 ring-indigo-650 ring-offset-2 border-transparent"
                              : "border-slate-300"
                          }`}
                          style={{ backgroundColor: col }}
                          title={col}
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
                  <div className="flex gap-2">
                    {selected3DProduct.sizes?.map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setModalSize(sz)}
                        className={`w-9 h-9 text-xs font-bold rounded-xl border flex items-center justify-center transition ${
                          modalSize === sz
                            ? "bg-slate-900 border-slate-900 text-white"
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
                    Select GSM Value
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(selected3DProduct.gsms && selected3DProduct.gsms.length > 0
                      ? selected3DProduct.gsms
                      : ["180GSM"]
                    ).map((gsmVal) => (
                      <button
                        key={gsmVal}
                        onClick={() => setModalGsm(gsmVal)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border flex items-center justify-center transition cursor-pointer ${
                          modalGsm === gsmVal
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {gsmVal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Quantity
                  </span>
                  <div className="flex items-center gap-1.5 bg-slate-50 border rounded-xl w-fit p-1">
                    <button
                      onClick={() =>
                        setModalQty((prev) => Math.max(1, prev - 1))
                      }
                      className="p-1.5 hover:text-indigo-600 transition"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold min-w-[2rem] text-center">
                      {modalQty}
                    </span>
                    <button
                      onClick={() => setModalQty((prev) => prev + 1)}
                      className="p-1.5 hover:text-indigo-600 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Customer Reviews List */}
                <div className="space-y-2.5 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Customer Reviews ({selected3DProduct.ratingsCount || 0})
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className={`h-3.5 w-3.5 ${selected3DProduct.ratingsCount > 0 ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                      <span className="font-extrabold text-slate-800">
                        {selected3DProduct.ratingsCount > 0
                          ? (selected3DProduct.averageRating ? selected3DProduct.averageRating.toFixed(1) : "0.0")
                          : "0 review"}
                      </span>
                      <span className="text-slate-400 font-bold text-[10px]">({selected3DProduct.ratingsCount || 0})</span>
                    </div>
                  </div>

                  {selected3DProduct.reviews && selected3DProduct.reviews.length > 0 ? (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                      {selected3DProduct.reviews.map((rev, rIdx) => (
                        <div key={rIdx} className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{rev.userName || "Verified Buyer"}</span>
                            <div className="flex text-amber-400">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`h-3 w-3 ${s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                />
                              ))}
                            </div>
                          </div>
                          {rev.comment && (
                            <p className="text-[11px] text-slate-600 italic leading-snug">"{rev.comment}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      No customer reviews yet. Be the first to order and review!
                    </p>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-8 pt-4 border-t flex flex-col gap-2">
                <button
                  onClick={() => {
                    handleAddToCart(selected3DProduct, {
                      color: modalColor,
                      size: modalSize,
                      gsm: modalGsm,
                      quantity: modalQty,
                    });
                    setSelected3DProduct(null);
                  }}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition cursor-pointer"
                >
                  Add to Cart — Rs.{" "}
                  {(
                    selected3DProduct.basePrice *
                    (1 - selected3DProduct.discount / 100) *
                    modalQty
                  ).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isManagerPreview && <Footer withSidebarOffset />}
    </div>
  );
}
