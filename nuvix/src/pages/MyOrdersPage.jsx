import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import TShirt2D from "../components/TShirt2D";
import Store3DCardPreview from "../components/Store3DCardPreview";
import TShirt3DModal from "../components/TShirt3DModal";
import PaymentButton from "../components/PaymentButton";
import { ShoppingBag, Calendar, MapPin, ShieldCheck, AlertCircle, Edit3, Plus, CheckCircle, X, Phone } from "lucide-react";
import axios from "axios";

import { API_BASE_URL } from "../config/api";

const statusColors = {
  Pending: "bg-amber-50 text-amber-700 border-amber-100",
  Processing: "bg-blue-50 text-blue-700 border-blue-100",
  Printing: "bg-indigo-50 text-indigo-700 border-indigo-100",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  Shipped: "bg-purple-50 text-purple-700 border-purple-100",
  Cancelled: "bg-rose-50 text-rose-700 border-rose-100"
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected3DDesign, setSelected3DDesign] = useState(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);

  // Dynamic User Profile & Address State
  const [user, setUser] = useState(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState(null); // null = profile default address, string = order ID
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressSuccessMsg, setAddressSuccessMsg] = useState("");
  const [addressForm, setAddressForm] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Sri Lanka",
    phone: ""
  });

  useEffect(() => {
    fetchUserProfile();
    fetchOrders();
  }, []);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem("token");
    const localUserStr = localStorage.getItem("user");

    if (localUserStr) {
      try {
        const parsed = JSON.parse(localUserStr);
        setUser(parsed);
      } catch (e) {
        console.error("Local user parse error:", e);
      }
    }

    if (!token) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
    }
  };

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login?redirect=/my-orders";
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.get(`${API_BASE_URL}/auth/orders`, { headers });
      setOrders(res.data);
    } catch (err) {
      console.error("Fetch customer orders error:", err);
      setError("Failed to load your order history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openAddressModal = (orderId = null, initialAddress = null) => {
    setTargetOrderId(orderId);
    if (initialAddress && (initialAddress.street || initialAddress.city)) {
      setAddressForm({
        street: initialAddress.street || "",
        city: initialAddress.city || "",
        state: initialAddress.state || "",
        zipCode: initialAddress.zipCode || "",
        country: initialAddress.country || "Sri Lanka",
        phone: user?.phone || ""
      });
    } else if (user?.address) {
      setAddressForm({
        street: user.address.street || "",
        city: user.address.city || "",
        state: user.address.state || "",
        zipCode: user.address.zipCode || "",
        country: user.address.country || "Sri Lanka",
        phone: user?.phone || ""
      });
    } else {
      setAddressForm({
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Sri Lanka",
        phone: user?.phone || ""
      });
    }
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    setSavingAddress(true);
    const token = localStorage.getItem("token");
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };
    const payload = {
      phone: addressForm.phone,
      street: addressForm.street,
      city: addressForm.city,
      state: addressForm.state,
      zipCode: addressForm.zipCode,
      country: addressForm.country || "Sri Lanka",
      address: {
        street: addressForm.street,
        city: addressForm.city,
        state: addressForm.state,
        zipCode: addressForm.zipCode,
        country: addressForm.country || "Sri Lanka"
      }
    };

    try {
      if (targetOrderId) {
        // Update specific order address on backend
        const res = await axios.put(`${API_BASE_URL}/auth/orders/${targetOrderId}/address`, payload, { headers });
        setOrders(orders.map(o => o._id === targetOrderId ? { ...o, shippingAddress: res.data.order?.shippingAddress || payload.address } : o));
        setAddressSuccessMsg("Order delivery address updated successfully!");
      } else {
        // Update default user profile address on backend
        const res = await axios.put(`${API_BASE_URL}/auth/profile`, payload, { headers });
        const updatedUser = res.data.user || res.data;
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        fetchOrders(); // Refresh orders to sync updated default address
        setAddressSuccessMsg("Default delivery details saved successfully!");
      }

      setIsAddressModalOpen(false);
      setTimeout(() => setAddressSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Save address error:", err);
      alert(err.response?.data?.message || "Failed to update delivery details on backend.");
    } finally {
      setSavingAddress(false);
    }
  };

  const hasDefaultAddress = Boolean(user?.address && (user.address.street || user.address.city));

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col text-slate-800 font-sans">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-8 lg:ml-72 select-none">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-black text-slate-900">My Orders</h2>
              <p className="text-xs text-slate-500 mt-1">Track your orders, manage delivery details, and view shipment status</p>
            </div>

            {/* Success Toast / Notification */}
            {addressSuccessMsg && (
              <div className="flex items-center gap-2 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold transition animate-fade-in shadow-sm">
                <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
                <span>{addressSuccessMsg}</span>
              </div>
            )}

            {/* Dynamic Default User Delivery Address Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-slate-900">Default Delivery Address</h3>
                    {hasDefaultAddress ? (
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                        Saved
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[10px] font-extrabold uppercase tracking-wide">
                        Not Set
                      </span>
                    )}
                  </div>
                  {hasDefaultAddress ? (
                    <div className="mt-1 text-xs text-slate-600 space-y-0.5">
                      <p className="font-semibold text-slate-800">
                        {[user.address.street, user.address.city, user.address.state, user.address.zipCode, user.address.country || "Sri Lanka"]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {user.phone && (
                        <p className="text-slate-500 flex items-center gap-1 font-medium text-[11px]">
                          <Phone className="h-3 w-3 text-slate-400" /> Phone: {user.phone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">
                      No delivery details configured. Set your default shipping address to ensure smooth deliveries.
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => openAddressModal(null, user?.address)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm shrink-0 cursor-pointer"
              >
                {hasDefaultAddress ? (
                  <>
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Delivery Details</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Set Delivery Details</span>
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="flex items-center gap-2 p-4 rounded-xl border border-rose-100 bg-rose-50 text-rose-600 text-sm font-semibold">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-sm space-y-4">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
                  <ShoppingBag className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-slate-900">No Orders Yet</h3>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">
                    Browse our collection or customize your own product in the 3D designer!
                  </p>
                </div>
                <a
                  href="/store"
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition shadow-sm"
                >
                  Go to Store
                </a>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order._id} className="bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden">
                    {/* Order Metadata Header */}
                    <div className="bg-slate-50/55 border-b px-6 py-4 flex flex-wrap justify-between items-center gap-4 text-xs font-semibold text-slate-500">
                      <div className="flex items-center gap-6">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Order Placed</span>
                          <div className="flex items-center gap-1 text-slate-800">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Total Price</span>
                          <span className="text-slate-800 block text-sm font-black">Rs. {order.totalCost?.toFixed(2)}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Order ID</span>
                          <span className="text-slate-800 block select-text font-mono">#{order._id.substring(order._id.length - 8).toUpperCase()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.paymentStatus === "Pending" && (
                          <div className="flex gap-2 items-center">
                            <div className="w-24">
                              <PaymentButton
                                orderId={order._id}
                                amount={order.totalCost}
                                gateway="stripe"
                                className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center justify-center cursor-pointer"
                              >
                                <span>Pay Stripe</span>
                              </PaymentButton>
                            </div>
                            <div className="w-24">
                              <PaymentButton
                                orderId={order._id}
                                amount={order.totalCost}
                                gateway="payhere"
                                className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center justify-center cursor-pointer"
                              >
                                <span>Pay PayHere</span>
                              </PaymentButton>
                            </div>
                            <div className="w-24">
                              <PaymentButton
                                orderId={order._id}
                                amount={order.totalCost}
                                gateway="paymentaccount"
                                className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-lg font-bold text-[10px] shadow-sm transition-all flex items-center justify-center cursor-pointer"
                              >
                                <span>Pay Account</span>
                              </PaymentButton>
                            </div>
                          </div>
                        )}
                        <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${statusColors[order.orderStatus] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {order.orderStatus}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full border text-xs font-bold flex items-center gap-1 ${order.paymentStatus === "Paid" ? "border-emerald-100 bg-emerald-50 text-emerald-700" : "border-amber-100 bg-amber-50 text-amber-700"}`}>
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {order.paymentStatus}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Items Info */}
                      <div className="lg:col-span-2 space-y-4">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Items Summary</h4>
                        <div className="divide-y divide-slate-100">
                          {order.items?.map((item, idx) => {
                            const isCustom = !!item.designId;
                            const image = isCustom ? item.designId?.thumbnailUrl : (item.productId?.images?.[0] || "/images/dumyImage.png");
                            const name = isCustom ? (item.designId?.tShirtType || "Custom T-Shirt") : (item.productId?.title || "Store Product");
                            const color = isCustom ? item.designId?.fabricColor : item.selectedColor;
                            const material = isCustom ? item.designId?.material : "Standard cotton";

                            const productData = isCustom
                              ? {
                                  _id: item.designId?._id || `custom-${idx}`,
                                  title: item.designId?.tShirtType || "Custom T-Shirt",
                                  tShirtType: item.designId?.tShirtType,
                                  modelPath: item.designId?.modelPath,
                                  fabricColor: item.designId?.fabricColor || color,
                                  layers: item.designId?.layers,
                                  thumbnailUrl: item.designId?.thumbnailUrl || image,
                                  images: image ? [image] : [],
                                  colors: [color || "#ffffff"],
                                }
                              : (item.productId
                                  ? {
                                      ...item.productId,
                                      colors: item.productId.colors?.length ? item.productId.colors : [color || "#ffffff"],
                                    }
                                  : {
                                      _id: item._id || `store-${idx}`,
                                      title: name,
                                      images: image ? [image] : [],
                                      colors: [color || "#ffffff"],
                                    });

                            return (
                              <div key={idx} className="flex gap-4 py-3.5 first:pt-0 last:pb-0 items-center justify-between">
                                <div className="flex gap-4 items-center">
                                  <div className="h-20 w-20 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-center p-1 shrink-0 overflow-hidden relative shadow-2xs">
                                    <Store3DCardPreview
                                      product={productData}
                                      activeColor={color}
                                      showControls={false}
                                      hideBadge={true}
                                      fixedView="front"
                                      className="h-full w-full !p-0.5 bg-transparent !border-0 !shadow-none cursor-default"
                                    />
                                  </div>
                                  <div className="space-y-0.5">
                                    <h5 className="font-extrabold text-slate-900 text-sm capitalize">{name}</h5>
                                    <div className="flex gap-1.5 text-[10px] text-slate-400 font-semibold uppercase">
                                      <span>Size: {item.selectedSize}</span>
                                      <span>•</span>
                                      <span>Material: {material}</span>
                                      <span>•</span>
                                      <span>Qty: {item.quantity}</span>
                                    </div>
                                    {isCustom && item.designId && (
                                      <button
                                        onClick={() => {
                                          setSelected3DDesign(item.designId);
                                          setIs3DModalOpen(true);
                                        }}
                                        className="mt-1 flex items-center gap-1 text-[9px] font-black text-indigo-700 bg-indigo-50 border border-indigo-150 px-1.5 py-0.5 rounded-lg transition hover:bg-indigo-100 cursor-pointer"
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 animate-pulse" />
                                        View 3D Design
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <span className="font-extrabold text-slate-800 text-sm">Rs. {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Delivery and Timeline Tracker */}
                      <div className="space-y-6">
                        {/* Address */}
                        <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 relative group">
                          <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 text-slate-400" /> Delivery Details
                            </h4>
                            <button
                              onClick={() => openAddressModal(order._id, order.shippingAddress)}
                              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-white border border-indigo-100 px-2 py-0.5 rounded-lg shadow-2xs hover:bg-indigo-50 transition cursor-pointer"
                            >
                              <Edit3 className="h-3 w-3" />
                              <span>{order.shippingAddress?.street ? "Edit" : "Set"}</span>
                            </button>
                          </div>
                          {order.shippingAddress && (order.shippingAddress.street || order.shippingAddress.city) ? (
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                              {[order.shippingAddress.street, order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zipCode, order.shippingAddress.country || "Sri Lanka"].filter(Boolean).join(", ")}
                            </p>
                          ) : user?.address && (user.address.street || user.address.city) ? (
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                              {[user.address.street, user.address.city, user.address.state, user.address.zipCode, user.address.country || "Sri Lanka"].filter(Boolean).join(", ")}
                            </p>
                          ) : (
                            <div className="flex items-center justify-between pt-1">
                              <p className="text-xs text-slate-400 italic">No delivery details set</p>
                            </div>
                          )}
                        </div>

                        {/* Tracker */}
                        <div className="space-y-3.5">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Order Timeline</h4>
                          <div className="relative pl-5 border-l-2 border-slate-150 space-y-4">
                            {order.timeline?.map((step, sIdx) => (
                              <div key={sIdx} className="relative">
                                {/* Dot indicator */}
                                <span className="absolute -left-[27px] top-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-indigo-600 ring-4 ring-white"></span>
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-slate-800 text-xs block capitalize">{step.status}</span>
                                  <span className="text-[10px] text-slate-400 font-semibold block">{step.note}</span>
                                  {step.date && (
                                    <span className="text-[9px] text-indigo-500 font-semibold block mt-0.5">
                                      {new Date(step.date).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      <Footer withSidebarOffset />

      {/* Delivery Details Edit/Set Modal */}
      {isAddressModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {targetOrderId ? "Edit Order Delivery Details" : (hasDefaultAddress ? "Edit Default Delivery Details" : "Set Default Delivery Details")}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {targetOrderId ? `Updating shipping address for Order #${targetOrderId.substring(targetOrderId.length - 8).toUpperCase()}` : "Your address will be saved in backend for future orders"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddressModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="space-y-4 text-xs font-semibold text-slate-700">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 Main Street, Apt 4B"
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Colombo"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    State / District
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Western Province"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Postal / Zip Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 00100"
                    value={addressForm.zipCode}
                    onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sri Lanka"
                    value={addressForm.country}
                    onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +94 77 123 4567"
                  value={addressForm.phone}
                  onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 transition"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddressModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAddress}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingAddress ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Backend...</span>
                    </>
                  ) : (
                    <span>Save Delivery Details</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
