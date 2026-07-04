import { useState, useEffect } from "react";
import Navbar from "../components/Navbar/RNavbar";
import Sidebar from "../components/Sidebar/Sidebar";
import Footer from "../components/Footer/Footer";
import TShirt2D from "../components/TShirt2D";
import { ShoppingBag, Calendar, MapPin, ShieldCheck, AlertCircle } from "lucide-react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

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

  useEffect(() => {
    fetchOrders();
  }, []);

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
              <p className="text-xs text-slate-500 mt-1">Track your orders, view details, and track shipment status</p>
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
                        <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${statusColors[order.orderStatus] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
                          {order.orderStatus}
                        </span>
                        <span className="px-2.5 py-1 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1">
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

                            return (
                              <div key={idx} className="flex gap-4 py-3.5 first:pt-0 last:pb-0 items-center justify-between">
                                <div className="flex gap-4 items-center">
                                  <div className="h-16 w-16 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center p-1.5 shrink-0">
                                    {isCustom ? (
                                      <TShirt2D color={color} designUrl={image} className="h-12 w-12" />
                                    ) : (
                                      <img src={image} className="max-h-full max-w-full object-contain rounded" alt="Item preview" />
                                    )}
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
                        <div className="space-y-2 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400" /> Delivery Details
                          </h4>
                          {order.shippingAddress ? (
                            <p className="text-xs text-slate-700 font-medium leading-relaxed">
                              {order.shippingAddress.street || ""}, {order.shippingAddress.city || ""}, {order.shippingAddress.country || "Sri Lanka"}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No delivery details available</p>
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
    </div>
  );
}
