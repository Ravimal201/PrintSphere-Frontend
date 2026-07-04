import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import TShirt2D from "../components/TShirt2D";
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle, ShoppingBag, CheckCircle } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [pricingRules, setPricingRules] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cart
    const savedCart = localStorage.getItem("printsphere_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error(e);
      }
    }

    // Fetch pricing rules
    axios.get(`${API_BASE_URL}/auth/pricing-rules`)
      .then(res => setPricingRules(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const saveCart = (newCart) => {
    setCart(newCart);
    localStorage.setItem("printsphere_cart", JSON.stringify(newCart));
  };

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

  const handleCheckout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to complete your checkout.");
      window.location.href = "/login?redirect=/cart";
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
        window.location.href = "/my-orders";
      }, 2000);
    } catch (err) {
      console.error("Checkout order error:", err);
      alert(err.response?.data?.message || "Failed to process checkout. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8 lg:ml-72 select-none">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-indigo-600" />
                Shopping Cart
              </h2>
              <p className="text-xs text-slate-500 mt-1">Review your selected items and proceed to checkout</p>
            </div>

            {checkoutSuccess && (
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Order placed successfully! Redirecting to your orders...</span>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : cart.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Your Cart is Empty</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Browse our online store or create custom designs to add items to your cart.
                  </p>
                </div>
                <a
                  href="/store"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-sm"
                >
                  Browse Store
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cart Items List */}
                <div className="md:col-span-2 space-y-4">
                  {cart.map((item) => {
                    const priceAfterDiscount = item.basePrice * (1 - (item.discount / 100));
                    return (
                      <div key={item.cartKey} className="bg-white border border-slate-200/80 rounded-3xl p-4 flex gap-4 shadow-sm hover:shadow-md transition">
                        <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center p-2 shrink-0">
                          <TShirt2D color={item.color} designUrl={item.image} className="h-16 w-16" />
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="font-extrabold text-slate-900 text-sm truncate leading-tight pr-2 capitalize">{item.title}</h4>
                              <button 
                                onClick={() => handleRemoveItem(item.cartKey)}
                                className="text-slate-400 hover:text-rose-500 transition cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">
                              Size: {item.size} / Color: {item.color}
                            </p>
                          </div>
                          
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-sm font-black text-slate-950">Rs. {priceAfterDiscount.toFixed(2)}</span>
                            
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 rounded-xl px-1.5 py-0.5">
                              <button
                                onClick={() => handleUpdateQuantity(item.cartKey, -1)}
                                className="p-1 text-slate-500 hover:text-indigo-650 transition"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-bold min-w-[1.25rem] text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.cartKey, 1)}
                                className="p-1 text-slate-500 hover:text-indigo-650 transition"
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

                {/* Summary / Checkout Panel */}
                <div className="space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b">Order Summary</h3>
                    
                    <div className="space-y-2.5 text-xs text-slate-500 font-medium">
                      <div className="flex justify-between">
                        <span>Subtotal ({cartItemCount} items)</span>
                        <span className="text-slate-800 font-bold">Rs. {cartSubtotal.toFixed(2)}</span>
                      </div>
                      
                      {isVolumeDiscountEligible && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Volume Discount ({pricingRules?.volumeDiscount?.discountPercentage}%)</span>
                          <span>-Rs. {volumeDiscountAmount.toFixed(2)}</span>
                        </div>
                      )}

                      {pricingRules && pricingRules.volumeDiscount && !isVolumeDiscountEligible && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-[10px] text-indigo-700 font-semibold leading-snug flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                          <span>
                            Order {pricingRules.volumeDiscount.thresholdQty} units or more to get a {pricingRules.volumeDiscount.discountPercentage}% bulk discount!
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between text-sm font-black text-slate-950 pt-3 border-t">
                        <span>Total Cost</span>
                        <span className="text-indigo-650 font-black">Rs. {cartTotal.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleCheckout}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-4"
                    >
                      Proceed to Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer withSidebarOffset />
    </div>
  );
}
