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

  // Confirm Order & Process Payment directly from Popup Window
  const handleConfirmCheckout = async (e) => {
    if (e) e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;

    // Validate payment inputs if user is entering a new card
    if (selectedGateway === "card" && isEditingPaymentMethod) {
      const cleanNum = cardForm.cardNumber.replace(/\s/g, "");
      if (cleanNum.length < 16) {
        alert("Please enter a valid 16-digit credit/debit card number.");
        return;
      }
      if (!cardForm.expiryDate || cardForm.expiryDate.length < 5) {
        alert("Please enter a valid expiry date (MM/YY).");
        return;
      }
      if (!cardForm.cvv || cardForm.cvv.length < 3) {
        alert("Please enter a valid CVV code.");
        return;
      }
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

      // 1. Update user delivery address on backend if updated
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

      // 2. Save user payment method on backend if requested
      if (selectedGateway === "card" && isEditingPaymentMethod && cardForm.saveCard) {
        try {
          const pmRes = await axios.put(`${API_BASE_URL}/auth/payment-method`, {
            methodType: "card",
            cardholderName: cardForm.cardholderName,
            cardNumber: cardForm.cardNumber,
            expiryDate: cardForm.expiryDate,
            brand: getCardBrand()
          }, { headers });
          if (pmRes.data?.user) {
            setUser(pmRes.data.user);
            localStorage.setItem("user", JSON.stringify(pmRes.data.user));
          }
        } catch (e) {
          console.error("Save payment method error:", e);
        }
      }

      // 3. Resolve custom designs and items
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

      // 4. Create order in backend DB
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

      if (selectedGateway === "paymentaccount") {
        if (!accountDetails.provider || !accountDetails.accountNumber || !accountDetails.holderName) {
          alert("Please fill in all payment account details.");
          setCheckoutLoading(false);
          return;
        }

        await processAccountPayment(orderId, accountDetails);
        saveCart([]); // Clear cart
        setCheckoutSuccess(true);
        window.location.href = `/payment/success?order_id=${orderId}&gateway=paymentaccount`;
      } else if (selectedGateway === "payhere") {
        await loadPayHereScript();

        const sessionRes = await axios.post(
          `${API_BASE_URL}/payment/create-checkout-session`,
          { orderId, gateway: "payhere" },
          { headers }
        );

        if (sessionRes.data && sessionRes.data.payhereParams) {
          saveCart([]); // Clear cart
          setCheckoutSuccess(true);

          window.payhere.onCompleted = function (completedOrderId) {
            console.log("PayHere Checkout Completed. Order ID: " + completedOrderId);
            window.location.href = `/payment/success?order_id=${completedOrderId}&gateway=payhere`;
          };

          window.payhere.onDismissed = function () {
            console.log("PayHere Checkout Dismissed");
            window.location.href = `/payment/cancel?order_id=${orderId}&gateway=payhere`;
          };

          window.payhere.onError = function (error) {
            console.error("PayHere Checkout Error: ", error);
            alert("PayHere Checkout Error: " + error);
            setCheckoutLoading(false);
          };

          window.payhere.startPayment(sessionRes.data.payhereParams);
        } else {
          throw new Error("PayHere payment parameters were not returned by backend");
        }
      } else if (selectedGateway === "card") {
        let cardDetailsPayload;
        if (hasSavedPaymentMethod && !isEditingPaymentMethod) {
          cardDetailsPayload = {
            cardNumber: "411122223333" + user.savedPaymentMethod.cardLast4, // mock full card number from last4
            cardholderName: user.savedPaymentMethod.cardholderName || user.name,
            expiryDate: user.savedPaymentMethod.expiryDate || "12/28",
            cvv: "123",
            brand: user.savedPaymentMethod.brand
          };
        } else {
          cardDetailsPayload = {
            cardNumber: cardForm.cardNumber,
            cardholderName: cardForm.cardholderName,
            expiryDate: cardForm.expiryDate,
            cvv: cardForm.cvv,
            brand: getCardBrand()
          };
        }

        await processCardPayment(orderId, cardDetailsPayload);

        saveCart([]); // Clear cart
        setIsCheckoutModalOpen(false);
        setCheckoutSuccess(true);
        window.location.href = `/payment/success?order_id=${orderId}&gateway=card`;
      } else {
        // Fallback for COD or other payment methods
        saveCart([]);
        setIsCheckoutModalOpen(false);
        setCheckoutSuccess(true);
        window.location.href = `/payment/success?order_id=${orderId}&gateway=${selectedGateway}`;
      }
    } catch (err) {
      console.error("Checkout order error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to process checkout. Please try again.";
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

                    {/* Payment Gateway Selector */}
                    <div className="space-y-3 pt-3 border-t select-none">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        Choose Payment Method
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedGateway("stripe")}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedGateway === "stripe"
                              ? "border-indigo-650 bg-indigo-50/30 text-indigo-750 font-extrabold shadow-sm"
                              : "border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50/50"
                          }`}
                        >
                          <span className="text-[11px] font-bold">Stripe Card</span>
                          <span className="text-[8px] text-slate-400 mt-0.5 font-medium">Credit / Debit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGateway("payhere")}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedGateway === "payhere"
                              ? "border-indigo-650 bg-indigo-50/30 text-indigo-750 font-extrabold shadow-sm"
                              : "border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50/50"
                          }`}
                        >
                          <span className="text-[11px] font-bold">PayHere</span>
                          <span className="text-[8px] text-emerald-600 mt-0.5 font-bold">Sandbox</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGateway("paymentaccount")}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                            selectedGateway === "paymentaccount"
                              ? "border-indigo-650 bg-indigo-50/30 text-indigo-750 font-extrabold shadow-sm"
                              : "border-slate-100 hover:border-slate-200 text-slate-500 hover:bg-slate-50/50"
                          }`}
                        >
                          <span className="text-[11px] font-bold flex items-center gap-0.5">
                            <Wallet className="h-3.5 w-3.5 text-indigo-600" />
                            Account
                          </span>
                          <span className="text-[8px] text-slate-400 mt-0.5 font-medium">Any Account</span>
                        </button>
                      </div>

                      {selectedGateway === "paymentaccount" && (
                        <div className="mt-3 p-3 border border-indigo-100 bg-indigo-50/10 rounded-2xl space-y-2.5 transition-all text-left">
                          <span className="text-[10px] font-extrabold text-indigo-900 block mb-1">
                            Enter Payment Account Details
                          </span>
                          
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 block mb-1">PROVIDER NAME</label>
                              <input
                                type="text"
                                placeholder="Commercial Bank, PayPal..."
                                value={accountDetails.provider}
                                onChange={(e) => setAccountDetails({...accountDetails, provider: e.target.value})}
                                className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-400 block mb-1">ACCOUNT TYPE</label>
                              <select
                                value={accountDetails.accountType}
                                onChange={(e) => setAccountDetails({...accountDetails, accountType: e.target.value})}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500"
                              >
                                <option value="Bank Account">Bank Account</option>
                                <option value="Mobile Wallet">Mobile Wallet</option>
                                <option value="Card">Card</option>
                                <option value="Digital Account">Digital Account</option>
                              </select>
                            </div>
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">ACCOUNT NUMBER / ID</label>
                            <input
                              type="text"
                              placeholder="Enter account or wallet number"
                              value={accountDetails.accountNumber}
                              onChange={(e) => setAccountDetails({...accountDetails, accountNumber: e.target.value})}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">ACCOUNT HOLDER NAME</label>
                            <input
                              type="text"
                              placeholder="Enter account holder's name"
                              value={accountDetails.holderName}
                              onChange={(e) => setAccountDetails({...accountDetails, holderName: e.target.value})}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-bold text-slate-400 block mb-1">SECURITY PIN / PASSWORD</label>
                            <input
                              type="password"
                              placeholder="Enter PIN or password (simulated)"
                              value={accountDetails.pin}
                              onChange={(e) => setAccountDetails({...accountDetails, pin: e.target.value})}
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      )}
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

      {/* Interactive Checkout & Payment Pop-up Window */}
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
                  <p className="text-xs text-slate-500">Review your custom designs, delivery details & payment method</p>
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

            {/* Section 3: Dynamic Payment Method Details */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-600" />
                  Payment Method Details
                </h4>
                {hasSavedPaymentMethod && (
                  <button
                    type="button"
                    onClick={() => setIsEditingPaymentMethod(!isEditingPaymentMethod)}
                    className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white border border-indigo-150 px-2.5 py-1 rounded-xl shadow-2xs hover:bg-indigo-50 transition cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>{isEditingPaymentMethod ? "Use Saved Card" : "Edit / Change Payment Method"}</span>
                  </button>
                )}
              </div>

              {/* Case A: Saved Payment Method View */}
              {hasSavedPaymentMethod && !isEditingPaymentMethod ? (
                <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white/10 border border-white/20 rounded-xl text-amber-400 font-black text-xs">
                      {user.savedPaymentMethod.brand || "VISA"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold tracking-wider">
                          •••• •••• •••• {user.savedPaymentMethod.cardLast4 || "4242"}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[9px] font-extrabold uppercase">
                          Saved
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                        Cardholder: {user.savedPaymentMethod.cardholderName || user.name} | Expires: {user.savedPaymentMethod.expiryDate || "12/28"}
                      </p>
                    </div>
                  </div>
                  <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
                </div>
              ) : (
                /* Case B: First Time or Edit Payment Method */
                <div className="space-y-4 bg-slate-50 border border-slate-150 rounded-2xl p-4">
                  {/* Selector Tabs */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedGateway("card")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedGateway === "card"
                          ? "border-indigo-600 bg-white text-indigo-700 font-extrabold shadow-2xs"
                          : "border-slate-200 text-slate-500 hover:bg-white"
                      }`}
                    >
                      <CreditCard className="h-4 w-4 mb-0.5 text-indigo-600" />
                      <span className="text-[11px] font-bold">Credit / Debit Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGateway("payhere")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedGateway === "payhere"
                          ? "border-indigo-600 bg-white text-indigo-700 font-extrabold shadow-2xs"
                          : "border-slate-200 text-slate-500 hover:bg-white"
                      }`}
                    >
                      <Building className="h-4 w-4 mb-0.5 text-indigo-600" />
                      <span className="text-[11px] font-bold">PayHere Portal</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGateway("cod")}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedGateway === "cod"
                          ? "border-indigo-600 bg-white text-indigo-700 font-extrabold shadow-2xs"
                          : "border-slate-200 text-slate-500 hover:bg-white"
                      }`}
                    >
                      <Truck className="h-4 w-4 mb-0.5 text-slate-600" />
                      <span className="text-[11px] font-bold">Pay on Delivery</span>
                    </button>
                  </div>

                  {/* Card Form Inputs */}
                  {selectedGateway === "card" && (
                    <div className="space-y-3 pt-2 text-xs font-semibold text-slate-700">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Sachinthaka Ravimal"
                          value={cardForm.cardholderName}
                          onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
                          className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Card Number *
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="4111 2222 3333 4444"
                            maxLength={19}
                            value={cardForm.cardNumber}
                            onChange={handleCardNumberChange}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 font-mono"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-extrabold text-indigo-600">
                            {getCardBrand()}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Expiry Date (MM/YY) *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="MM/YY"
                            maxLength={5}
                            value={cardForm.expiryDate}
                            onChange={handleExpiryChange}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            CVC / CVV *
                          </label>
                          <input
                            type="password"
                            required
                            placeholder="123"
                            maxLength={4}
                            value={cardForm.cvv}
                            onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "") })}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-slate-800 font-mono"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="saveCard"
                          checked={cardForm.saveCard}
                          onChange={(e) => setCardForm({ ...cardForm, saveCard: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="saveCard" className="text-[11px] font-semibold text-slate-600">
                          Save payment method for future orders
                        </label>
                      </div>
                    </div>
                  )}

                  {selectedGateway === "payhere" && (
                    <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-indigo-900">
                      <p className="font-bold">PayHere Gateway Selected</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Supports Sampath Vishwa, Commercial Bank, HNB & eZ Cash online banking.
                      </p>
                    </div>
                  )}

                  {selectedGateway === "cod" && (
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800">
                      <p className="font-bold">Pay on Delivery Selected</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Pay cash directly to courier upon delivery at your shipping address.
                      </p>
                    </div>
                  )}
                </div>
              )}
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
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      <span>Confirm & Pay Rs. {cartTotal.toFixed(2)}</span>
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
