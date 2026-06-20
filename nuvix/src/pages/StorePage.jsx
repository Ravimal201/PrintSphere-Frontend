import { useState, useEffect } from "react";
import { 
  ShoppingCart, Filter, Search, SlidersHorizontal, Trash2, X, Plus, Minus, 
  Star, Heart, Sparkles, Check, ChevronRight, AlertCircle, ShoppingBag,
  Loader2, CheckCircle
} from "lucide-react";
import axios from "axios";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import Scene from "../three/Scene";
import TShirt2D from "../components/TShirt2D";

const API_BASE_URL = "http://localhost:5000/api";

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Recommendations state
  const [popularProducts, setPopularProducts] = useState([]);
  const [frequentlyOrdered, setFrequentlyOrdered] = useState([]);

  // Active pricing rules for volume discounts
  const [pricingRules, setPricingRules] = useState(null);

  // Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedSize, setSelectedSize] = useState("All");
  const [selectedColor, setSelectedColor] = useState("All");
  const [maxPrice, setMaxPrice] = useState(100);

  // Cart state
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // 3D Detail modal state
  const [selected3DProduct, setSelected3DProduct] = useState(null);
  const [modalColor, setModalColor] = useState("");
  const [modalSize, setModalSize] = useState("");
  const [modalQty, setModalQty] = useState(1);
  const [modalSide, setModalSide] = useState("front");
  const [modalZoom, setModalZoom] = useState(0.85);

  useEffect(() => {
    if (selected3DProduct) {
      setModalColor(selected3DProduct.colors?.[0] || "#ffffff");
      setModalSize(selected3DProduct.sizes?.[0] || "M");
      setModalQty(1);
      setModalSide("front");
      setModalZoom(0.85);
    }
  }, [selected3DProduct]);

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
        scale: [0.35, 0.35, 0.35]
      }
    ];
  };

  const getModalModelPath = () => {
    if (!selected3DProduct) return "/images/models/male normal t-shirt1.glb";
    if (selected3DProduct.modelPath) {
      return selected3DProduct.modelPath;
    }
    const title = (selected3DProduct.title || "").toLowerCase();
    const category = (selected3DProduct.category || "").toLowerCase();

    if (title.includes("female") || title.includes("women") || category.includes("female") || category.includes("women")) {
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

  const handleAddToCartFromModal = (product, selectedColor, selectedSize, quantity) => {
    const cartKey = `${product._id}-${selectedSize}-${selectedColor}`;

    const existingIndex = cart.findIndex(item => item.cartKey === cartKey);
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
        color: selectedColor,
        quantity: quantity,
        image: product.images?.[0] || "/images/dumyImage.png"
      };
      saveCart([...cart, cartItem]);
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

  const fetchStoreData = async () => {
    setLoading(true);
    try {
      const [productsRes, recomRes, pricingRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/products`),
        axios.get(`${API_BASE_URL}/auth/recommendations`),
        axios.get(`${API_BASE_URL}/auth/pricing-rules`)
      ]);

      setProducts(productsRes.data);
      setPopularProducts(recomRes.data.popular || []);
      setFrequentlyOrdered(recomRes.data.frequentlyOrdered || []);
      setPricingRules(pricingRes.data);
      
      // Calculate max price from products to set default slider
      if (productsRes.data.length > 0) {
        const prices = productsRes.data.map(p => p.basePrice);
        const max = Math.max(...prices, 50);
        setMaxPrice(Math.ceil(max));
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
    const defaultColor = selectedOptions.color || product.colors?.[0] || "White";

    const cartKey = `${product._id}-${defaultSize}-${defaultColor}`;

    const existingIndex = cart.findIndex(item => item.cartKey === cartKey);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      saveCart(updatedCart);
    } else {
      const cartItem = {
        cartKey,
        productId: product._id,
        title: product.title,
        basePrice: product.basePrice,
        discount: product.discount || 0,
        category: product.category,
        size: defaultSize,
        color: defaultColor,
        quantity: 1,
        image: product.images?.[0] || "/images/dumyImage.png"
      };
      saveCart([...cart, cartItem]);
    }
    
    // Open cart drawer immediately
    setIsCartOpen(true);
  };

  // Cart operations
  const handleUpdateQuantity = (cartKey, delta) => {
    const updatedCart = cart.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.quantity + delta;
        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    });
    saveCart(updatedCart);
  };

  const handleRemoveItem = (cartKey) => {
    const updatedCart = cart.filter(item => item.cartKey !== cartKey);
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
            country: parsedUser.address.country || "Sri Lanka"
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
          const payload = {
            tShirtType: item.tShirtType || item.title || "Custom T-Shirt",
            fabricColor: item.color,
            material: item.material || "180GSM",
            size: item.size || "M",
            layers: item.layers || [],
            estimatedCost: item.basePrice,
            thumbnailUrl: item.image || "/images/dumyImage.png"
          };
          const designRes = await axios.post(`${API_BASE_URL}/auth/designs`, payload, { headers });
          const dbDesignId = designRes.data.design._id;
          resolvedItems.push({
            designId: dbDesignId,
            quantity: item.quantity,
            price: item.basePrice,
            selectedSize: item.size,
            selectedColor: item.color
          });
        } else {
          // Standard product
          resolvedItems.push({
            productId: item.productId,
            quantity: item.quantity,
            price: item.basePrice * (1 - (item.discount / 100)),
            selectedSize: item.size,
            selectedColor: item.color
          });
        }
      }

      const orderPayload = {
        items: resolvedItems,
        subtotal: cartSubtotal,
        printCost: 0,
        complexityFee: 0,
        totalCost: cartTotal,
        shippingAddress: userAddress
      };

      await axios.post(`${API_BASE_URL}/auth/orders`, orderPayload, { headers });
      setCheckoutSuccess(true);
      saveCart([]); // Clear cart
      setTimeout(() => {
        setCheckoutSuccess(false);
        setIsCartOpen(false);
        // Redirect to my orders page
        window.location.href = "/my-orders";
      }, 2000);
    } catch (err) {
      console.error("Checkout order error:", err);
      alert(err.response?.data?.message || "Failed to process checkout. Please try again.");
    }
  };

  // Calculations for cart
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const itemPrice = item.basePrice * (1 - (item.discount / 100));
    return sum + (itemPrice * item.quantity);
  }, 0);

  // Apply volume discount if quantity threshold met
  const isVolumeDiscountEligible = pricingRules && 
    pricingRules.volumeDiscount && 
    cartItemCount >= pricingRules.volumeDiscount.thresholdQty;
  
  const volumeDiscountAmount = isVolumeDiscountEligible 
    ? cartSubtotal * (pricingRules.volumeDiscount.discountPercentage / 100) 
    : 0;

  const cartTotal = cartSubtotal - volumeDiscountAmount;

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSize = selectedSize === "All" || (product.sizes || []).includes(selectedSize);
    const matchesColor = selectedColor === "All" || (product.colors || []).includes(selectedColor);
    
    const finalPrice = product.basePrice * (1 - ((product.discount || 0) / 100));
    const matchesPrice = finalPrice <= maxPrice;

    return matchesSearch && matchesCategory && matchesSize && matchesColor && matchesPrice;
  });

  // Extract unique filter categories
  const categoriesList = ["All", ...new Set(products.map(p => p.category).filter(Boolean))];
  const sizesList = ["All", "S", "M", "L", "XL", "XXL"];
  const colorsList = ["All", ...new Set(products.flatMap(p => p.colors || []).filter(Boolean))];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      
      {/* Top Navbar */}
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        
        {/* Navigation Sidebar */}
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8 lg:ml-72">
          <div className="max-w-7xl mx-auto space-y-8">
            
            {/* Header section with Cart status */}
            <div className="flex justify-between items-center select-none border-b pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Online Store</h2>
                <p className="text-xs text-slate-500 mt-1">Browse and customize our catalog of T-shirts</p>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Search Keywords</label>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Size selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Size</label>
                  <select
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                  >
                    {sizesList.map(sz => (
                      <option key={sz} value={sz}>{sz}</option>
                    ))}
                  </select>
                </div>

                {/* Color Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Color</label>
                  <select
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-semibold"
                  >
                    {colorsList.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range Slider */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>Max Price</span>
                    <span>${maxPrice}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
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
                <p className="text-sm font-bold text-slate-400">No products match your selected filters.</p>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Catalog Products ({filteredProducts.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredProducts.map((p) => {
                    const hasDiscount = p.discount > 0;
                    const finalPrice = p.basePrice * (1 - ((p.discount || 0) / 100));

                    return (
                      <article key={p._id} className="group bg-white border rounded-3xl p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between">
                        <div>
                          {/* Image (2D T-Shirt Preview) */}
                          <div className="relative rounded-2xl bg-slate-50 h-48 flex items-center justify-center overflow-hidden mb-4 border cursor-pointer" onClick={() => setSelected3DProduct(p)}>
                            <TShirt2D 
                              color={p.colors?.[0]} 
                              designUrl={p.images?.[0]} 
                              className="h-36 w-36 group-hover:scale-105 transition duration-300" 
                            />
                            {hasDiscount && (
                              <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase shadow-xs z-10">
                                {p.discount}% Off
                              </span>
                            )}
                          </div>

                          {/* Info */}
                          <div className="space-y-1 select-none">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">{p.category}</span>
                            <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition leading-tight">{p.title}</h4>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 min-h-[2rem]">{p.description}</p>
                          </div>
                        </div>

                        {/* Buy section */}
                        <div className="mt-4 pt-3 border-t">
                          <div className="flex justify-between items-center mb-3">
                            <div>
                              {hasDiscount ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm font-black text-slate-950">${finalPrice.toFixed(2)}</span>
                                  <span className="text-[10px] text-slate-400 line-through">${p.basePrice.toFixed(2)}</span>
                                </div>
                              ) : (
                                <span className="text-sm font-black text-slate-950">${p.basePrice.toFixed(2)}</span>
                              )}
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">Sizes: {(p.sizes || []).join(", ")}</span>
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
                      {popularProducts.map((p) => {
                        const finalPrice = p.basePrice * (1 - ((p.discount || 0) / 100));
                        return (
                          <div key={p._id} className="bg-white border rounded-2xl p-3 shadow-xs hover:border-indigo-150 transition flex items-center gap-3 cursor-pointer" onClick={() => setSelected3DProduct(p)}>
                            <TShirt2D 
                              color={p.colors?.[0]} 
                              designUrl={p.images?.[0]} 
                              className="h-12 w-12 bg-slate-50 rounded-lg border shrink-0" 
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">{p.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{p.category}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs font-black text-slate-950">${finalPrice.toFixed(2)}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelected3DProduct(p); }}
                                  className="text-[9px] font-black text-indigo-600 hover:underline"
                                >
                                  + Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Frequently Ordered recommendations */}
                {frequentlyOrdered.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Star className="h-4.5 w-4.5 text-indigo-500" />
                      Frequently Ordered Items based on Activity
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      {frequentlyOrdered.map((p) => {
                        const finalPrice = p.basePrice * (1 - ((p.discount || 0) / 100));
                        return (
                          <div key={p._id} className="bg-white border rounded-2xl p-3 shadow-xs hover:border-indigo-150 transition flex items-center gap-3 cursor-pointer" onClick={() => setSelected3DProduct(p)}>
                            <TShirt2D 
                              color={p.colors?.[0]} 
                              designUrl={p.images?.[0]} 
                              className="h-12 w-12 bg-slate-50 rounded-lg border shrink-0" 
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight">{p.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">{p.category}</p>
                              <div className="flex justify-between items-center mt-1">
                                <span className="text-xs font-black text-slate-950">${finalPrice.toFixed(2)}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setSelected3DProduct(p); }}
                                  className="text-[9px] font-black text-indigo-600 hover:underline"
                                >
                                  + Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
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
                <h3 className="text-sm font-bold uppercase tracking-wider text-white">Your Shopping Cart</h3>
                <span className="text-xs font-bold text-indigo-300">({cartItemCount} Items)</span>
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
                  <span>Order placed successfully! Thank you for your purchase.</span>
                </div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-slate-350" />
                  <p className="text-sm font-bold">Your cart is currently empty.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => {
                    const priceAfterDiscount = item.basePrice * (1 - (item.discount / 100));
                    return (
                      <div key={item.cartKey} className="border rounded-2xl p-3 flex gap-3 hover:bg-slate-50 transition bg-slate-50/25">
                        <TShirt2D 
                          color={item.color} 
                          designUrl={item.image} 
                          className="h-16 w-16 bg-white rounded-lg border shrink-0" 
                        />
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-slate-900 truncate leading-tight pr-2">{item.title}</h4>
                              <button 
                                onClick={() => handleRemoveItem(item.cartKey)}
                                className="text-slate-450 hover:text-rose-500 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-0.5">Size: {item.size} / Color: {item.color}</p>
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-xs font-black text-slate-950">${priceAfterDiscount.toFixed(2)}</span>
                            
                            <div className="flex items-center gap-1 bg-white border rounded-xl px-1">
                              <button
                                onClick={() => handleUpdateQuantity(item.cartKey, -1)}
                                className="p-1 hover:text-indigo-600 transition"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-bold min-w-[1.25rem] text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.cartKey, 1)}
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
                    <span>${cartSubtotal.toFixed(2)}</span>
                  </div>
                  
                  {isVolumeDiscountEligible && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Volume Discount ({pricingRules.volumeDiscount.discountPercentage}%)</span>
                      <span>-${volumeDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {pricingRules && pricingRules.volumeDiscount && !isVolumeDiscountEligible && (
                    <div className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[10px] text-indigo-700 font-semibold flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>
                        Tip: Order {pricingRules.volumeDiscount.thresholdQty} units or more to get a {pricingRules.volumeDiscount.discountPercentage}% bulk discount!
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t">
                    <span>Estimated Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
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
            <div className="flex-1 bg-slate-50 relative flex flex-col justify-between p-6 border-b md:border-b-0 md:border-r">
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Interactive 3D Preview
                </span>
              </div>
              
              {/* Preset Side buttons */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
                {["front", "back", "left", "right"].map((side) => (
                  <button
                    key={side}
                    onClick={() => setModalSide(side)}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border transition shadow-xs ${
                      modalSide === side
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {side}
                  </button>
                ))}
              </div>

              {/* 3D canvas container */}
              <div className="w-full h-full min-h-[280px] md:min-h-0 flex-1">
                <Scene
                  modelPath={getModalModelPath()}
                  shirtColor={modalColor}
                  activeSide={modalSide}
                  zoomLevel={modalZoom}
                  layers={getModalLayers()}
                  selectedLayerId={null}
                  onSelectLayer={() => {}}
                  onUpdateLayers={() => {}}
                />
              </div>

              {/* Zoom control slider */}
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xs border rounded-2xl px-4 py-2 self-center z-10 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Zoom</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={modalZoom}
                  onChange={(e) => setModalZoom(parseFloat(e.target.value))}
                  className="w-28 accent-indigo-600 h-1 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Right Product Details & Settings Panel */}
            <div className="w-full md:w-[400px] flex flex-col justify-between p-6 bg-white overflow-y-auto">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{selected3DProduct.category}</span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mt-0.5">{selected3DProduct.title}</h3>
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
                        ${(selected3DProduct.basePrice * (1 - (selected3DProduct.discount / 100))).toFixed(2)}
                      </span>
                      <span className="text-sm text-slate-400 line-through">
                        ${selected3DProduct.basePrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase ml-1">
                        {selected3DProduct.discount}% Off
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-slate-950">
                      ${selected3DProduct.basePrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{selected3DProduct.description}</p>
                </div>

                {/* Color Selector */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Fabric Color</span>
                  <div className="flex flex-wrap gap-2.5">
                    {selected3DProduct.colors?.map((col) => {
                      const isSelected = modalColor === col;
                      return (
                        <button
                          key={col}
                          onClick={() => setModalColor(col)}
                          className={`w-7 h-7 rounded-full border shadow-xs relative transition hover:scale-105 ${
                            isSelected ? "ring-2 ring-indigo-650 ring-offset-2 border-transparent" : "border-slate-300"
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
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Select Size</span>
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

                {/* Quantity */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantity</span>
                  <div className="flex items-center gap-1.5 bg-slate-50 border rounded-xl w-fit p-1">
                    <button
                      onClick={() => setModalQty(prev => Math.max(1, prev - 1))}
                      className="p-1.5 hover:text-indigo-600 transition"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-bold min-w-[2rem] text-center">{modalQty}</span>
                    <button
                      onClick={() => setModalQty(prev => prev + 1)}
                      className="p-1.5 hover:text-indigo-600 transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-8 pt-4 border-t flex flex-col gap-2">
                <button
                  onClick={() => {
                    handleAddToCartFromModal(selected3DProduct, modalColor, modalSize, modalQty);
                    setSelected3DProduct(null);
                  }}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md transition"
                >
                  Add to Cart — ${(
                    (selected3DProduct.basePrice * (1 - (selected3DProduct.discount / 100))) * modalQty
                  ).toFixed(2)}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Footer */}
      <Footer withSidebarOffset />

    </div>
  );
}
