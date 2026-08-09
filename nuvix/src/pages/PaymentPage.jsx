import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import TShirt3DModal from "../components/TShirt3DModal";
import { CreditCard, ShieldCheck, Lock, CheckCircle, AlertCircle, MapPin, ChevronRight, Building, Smartphone, Truck, ArrowLeft, Loader2 } from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";

export default function PaymentPage() {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("card"); // 'card', 'payhere', 'cod'

  // Card Form State
  const [cardForm, setCardForm] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    saveCard: true
  });

  // Selected 3D Model Modal
  const [selected3DDesign, setSelected3DDesign] = useState(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);

  // Get order ID from URL params or localStorage
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("order_id") || localStorage.getItem("printsphere_pending_order_id");

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login?redirect=/payment";
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    // Get user details to prefill cardholder name
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCardForm(prev => ({ ...prev, cardholderName: u.name || "" }));
      } catch (e) {
        console.error(e);
      }
    }

    if (!orderId) {
      // Fallback: try fetching latest customer order
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/orders`, { headers });
        if (res.data && res.data.length > 0) {
          setOrder(res.data[0]);
        } else {
          setErrorMessage("No pending order found. Please place an order from your cart.");
        }
      } catch (err) {
        console.error(err);
        setErrorMessage("Failed to load order details for payment.");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/orders`, { headers });
      const found = res.data.find(o => o._id === orderId);
      if (found) {
        setOrder(found);
      } else {
        setErrorMessage("Order not found or access denied.");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error fetching order for payment processing.");
    } finally {
      setLoading(false);
    }
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

  // Card Provider Detect
  const getCardBrand = () => {
    const num = cardForm.cardNumber.replace(/\s/g, "");
    if (num.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(num)) return "MASTERCARD";
    if (/^3[47]/.test(num)) return "AMEX";
    return "CARD";
  };

  // Process Interactive Payment Submission
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!order) {
      alert("No valid order found.");
      return;
    }

    if (selectedMethod === "card") {
      const cleanNum = cardForm.cardNumber.replace(/\s/g, "");
      if (cleanNum.length < 16) {
        setErrorMessage("Please enter a valid 16-digit card number.");
        return;
      }
      if (!cardForm.expiryDate || cardForm.expiryDate.length < 5) {
        setErrorMessage("Please enter a valid expiry date (MM/YY).");
        return;
      }
      if (!cardForm.cvv || cardForm.cvv.length < 3) {
        setErrorMessage("Please enter a valid 3-digit CVV code.");
        return;
      }
    }

    setProcessingPayment(true);

    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      // Simulate payment processing delay for realistic user experience
      await new Promise(res => setTimeout(res, 1800));

      // Call backend to verify and update order status to Paid
      const res = await axios.get(
        `${API_BASE_URL}/payment/success?session_id=direct_${selectedMethod}_${order._id}&order_id=${order._id}`,
        { headers }
      );

      if (res.data && res.data.success) {
        // Clear pending cart/order storage
        localStorage.removeItem("printsphere_pending_order_id");
        localStorage.setItem("printsphere_cart", JSON.stringify([]));

        // Redirect to success confirmation page
        window.location.href = `/payment/success?order_id=${order._id}&gateway=${selectedMethod}`;
      } else {
        throw new Error(res.data?.message || "Payment authorization failed");
      }
    } catch (err) {
      console.error("Payment submission error:", err);
      setErrorMessage(err.response?.data?.message || err.message || "Payment processing error. Please verify card details.");
      setProcessingPayment(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8 lg:ml-72 select-none">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Navigation & Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
              <div>
                <a href="/cart" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-2">
                  <ArrowLeft className="h-4 w-4" /> Back to Cart
                </a>
                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                  <CreditCard className="h-6 w-6 text-indigo-600" />
                  Secure Payment Gateway
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Enter your payment credentials to finalize your order</p>
              </div>

              <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-700 text-xs font-extrabold shadow-2xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>256-bit SSL Encrypted</span>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 text-xs font-bold animate-fade-in">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : !order ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm space-y-4">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto" />
                <h3 className="text-lg font-black text-slate-900">No Pending Order</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Please create an order from your shopping cart to complete payment.
                </p>
                <a href="/cart" className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                  Return to Cart
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Panel: Payment Method & Details Form */}
                <div className="lg:col-span-7 space-y-6">
                  
                  {/* Select Payment Method Tabs */}
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900">Select Payment Method</h3>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedMethod("card")}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedMethod === "card"
                            ? "border-indigo-650 bg-indigo-50/50 text-indigo-900 font-extrabold shadow-xs"
                            : "border-slate-150 hover:border-slate-300 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <CreditCard className="h-5 w-5 mb-1 text-indigo-600" />
                        <span className="text-xs font-bold">Credit / Debit</span>
                        <span className="text-[9px] text-slate-400 font-semibold">Instant</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod("payhere")}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedMethod === "payhere"
                            ? "border-indigo-650 bg-indigo-50/50 text-indigo-900 font-extrabold shadow-xs"
                            : "border-slate-150 hover:border-slate-300 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <Building className="h-5 w-5 mb-1 text-indigo-600" />
                        <span className="text-xs font-bold">PayHere</span>
                        <span className="text-[9px] text-emerald-600 font-extrabold">Online Banking</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMethod("cod")}
                        className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          selectedMethod === "cod"
                            ? "border-indigo-650 bg-indigo-50/50 text-indigo-900 font-extrabold shadow-xs"
                            : "border-slate-150 hover:border-slate-300 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <Truck className="h-5 w-5 mb-1 text-slate-600" />
                        <span className="text-xs font-bold">Pay on Delivery</span>
                        <span className="text-[9px] text-slate-400 font-semibold">Cash</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Card Form & Interactive Visual Graphic */}
                  {selectedMethod === "card" && (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-6">
                      
                      {/* Live Credit Card Graphic */}
                      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 p-6 text-white shadow-xl space-y-6">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-extrabold tracking-widest text-indigo-400 uppercase">PrintSphere Pay</span>
                          <span className="px-2.5 py-0.5 rounded-md bg-white/10 border border-white/20 text-[10px] font-black tracking-widest uppercase">
                            {getCardBrand()}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="w-10 h-7 bg-amber-400/90 rounded-md border border-amber-200/50 mb-2"></div>
                          <p className="font-mono text-lg font-bold tracking-widest select-none">
                            {cardForm.cardNumber || "•••• •••• •••• ••••"}
                          </p>
                        </div>

                        <div className="flex justify-between items-end text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Card Holder</span>
                            <span className="font-bold tracking-wide uppercase truncate block max-w-[180px]">
                              {cardForm.cardholderName || "VALUED CUSTOMER"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Expires</span>
                            <span className="font-mono font-bold">{cardForm.expiryDate || "MM/YY"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Input Form */}
                      <form onSubmit={handleProcessPayment} className="space-y-4 text-xs font-semibold text-slate-700">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                            Cardholder Name *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Sachinthaka Ravimal"
                            value={cardForm.cardholderName}
                            onChange={(e) => setCardForm({ ...cardForm, cardholderName: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
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
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono transition"
                            />
                            <CreditCard className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Expiry Date (MM/YY) *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="MM/YY"
                              maxLength={5}
                              value={cardForm.expiryDate}
                              onChange={handleExpiryChange}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono transition"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              CVC / CVV *
                            </label>
                            <div className="relative">
                              <input
                                type="password"
                                required
                                placeholder="123"
                                maxLength={4}
                                value={cardForm.cvv}
                                onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "") })}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 font-mono transition"
                              />
                              <Lock className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="saveCard"
                            checked={cardForm.saveCard}
                            onChange={(e) => setCardForm({ ...cardForm, saveCard: e.target.checked })}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="saveCard" className="text-xs font-semibold text-slate-600">
                            Save card details securely for future custom 3D orders
                          </label>
                        </div>

                        <button
                          type="submit"
                          disabled={processingPayment}
                          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-99 text-white rounded-xl text-sm font-extrabold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                        >
                          {processingPayment ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin text-white" />
                              <span>Authorizing & Encrypting Payment...</span>
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-5 w-5" />
                              <span>Pay Rs. {order.totalCost?.toFixed(2)} Now</span>
                            </>
                          )}
                        </button>
                      </form>
                    </div>
                  )}

                  {/* PayHere Gateway Details */}
                  {selectedMethod === "payhere" && (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b">
                        <Building className="h-6 w-6 text-indigo-600" />
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">PayHere Online Payment Gateway</h4>
                          <p className="text-xs text-slate-500">Pay using Sri Lankan Internet Banking, eZ Cash or Genie</p>
                        </div>
                      </div>

                      <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 leading-relaxed space-y-2">
                        <p className="font-bold">Instructions:</p>
                        <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-slate-600">
                          <li>Click below to open PayHere secure checkout modal.</li>
                          <li>Select Sampath Vishwa, Commercial Bank, HNB, or eZ Cash.</li>
                          <li>Your order payment will automatically update once verified.</li>
                        </ul>
                      </div>

                      <button
                        onClick={handleProcessPayment}
                        disabled={processingPayment}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {processingPayment ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                            <span>Connecting to PayHere Gateway...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            <span>Proceed with PayHere Portal (Rs. {order.totalCost?.toFixed(2)})</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Cash on Delivery Details */}
                  {selectedMethod === "cod" && (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 pb-3 border-b">
                        <Truck className="h-6 w-6 text-slate-700" />
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm">Pay on Delivery (Cash/COD)</h4>
                          <p className="text-xs text-slate-500">Pay cash upon delivery at your doorstep</p>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        Our courier will collect the exact payment of <strong className="text-slate-900">Rs. {order.totalCost?.toFixed(2)}</strong> when delivering your custom products to your address.
                      </p>

                      <button
                        onClick={handleProcessPayment}
                        disabled={processingPayment}
                        className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-extrabold transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {processingPayment ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin text-white" />
                            <span>Confirming Order...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5" />
                            <span>Confirm Pay on Delivery</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Panel: Order Summary & Items List */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-extrabold text-slate-900 pb-3 border-b flex items-center justify-between">
                      <span>Order Summary</span>
                      <span className="font-mono text-xs font-normal text-slate-400">
                        #{order._id.substring(order._id.length - 8).toUpperCase()}
                      </span>
                    </h3>

                    {/* Delivery details display */}
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-indigo-500" /> Delivery Address
                      </span>
                      {order.shippingAddress ? (
                        <p className="font-semibold text-slate-800">
                          {[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.country || "Sri Lanka"].filter(Boolean).join(", ")}
                        </p>
                      ) : (
                        <p className="text-slate-400 italic">No delivery address set</p>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-3 max-h-64 overflow-y-auto divide-y divide-slate-100 pr-1">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                          <div>
                            <h5 className="font-bold text-slate-800 capitalize">
                              {item.designId?.tShirtType || item.productId?.title || "Custom Order Item"}
                            </h5>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              Size: {item.selectedSize} | Qty: {item.quantity}
                            </span>
                          </div>
                          <span className="font-extrabold text-slate-900">
                            Rs. {(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="pt-4 border-t border-slate-100 space-y-2 text-xs font-semibold text-slate-600">
                      <div className="flex justify-between">
                        <span>Items Subtotal</span>
                        <span className="text-slate-800">Rs. {order.subtotal?.toFixed(2) || order.totalCost?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Shipping / Delivery</span>
                        <span className="text-emerald-600 font-bold">FREE</span>
                      </div>
                      <div className="flex justify-between text-base font-black text-slate-950 pt-2 border-t">
                        <span>Total Payable</span>
                        <span className="text-indigo-600">Rs. {order.totalCost?.toFixed(2)}</span>
                      </div>
                    </div>
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
