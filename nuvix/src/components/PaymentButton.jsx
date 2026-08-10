import React, { useState } from "react";
import { createCheckoutSession, processAccountPayment } from "../services/paymentService";
import { CreditCard, Loader2, Wallet, X } from "lucide-react";

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    provider: "",
    accountType: "Bank Account",
    accountNumber: "",
    holderName: "",
    pin: ""
  });
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardholderName: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    brand: "CARD"
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

  const handlePayment = async () => {
    if (!orderId) {
      const err = "Order ID is missing. Please create an order first.";
      setErrorMessage(err);
      if (onError) onError(err);
      return;
    }

    if (gateway.toLowerCase() === "paymentaccount") {
      setErrorMessage("");
      setIsModalOpen(true);
      return;
    }

    if (gateway.toLowerCase() === "stripe" || gateway.toLowerCase() === "card") {
      setErrorMessage("");
      setIsCardModalOpen(true);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      // Save pending order ID and redirect to Payment Portal page
      localStorage.setItem("printsphere_pending_order_id", orderId);
      window.location.href = `/payment?order_id=${orderId}`;
    } catch (err) {
      const msg = err.message || err.error || "Failed to navigate to payment portal.";
      setErrorMessage(msg);
      setLoading(false);
      if (onError) onError(msg);
    }
  };

  const getLoadingText = () => {
    if (gateway.toLowerCase() === "payhere") {
      return "Opening PayHere...";
    } else if (gateway.toLowerCase() === "paymentaccount") {
      return "Processing...";
    }
    return "Redirecting to Stripe...";
  };

  const handleAccountPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!accountDetails.provider || !accountDetails.accountNumber || !accountDetails.holderName) {
      alert("Please fill in all payment account details.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await processAccountPayment(orderId, accountDetails);
      setIsModalOpen(false);
      if (onSuccess) onSuccess(data);
      window.location.href = `/payment/success?order_id=${orderId}&gateway=paymentaccount`;
    } catch (err) {
      const msg = err.message || err.error || "Failed to process payment account payment.";
      setErrorMessage(msg);
      setLoading(false);
      if (onError) onError(msg);
    }
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
    setCardDetails({ ...cardDetails, cardNumber: formatted, brand: getCardBrand(formatted) });
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardDetails({ ...cardDetails, expiryDate: raw });
  };

  const getCardBrand = (numString = "") => {
    const num = (numString || cardDetails.cardNumber).replace(/\s/g, "");
    if (num.startsWith("4")) return "VISA";
    if (/^5[1-5]/.test(num)) return "MASTERCARD";
    if (/^3[47]/.test(num)) return "AMEX";
    return "CARD";
  };

  const handleCardPaymentSubmit = async (e) => {
    e.preventDefault();
    const cleanNum = cardDetails.cardNumber.replace(/\s/g, "");
    if (cleanNum.length < 15) {
      alert("Please enter a valid card number.");
      return;
    }
    if (!cardDetails.expiryDate || cardDetails.expiryDate.length < 5) {
      alert("Please enter a valid expiry date (MM/YY).");
      return;
    }
    if (!cardDetails.cvv || cardDetails.cvv.length < 3) {
      alert("Please enter a valid CVV code.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      const data = await processCardPayment(orderId, {
        ...cardDetails,
        brand: getCardBrand()
      });
      setIsCardModalOpen(false);
      if (onSuccess) onSuccess(data);
      window.location.href = `/payment/success?order_id=${orderId}&gateway=card`;
    } catch (err) {
      const msg = err.message || err.error || "Failed to process card payment.";
      setErrorMessage(msg);
      setLoading(false);
      if (onError) onError(msg);
    }
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
              {gateway.toLowerCase() === "paymentaccount" ? (
                <Wallet className="h-4 w-4 text-white" />
              ) : (
                <CreditCard className="h-4 w-4 text-white" />
              )}
              <span>Pay with {gateway.toLowerCase() === "payhere" ? "PayHere" : gateway.toLowerCase() === "paymentaccount" ? "Account" : "Card"} {amount ? `(Rs. ${Number(amount).toFixed(2)})` : ""}</span>
            </>
          )
        )}
      </button>

      {errorMessage && (
        <p className="text-xs text-rose-500 font-semibold text-center mt-1">
          {errorMessage}
        </p>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition cursor-pointer animate-none bg-transparent border-none p-0 outline-none"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 select-none">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base leading-tight">Pay with Account</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Enter account details below</p>
              </div>
            </div>

            <form onSubmit={handleAccountPaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">PROVIDER NAME</label>
                  <input
                    type="text"
                    placeholder="Commercial Bank, PayPal..."
                    value={accountDetails.provider}
                    onChange={(e) => setAccountDetails({...accountDetails, provider: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">ACCOUNT TYPE</label>
                  <select
                    value={accountDetails.accountType}
                    onChange={(e) => setAccountDetails({...accountDetails, accountType: e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold cursor-pointer"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
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
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-1/2 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer text-center bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Pay Rs. {Number(amount).toFixed(2)}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCardModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl shadow-2xl p-6 relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <button
              type="button"
              onClick={() => setIsCardModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition cursor-pointer bg-transparent border-none p-0 outline-none animate-none"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-5 select-none">
              <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base leading-tight">Pay with Card</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Enter credit or debit card details</p>
              </div>
            </div>

            <form onSubmit={handleCardPaymentSubmit} className="space-y-4">
              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1">CARDHOLDER NAME</label>
                <input
                  type="text"
                  placeholder="e.g. Alice Cooper"
                  value={cardDetails.cardholderName}
                  onChange={(e) => setCardDetails({...cardDetails, cardholderName: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 block mb-1">CARD NUMBER</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="4111 2222 3333 4444"
                    maxLength={19}
                    value={cardDetails.cardNumber}
                    onChange={handleCardNumberChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                    required
                  />
                  <span className="absolute right-3 top-2.5 text-[9px] font-black text-indigo-600 tracking-wider">
                    {cardDetails.brand}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">EXPIRY DATE (MM/YY)</label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    value={cardDetails.expiryDate}
                    onChange={handleExpiryChange}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 block mb-1">CVC / CVV</label>
                  <input
                    type="password"
                    placeholder="123"
                    maxLength={4}
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({...cardDetails, cvv: e.target.value.replace(/\D/g, "")})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-800 focus:outline-none focus:border-indigo-500 font-semibold font-mono"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-3 select-none">
                <button
                  type="button"
                  onClick={() => setIsCardModalOpen(false)}
                  className="w-1/2 py-3 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer text-center bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Pay Rs. {Number(amount).toFixed(2)}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
