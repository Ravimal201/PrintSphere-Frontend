import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import TShirt2D from "../components/TShirt2D";
import TShirt3DModal from "../components/TShirt3DModal";
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle, ShoppingBag, CheckCircle, Loader2, Wallet } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { processAccountPayment } from "../services/paymentService";

export default function CartPage() {
  const [cart, setCart] = useState([]);
  const [pricingRules, setPricingRules] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selected3DDesign, setSelected3DDesign] = useState(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState("stripe");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    provider: "",
    accountType: "Bank Account",
    accountNumber: "",
    holderName: "",
    pin: ""
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
      setCheckoutLoading(true);
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
      } else {
        const sessionRes = await axios.post(
          `${API_BASE_URL}/payment/create-checkout-session`,
          { orderId, gateway: "stripe" },
          { headers }
        );

        saveCart([]); // Clear cart
        setCheckoutSuccess(true);

        if (sessionRes.data && sessionRes.data.url) {
          window.location.href = sessionRes.data.url;
        } else {
          window.location.href = "/my-orders";
        }
      }
    } catch (err) {
      console.error("Checkout order error:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to process checkout. Please try again.";
      alert(errMsg);
      setCheckoutLoading(false);
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
                      onClick={handleCheckout}
                      disabled={checkoutLoading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm mt-4 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {checkoutLoading && <Loader2 className="h-4 w-4 animate-spin text-white" />}
                      {checkoutLoading ? "Processing Checkout..." : "Proceed to Checkout"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer withSidebarOffset />

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
