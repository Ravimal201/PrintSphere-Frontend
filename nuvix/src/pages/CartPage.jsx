import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import TShirt2D from "../components/TShirt2D";
import TShirt3DModal from "../components/TShirt3DModal";
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle, ShoppingBag, CheckCircle, Loader2, Wallet } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { processAccountPayment, processCardPayment } from "../services/paymentService";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [pricingRules, setPricingRules] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected3DDesign, setSelected3DDesign] = useState(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    provider: "",
    accountType: "Bank Account",
    accountNumber: "",
    holderName: "",
    pin: ""
  });

  // Pop-up Checkout Modal & Address / Payment State
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPaymentMethod, setIsEditingPaymentMethod] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("card"); // 'card', 'payhere', 'cod'

  // Forms
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Sri Lanka",
    phone: ""
  });

  const [cardForm, setCardForm] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    saveCard: true
  });

  const loadPayHereScript = () => {
    return new Promise((resolve, reject) => {
      if (window.payhere) {
        resolve(true);
        return;
      }
      const existingScript = document.querySelector('script[src="https://www.payhere.lk/lib/payhere.js"]');
      if (existingScript) {
        existingScript.onload = () => resolve(true);
        existingScript.onerror = () => reject(new Error("Failed to load PayHere SDK"));
        return;
      }
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.src = "https://www.payhere.lk/lib/payhere.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load PayHere SDK"));
      document.body.appendChild(script);
    });
  };

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

    // Load local user profile
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        setAddressForm({
          street: parsed.address?.street || "",
          city: parsed.address?.city || "",
          state: parsed.address?.state || "",
          zipCode: parsed.address?.zipCode || "",
          country: parsed.address?.country || "Sri Lanka",
          phone: parsed.phone || ""
        });
        setCardForm(prev => ({ ...prev, cardholderName: parsed.name || "" }));
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

  // Open Checkout Popup Window
  const handleOpenCheckoutModal = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to complete your checkout.");
      window.location.href = "/login?redirect=/cart";
      return;
    }

    // Refresh user profile from backend
    try {
      const profileRes = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (profileRes.data) {
        setUser(profileRes.data);
        localStorage.setItem("user", JSON.stringify(profileRes.data));
        setAddressForm({
          street: profileRes.data.address?.street || "",
          city: profileRes.data.address?.city || "",
          state: profileRes.data.address?.state || "",
          zipCode: profileRes.data.address?.zipCode || "",
          country: profileRes.data.address?.country || "Sri Lanka",
          phone: profileRes.data.phone || ""
        });
        setCardForm(prev => ({ ...prev, cardholderName: profileRes.data.name || "" }));
        
        // If user has a saved payment method, show saved method view by default
        if (profileRes.data.savedPaymentMethod && profileRes.data.savedPaymentMethod.cardLast4) {
          setIsEditingPaymentMethod(false);
          setSelectedGateway(profileRes.data.savedPaymentMethod.methodType || "card");
        } else {
          setIsEditingPaymentMethod(true);
        }
      }
    } catch (e) {
      console.error("Fetch profile in cart error:", e);
      setIsEditingPaymentMethod(true);
    }

    setIsEditingAddress(false);
    setIsCheckoutModalOpen(true);
  };

  // Card Number Formatter
  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
    setCardForm({ ...cardForm, cardNumber: formatted });
  };

  // Expiry Date Formatter (MM/YY)
  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardForm({ ...cardForm, expiryDate: raw });
  };

  // Card Brand Detector
  const getCardBrand = () => {
    const num = cardForm.cardNumber.replace(/\s/g, "");
    if (num.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(num)) return "MASTERCARD";
    if (/^3[47]/.test(num)) return "AMEX";
    return "CARD";
  };

  // Confirm Order & Redirect to Payment Interface
  const handleConfirmCheckout = async (e) => {
    if (e) e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to complete your checkout.");
      window.location.href = "/login?redirect=/cart";
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const shippingAddress = {
      street: addressForm.street || "",
      city: addressForm.city || "",
      state: addressForm.state || "",
      zipCode: addressForm.zipCode || "",
      country: addressForm.country || "Sri Lanka"
    };

    try {
      setCheckoutLoading(true);

      // 1. Update user delivery address on backend if provided
      if (addressForm.street || addressForm.city) {
        try {
          await axios.put(`${API_BASE_URL}/auth/profile`, {
            phone: addressForm.phone,
            address: shippingAddress
          }, { headers });
        } catch (e) {
          console.error("Update profile address error:", e);
        }
      }

      // 2. Resolve custom designs and items
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

      // 3. Create order in backend DB with Pending Payment status
      const orderPayload = {
        items: resolvedItems,
        subtotal: cartSubtotal,
        printCost: 0,
        complexityFee: 0,
        totalCost: cartTotal,
        shippingAddress
      };

      const orderRes = await axios.post(`${API_BASE_URL}/auth/orders`, orderPayload, { headers });
      const orderId = orderRes.data.order._id;

      // 4. Save pending order ID, clear cart, and navigate to Payment Interface
      localStorage.setItem("printsphere_pending_order_id", orderId);
      saveCart([]);
      setIsCheckoutModalOpen(false);
      window.location.href = `/payment?order_id=${orderId}`;
    } catch (err) {
      console.error("Checkout order error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to create order for checkout. Please try again.";
      alert(errMsg);
      setCheckoutLoading(false);
    }
  };

  const hasAddress = Boolean(addressForm.street || addressForm.city || user?.address?.street);
  const hasSavedPaymentMethod = Boolean(user?.savedPaymentMethod?.cardLast4);

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
              <div className="flex items-center gap-2.5 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-bold animate-fade-in shadow-sm">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <span>Order placed and paid successfully! Redirecting...</span>
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
                            {item.isCustom && (
                              <button
                                onClick={() => {
                                  setSelected3DDesign(item);
                                  setIs3DModalOpen(true);
                                }}
                                className="mt-1.5 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 rounded-lg text-[9px] font-black text-indigo-700 transition flex items-center gap-1 cursor-pointer"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 animate-pulse" />
                                View 3D Preview
                              </button>
                            )}
                          </div>
                          
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-sm font-black text-slate-950">Rs. {priceAfterDiscount.toFixed(2)}</span>
                            
                            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 rounded-xl px-1.5 py-0.5">
                              <button
                                onClick={() => handleUpdateQuantity(item.cartKey, -1)}
                                className="p-1 text-slate-500 hover:text-indigo-650 transition cursor-pointer"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-xs font-bold min-w-[1.25rem] text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQuantity(item.cartKey, 1)}
                                className="p-1 text-slate-500 hover:text-indigo-650 transition cursor-pointer"
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
                      onClick={handleOpenCheckoutModal}
                      className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-4 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Proceed to Checkout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer withSidebarOffset />

      {/* Interactive Checkout Order Preview Window */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">Checkout Order Preview</h3>
                  <p className="text-xs text-slate-500">Review your custom designs & delivery details before payment</p>
                </div>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Section 1: Items & T-Shirt Design Preview */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                Order Items & Designs ({cart.length})
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={item.cartKey} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center p-1 shrink-0">
                        <TShirt2D color={item.color} designUrl={item.image} className="h-11 w-11" />
                      </div>
                      <div className="space-y-0.5">
                        <h5 className="font-extrabold text-slate-900 text-xs capitalize">{item.title}</h5>
                        <div className="text-[10px] text-slate-500 font-semibold uppercase flex items-center gap-2">
                          <span>Size: {item.size}</span>
                          <span>•</span>
                          <span>Color: {item.color}</span>
                          <span>•</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                        {item.isCustom && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelected3DDesign(item);
                              setIs3DModalOpen(true);
                            }}
                            className="mt-1 flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-100/70 border border-indigo-200 px-2 py-0.5 rounded-lg hover:bg-indigo-200 transition cursor-pointer"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 animate-pulse" />
                            View 3D T-Shirt Design
                          </button>
                        )}
                      </div>
                    </div>
                    <span className="font-black text-slate-900 text-sm">
                      Rs. {(item.basePrice * (1 - (item.discount / 100)) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Delivery Details */}
            <div className="space-y-3 bg-slate-50 border border-slate-150 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-indigo-600" />
                  Delivery Details
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white border border-indigo-150 px-2.5 py-1 rounded-xl shadow-2xs hover:bg-indigo-50 transition cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>{isEditingAddress ? "Done" : (hasAddress ? "Edit Address" : "Set Address")}</span>
                </button>
              </div>

              {isEditingAddress ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Street Address</label>
                    <input
                      type="text"
                      placeholder="e.g. 123 Main Street"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="e.g. Colombo"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Phone</label>
                      <input
                        type="text"
                        placeholder="e.g. +94 77 123 4567"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                      />
                    </div>
                  </div>
                </div>
              ) : hasAddress ? (
                <div className="text-xs text-slate-700 font-semibold space-y-0.5">
                  <p>{[addressForm.street, addressForm.city, addressForm.state, addressForm.zipCode, addressForm.country || "Sri Lanka"].filter(Boolean).join(", ")}</p>
                  {addressForm.phone && <p className="text-slate-500 text-[11px]">Contact Phone: {addressForm.phone}</p>}
                </div>
              ) : (
                <p className="text-xs text-amber-600 font-semibold italic">
                  No delivery address set. Click "Set Address" above to enter your shipping details.
                </p>
              )}
            </div>

            {/* Section 3: Next Step Notice */}
            <div className="p-4 bg-indigo-50/70 border border-indigo-150 rounded-2xl space-y-1.5 text-xs text-indigo-950">
              <div className="flex items-center gap-2 font-extrabold text-indigo-900">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                <span>Next Step: Secure Payment Interface</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-snug">
                When you click <strong>Proceed to Payment Interface</strong> below, your order will be created and you will land on our payment gateway page to enter your Payment Account or Card credentials and click Pay.
              </p>
            </div>

            {/* Total Cost & Confirm Action */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex justify-between items-center bg-slate-900 text-white rounded-2xl p-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Amount Payable</span>
                  <span className="text-xl font-black">Rs. {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  <span>256-bit SSL Protected</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="px-5 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCheckout}
                  disabled={checkoutLoading}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                      <span>Creating Order...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Proceed to Payment Interface</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 3D T-Shirt Viewer Modal */}
      <TShirt3DModal
        isOpen={is3DModalOpen}
        onClose={() => {
          setIs3DModalOpen(false);
          setSelected3DDesign(null);
        }}
        design={selected3DDesign}
      />
    </div>
  );
}
