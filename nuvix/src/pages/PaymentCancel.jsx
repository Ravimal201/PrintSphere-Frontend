import React from "react";
import PaymentButton from "../components/PaymentButton";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

/**
 * PaymentCancel Page
 * Displays:
 * - Payment Cancelled message
 * - Retry Payment button
 * - Return to Cart button
 */
export default function PaymentCancel() {
  const searchParams = new URLSearchParams(window.location.search);
  const orderId = searchParams.get("order_id");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-rose-50/20 to-slate-100 flex items-center justify-center p-6 select-none">
      <div className="bg-white border border-slate-100 rounded-3xl max-w-md w-full p-8 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in duration-200">
        
        {/* Warning Icon */}
        <div className="h-20 w-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <AlertTriangle className="h-10 w-10 stroke-[2.5]" />
        </div>

        <div>
          <span className="px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[10px] font-black uppercase tracking-wider">
            Checkout Interrupted
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-2">Payment Cancelled</h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Your Stripe checkout session was cancelled. No charges were made to your account.
          </p>
        </div>

        {orderId && (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium text-slate-600 flex justify-between items-center">
            <span className="font-bold text-slate-400 uppercase">Order ID</span>
            <span className="font-mono font-bold text-slate-800">{orderId}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {orderId ? (
            <PaymentButton
              orderId={orderId}
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Retry Payment</span>
            </PaymentButton>
          ) : (
            <button
              onClick={() => window.location.href = "/designer"}
              className="w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Return to 3D Customizer</span>
            </button>
          )}

          <button
            onClick={() => window.location.href = "/store"}
            className="w-full py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Cart / Store</span>
          </button>
        </div>

      </div>
    </div>
  );
}
