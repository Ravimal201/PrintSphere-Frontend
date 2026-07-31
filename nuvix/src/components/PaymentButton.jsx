import React, { useState } from "react";
import { createCheckoutSession } from "../services/paymentService";
import { CreditCard, Loader2 } from "lucide-react";

/**
 * Reusable PaymentButton Component
 * Requests Stripe checkout session URL from backend and redirects the customer to Stripe Checkout.
 */
export default function PaymentButton({
  orderId,
  amount,
  gateway = "stripe",
  className = "",
  children,
  onSuccess,
  onError
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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

  const handlePayment = async () => {
    if (!orderId) {
      const err = "Order ID is missing. Please create an order first.";
      setErrorMessage(err);
      if (onError) onError(err);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      if (gateway.toLowerCase() === "payhere") {
        // 1. Dynamically load PayHere JS SDK script
        await loadPayHereScript();

        // 2. Call backend to generate hash and parameter payload
        const data = await createCheckoutSession(orderId, "payhere");
        if (data && data.payhereParams) {
          // 3. Register PayHere event callbacks
          window.payhere.onCompleted = function (completedOrderId) {
            console.log("PayHere Checkout Completed. Order ID: " + completedOrderId);
            if (onSuccess) onSuccess(data);
            // Redirect to success URL
            window.location.href = data.payhereParams.return_url || `/payment/success?order_id=${completedOrderId}&gateway=payhere`;
          };

          window.payhere.onDismissed = function () {
            console.log("PayHere Checkout Dismissed");
            // Redirect to cancel URL
            window.location.href = data.payhereParams.cancel_url || `/payment/cancel?order_id=${orderId}`;
          };

          window.payhere.onError = function (error) {
            console.error("PayHere Checkout Error: ", error);
            setErrorMessage(error || "Payment popup encountered an error.");
            setLoading(false);
            if (onError) onError(error);
          };

          // 4. Trigger PayHere Onsite Checkout popup
          window.payhere.startPayment(data.payhereParams);
        } else {
          throw new Error("PayHere payment parameters were not returned by backend");
        }
      } else {
        // Stripe integration fallback
        const data = await createCheckoutSession(orderId, "stripe");
        if (data && data.url) {
          if (onSuccess) onSuccess(data);
          // Redirect customer to Stripe Checkout Sandbox URL
          window.location.href = data.url;
        } else {
          throw new Error("Payment checkout URL was not returned by gateway");
        }
      }
    } catch (err) {
      const msg = err.message || err.error || "Failed to initiate payment checkout. Please try again.";
      setErrorMessage(msg);
      setLoading(false);
      if (onError) onError(msg);
    }
  };

  const getLoadingText = () => {
    if (gateway.toLowerCase() === "payhere") {
      return "Opening PayHere...";
    }
    return "Redirecting to Stripe...";
  };

  return (
    <div className="flex flex-col gap-1.5 w-full select-none">
      <button
        onClick={handlePayment}
        disabled={loading || !orderId}
        className={
          className ||
          `w-full py-3.5 px-6 bg-indigo-600 hover:bg-indigo-700 active:scale-98 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer`
        }
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-white" />
            <span>{getLoadingText()}</span>
          </>
        ) : (
          children || (
            <>
              <CreditCard className="h-4 w-4 text-white" />
              <span>Pay with {gateway.toLowerCase() === "payhere" ? "PayHere" : "Card"} {amount ? `(Rs. ${Number(amount).toFixed(2)})` : ""}</span>
            </>
          )
        )}
      </button>

      {errorMessage && (
        <p className="text-xs text-rose-500 font-semibold text-center mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
