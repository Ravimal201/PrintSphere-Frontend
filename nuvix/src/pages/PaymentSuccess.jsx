import React, { useEffect, useState } from "react";
import { verifyPaymentSuccess } from "../services/paymentService";
import { CheckCircle2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";

/**
 * PaymentSuccess Page
 * Displays:
 * - Payment Successful banner
 * - Order ID
 * - Transaction ID
 * - Amount Paid
 * - Continue Shopping button
 */
export default function PaymentSuccess() {
  const searchParams = new URLSearchParams(window.location.search);
  const sessionId = searchParams.get("session_id");
  const orderId = searchParams.get("order_id");
  const gateway = searchParams.get("gateway") || "stripe";
 
  const [loading, setLoading] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [error, setError] = useState("");
 
  useEffect(() => {
    const verify = async () => {
      if (!sessionId && !orderId) {
        setLoading(false);
        return;
      }
      try {
        const res = await verifyPaymentSuccess(sessionId, orderId);
        if (res.success) {
          setPaymentData(res.payment);
          setOrderData(res.order);
        } else {
          setError(res.message || "Failed to verify payment status.");
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        setError(err.message || "Could not verify payment details.");
      } finally {
        setLoading(false);
      }
    };
 
    verify();
  }, [sessionId, orderId]);
 
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 select-none">
        <div className="bg-white border border-slate-100 rounded-3xl p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mx-auto" />
          <h2 className="text-lg font-bold text-slate-800">Verifying {gateway.toLowerCase() === "payhere" ? "PayHere" : "Stripe"} Payment...</h2>
          <p className="text-xs text-slate-400 font-medium">
            Please wait while we confirm your transaction and update your order status.
          </p>
        </div>
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/20 to-emerald-50/30 flex items-center justify-center p-6 select-none">
      <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-200">
        
        {/* Success Icon */}
        <div className="h-20 w-20 bg-emerald-100/80 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="h-10 w-10 stroke-[2.5]" />
        </div>
 
        <div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-wider">
            {gateway.toLowerCase() === "payhere" ? "PayHere" : "Stripe"} Payment Verified
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Payment Successful!</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Thank you for your purchase. Your 3D custom print order has been confirmed and sent to production.
          </p>
        </div>
 
        {error && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold">
            {error}
          </div>
        )}
 
        {/* Transaction Summary Card */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left space-y-3">
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Order ID</span>
            <span className="font-mono font-extrabold text-slate-800">
              {orderData?._id || orderId || "N/A"}
            </span>
          </div>
 
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Transaction ID</span>
            <span className="font-mono font-bold text-indigo-600 truncate max-w-[200px]">
              {paymentData?.stripePaymentIntentId || paymentData?.stripeSessionId || sessionId || "N/A"}
            </span>
          </div>
 
          <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-200/60">
            <span className="font-bold text-slate-400 uppercase tracking-wider">Payment Method</span>
            <span className="font-extrabold text-slate-800 capitalize">
              {paymentData?.paymentMethod || (gateway.toLowerCase() === "payhere" ? "PayHere Checkout" : "Stripe Sandbox Card")}
            </span>
          </div>

          <div className="flex justify-between items-center text-sm pt-1">
            <span className="font-extrabold text-slate-700">Amount Paid</span>
            <span className="text-base font-black text-emerald-600">
              Rs. {Number(paymentData?.amount || orderData?.totalCost || 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Continue Shopping Button */}
        <button
          onClick={() => window.location.href = "/store"}
          className="w-full py-4 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/25 transition duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98 text-sm"
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Continue Shopping</span>
          <ArrowRight className="h-4 w-4 ml-1" />
        </button>
      </div>
    </div>
  );
}
