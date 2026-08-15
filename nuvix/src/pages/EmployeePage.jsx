import { useState, useEffect } from "react";
import {
  ShoppingCart, Layers, Settings, LogOut, Loader2, AlertCircle,
  CheckCircle, Plus, Edit2, Check, X, FileText, Download, User, Sparkles,
  Clock, Ban
} from "lucide-react";
import axios from "axios";
import TShirt3DModal from "../components/TShirt3DModal";
import DesignScreenshotViewer from "../components/DesignScreenshotViewer";

import { API_BASE_URL } from "../config/api";
import { resolveColorName, formatGsm } from "../utils/colorHelper";

export default function EmployeePage() {
  const [isEmployee, setIsEmployee] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" | "submissions" | "settings"

  // Data states
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Status transition notes & loaders
  const [actionLoading, setActionLoading] = useState({});
  const [orderNotes, setOrderNotes] = useState({});

  // 3D modal state for custom customer designs
  const [selected3DDesign, setSelected3DDesign] = useState(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);

  // Insufficient packaging materials alert modal state
  const [packagingAlertModal, setPackagingAlertModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    details: "",
    missingItems: []
  });

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // Search and filter states for tasks
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Employee profile details states
  const [employeeName, setEmployeeName] = useState("");
  const [employeePhone, setEmployeePhone] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStr || !token) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role === "Employee" || user.role === "Admin") {
        setIsEmployee(true);
        setEmployeeName(user.name || "");
        setEmployeePhone(user.phone || "");
        fetchEmployeeData();
      } else {
        window.location.href = "/login";
      }
    } catch (err) {
      localStorage.clear();
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");
    setProfileLoading(true);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.put(
        `${API_BASE_URL}/auth/update-profile`,
        {
          name: employeeName,
          phone: employeePhone,
          address: {
            street: "",
            city: "",
            country: "Sri Lanka"
          }
        },
        { headers }
      );
      
      const updatedUser = res.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setProfileSuccess("Profile details updated successfully!");
    } catch (err) {
      console.error("Employee profile update error:", err);
      setProfileError(err.response?.data?.message || "Failed to update profile details.");
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchEmployeeData = async () => {
    setDataLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [ordersRes, productsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/employee/orders`, { headers }),
        axios.get(`${API_BASE_URL}/employee/products`, { headers })
      ]);

      setAssignedOrders(ordersRes.data);
      setMySubmissions(productsRes.data);
    } catch (err) {
      console.error("Fetch employee dashboard error:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // ================= TASK WORKFLOW STATUS UPDATES =================

  const handleUpdateStatus = async (orderId, status) => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const note = orderNotes[orderId] || `Status updated to ${status} by operator`;

    try {
      setActionLoading(prev => ({ ...prev, [orderId]: true }));
      const response = await axios.put(
        `${API_BASE_URL}/employee/orders/${orderId}/status`,
        { status, note },
        { headers }
      );

      setAssignedOrders(prev => prev.map(o => o._id === orderId ? response.data.order : o));
      setOrderNotes(prev => ({ ...prev, [orderId]: "" }));
      alert(`Order status updated to "${status}" successfully!`);
    } catch (err) {
      console.error("Update status error:", err);
      const errMsg = err.response?.data?.message || "Failed to update status";
      const details = err.response?.data?.details;
      const missingMaterials = err.response?.data?.missingMaterials || [];

      if (details || missingMaterials.length > 0) {
        setPackagingAlertModal({
          isOpen: true,
          title: "Insufficient Packaging Materials!",
          message: errMsg,
          details: details || "",
          missingItems: missingMaterials
        });
      } else {
        alert(errMsg);
      }
    } finally {
      setActionLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };



  // ================= PASSWORD SECURITY CHANGE =================

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword !== confirmPassword) {
      setPassError("New passwords do not match.");
      return;
    }

    setPassLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.put(
        `${API_BASE_URL}/auth/change-password`,
        { currentPassword, newPassword },
        { headers }
      );
      setPassSuccess(res.data.message || "Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Password update error:", err);
      setPassError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPassLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isEmployee) return null;

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden text-slate-800">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col justify-between shrink-0 select-none text-slate-400">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              E
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide leading-none">PrintSphere</h1>
              <span className="text-[10px] text-teal-400 uppercase tracking-widest font-bold">Operator Desk</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "tasks"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <span className="flex items-center gap-3.5">
                <ShoppingCart className="h-4.5 w-4.5" />
                Assigned Print Tasks
              </span>
              {assignedOrders.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-800 text-indigo-100 rounded-full">
                  {assignedOrders.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "submissions"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <span className="flex items-center gap-3.5">
                <Layers className="h-4.5 w-4.5" />
                My Concept Designs
              </span>
              {mySubmissions.filter(p => !p.isApproved).length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-purple-500 text-white rounded-full">
                  {mySubmissions.filter(p => !p.isApproved).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "settings"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <Settings className="h-4.5 w-4.5" />
              Settings & Security
            </button>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="h-2.5 w-2.5 rounded-full bg-teal-400 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Operator Session</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 hover:border-red-500 text-xs text-red-400 font-semibold hover:bg-red-500/10 transition"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-8">

        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 select-none">
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Assigned Orders</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{assignedOrders.length} active</p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-2 font-bold">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Pending printing & package</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">My Submissions</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{mySubmissions.length} designs</p>
            <div className="flex items-center gap-1.5 text-xs text-purple-600 mt-2 font-bold">
              <Layers className="h-3.5 w-3.5" />
              <span>{mySubmissions.filter(s => s.isApproved).length} approved & published</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">System Status</span>
            <p className="text-2xl font-black text-emerald-600 mt-1">Online</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <Check className="h-3.5 w-3.5" />
              <span>Operator console synchronised</span>
            </div>
          </div>
        </div>

        {dataLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-2xl">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing database records...</span>
          </div>
        )}

        {/* ================= TAB 1: ASSIGNED TASKS ================= */}
        {activeTab === "tasks" && (() => {
          const filteredOrders = assignedOrders.filter(order => {
            if (statusFilter !== "All" && order.orderStatus !== statusFilter) {
              return false;
            }
            if (searchTerm.trim() !== "") {
              const s = searchTerm.toLowerCase();
              const orderIdMatches = order._id.toLowerCase().includes(s);
              const customerMatches = (order.customerId?.name || "").toLowerCase().includes(s) ||
                                      (order.customerId?.email || "").toLowerCase().includes(s) ||
                                      (order.guestEmail || "").toLowerCase().includes(s);
              const specMatches = order.items.some(item => 
                item.itemType?.toLowerCase().includes(s) ||
                item.tShirtStyle?.toLowerCase().includes(s) ||
                item.size?.toLowerCase().includes(s) ||
                item.selectedSize?.toLowerCase().includes(s) ||
                item.color?.toLowerCase().includes(s) ||
                item.selectedColor?.toLowerCase().includes(s) ||
                item.material?.toLowerCase().includes(s) ||
                item.gsm?.toLowerCase().includes(s)
              );
              return orderIdMatches || customerMatches || specMatches;
            }
            return true;
          });

          return (
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-indigo-600" />
                    Assigned Print Queue & Tasks
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage your assigned print queue, view design specs and 3D assets, and update order progress through the production flow.
                  </p>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Search by ID, customer, size, color..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-xs border rounded-xl px-3 py-2 bg-slate-50/50 w-full sm:w-56 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex gap-1.5 overflow-x-auto py-1">
                    {["All", "Processing", "Printing", "Completed", "Shipped"].map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition cursor-pointer shrink-0 ${
                          statusFilter === st
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-500 font-semibold">No active print orders match the filters.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => {
                    const pipelineStages = ["Processing", "Printing", "Completed", "Shipped"];
                    const currentStageIdx = pipelineStages.indexOf(order.orderStatus);
                    const isCancelled = order.orderStatus === "Cancelled";
                    const latestTimeline = order.timeline && order.timeline.length > 0 ? order.timeline[order.timeline.length - 1] : null;

                    return (
                      <div
                        key={order._id}
                        className="border border-slate-200/80 rounded-2xl p-5 hover:border-indigo-200 transition bg-slate-50/20"
                      >
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-dashed">
                          <div>
                            <div className="flex items-center flex-wrap gap-2.5">
                              <span className="text-xs font-bold text-slate-700">
                                Order ID: <span className="font-mono text-indigo-600">#{order._id.slice(-8)}</span>
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  order.paymentStatus === "Paid"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : "bg-amber-50 text-amber-600 border border-amber-200"
                                }`}
                              >
                                Payment: {order.paymentStatus}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  isCancelled
                                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                                    : order.orderStatus === "Completed" || order.orderStatus === "Shipped"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : order.orderStatus === "Printing"
                                    ? "bg-purple-50 text-purple-600 border border-purple-200"
                                    : order.orderStatus === "Processing"
                                    ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                                    : "bg-slate-100 text-slate-700 border border-slate-200"
                                }`}
                              >
                                Status: {order.orderStatus}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 flex items-center flex-wrap gap-1">
                              <span className="font-medium text-slate-600">Customer:</span>{" "}
                              <span className="font-bold text-slate-900">
                                {order.customerId?.name ||
                                  (typeof order.customerId === "object" && order.customerId?.email) ||
                                  order.guestEmail ||
                                  "Unknown"}
                              </span>
                              {order.customerId?.name && (order.customerId?.email || order.guestEmail) ? (
                                <span className="text-slate-400 font-normal">
                                  ({order.customerId?.email || order.guestEmail})
                                </span>
                              ) : null}
                            </p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-lg font-black text-slate-900">
                              Rs. {(order.totalCost || 0).toFixed(2)}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1 md:justify-end">
                              <Clock className="h-3 w-3" />
                              Assigned: {new Date(order.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {/* Details Grid: Left 2 cols for Multi-Angle Design Visualizer & Specs, Right col for Shipping & Task Info */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
                          {/* Left 2 Cols: Items, Specifications & Multi-Angle Screenshots (Front, Back, Both Sides) */}
                          <div className="lg:col-span-2 space-y-4">
                            <div>
                              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                                Print Specifications & Multi-Angle Screenshots
                              </h4>
                              <div className="space-y-4">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="bg-white p-4 border rounded-2xl shadow-xs space-y-3"
                                  >
                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                                      <div>
                                        <p className="font-extrabold text-slate-900 text-sm">
                                          {item.tShirtStyle || (item.itemType ? `${item.itemType} T-shirt` : "T-Shirt")} (x{item.quantity})
                                        </p>
                                        <p className="text-slate-500 text-xs mt-0.5">
                                          Style: <span className="font-semibold text-slate-700">{item.tShirtStyle || "Crew Neck"}</span> | 
                                          Size: <span className="font-semibold text-slate-700">{item.selectedSize || item.size}</span> | 
                                          Color: <span className="font-semibold text-slate-700">{resolveColorName(item.selectedColor || item.color)}</span> | 
                                          GSM: <span className="font-semibold text-slate-700">{formatGsm(item.gsm || item.material || "GSM 180")}</span>
                                        </p>
                                      </div>
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                                        item.itemType === "Customized" || item.designId
                                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                                          : "bg-blue-50 text-blue-700 border border-blue-200"
                                      }`}>
                                        {item.itemType === "Customized" || item.designId ? "Custom 3D Print" : "Ready-Made Product"}
                                      </span>
                                    </div>

                                    {/* Multi-Angle Design Screenshots Component (Front, Back, Left Side, Right Side, All Angles) */}
                                    <DesignScreenshotViewer
                                      item={item}
                                      orderId={order._id}
                                      onOpen3DModal={(designToOpen) => {
                                        setSelected3DDesign(designToOpen);
                                        setIs3DModalOpen(true);
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Col: Shipping Destination & Task Assignment */}
                          <div className="space-y-4">
                            {/* Shipping Destination */}
                            <div>
                              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                                Shipping Destination
                              </h4>
                              {order.shippingAddress ? (
                                <p className="text-xs text-slate-600 leading-relaxed bg-white p-3.5 border rounded-2xl shadow-2xs">
                                  {order.shippingAddress.street},{" "}
                                  {order.shippingAddress.city},{" "}
                                  {order.shippingAddress.country}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 bg-white p-3.5 border rounded-2xl shadow-2xs">
                                  Address not specified
                                </p>
                              )}
                            </div>

                            {/* Assigned Operator / Work Status */}
                            <div>
                              <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                                Task Assignment & Logging
                              </h4>
                              <div className="bg-white border rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                                <div className="flex items-center gap-2.5">
                                  <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    <User className="h-4 w-4" />
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-slate-900">
                                      Assigned to You
                                    </p>
                                    <p className="text-[10px] text-teal-600 font-semibold">
                                      Active Print Task
                                    </p>
                                  </div>
                                </div>
                                {latestTimeline?.note && (
                                  <p className="text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <span className="font-bold text-slate-800">Latest Log:</span> {latestTimeline.note}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pipeline Stepper & Interactive Status Updates */}
                        <div className="pt-4 border-t border-dashed space-y-3">
                          {/* Stepper Progress */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                              Production Pipeline Status:
                            </span>
                            {isCancelled && (
                              <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                                <Ban className="h-3.5 w-3.5" /> This order was cancelled by the manager.
                              </span>
                            )}
                          </div>

                          {!isCancelled && (
                            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
                              {pipelineStages.map((stage, sIdx) => {
                                const isPassed = currentStageIdx > sIdx;
                                const isCurrent = currentStageIdx === sIdx;

                                return (
                                  <div key={stage} className="flex items-center shrink-0">
                                    <div
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                                        isCurrent
                                          ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-200"
                                          : isPassed
                                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                          : "bg-slate-100 text-slate-400 border border-slate-200"
                                      }`}
                                    >
                                      {isPassed ? (
                                        <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                      ) : isCurrent ? (
                                        <div className="h-2 w-2 rounded-full bg-white animate-ping shrink-0" />
                                      ) : (
                                        <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0" />
                                      )}
                                      <span>{stage}</span>
                                    </div>
                                    {sIdx < pipelineStages.length - 1 && (
                                      <div
                                        className={`w-3 sm:w-6 h-0.5 mx-1 transition ${
                                          isPassed ? "bg-emerald-400" : "bg-slate-200"
                                        }`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Interactive Flow Updates (Processing -> Printing -> Completed -> Shipped) */}
                          {!isCancelled ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder="Optional work log / operator note..."
                                  value={orderNotes[order._id] || ""}
                                  onChange={(e) => setOrderNotes(prev => ({ ...prev, [order._id]: e.target.value }))}
                                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                                  Update to:
                                </span>
                                {pipelineStages.map((st) => (
                                  <button
                                    key={st}
                                    disabled={actionLoading[order._id]}
                                    onClick={() => handleUpdateStatus(order._id, st)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition cursor-pointer disabled:opacity-50 ${
                                      order.orderStatus === st
                                        ? "bg-indigo-600 text-white shadow-xs"
                                        : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold flex items-center gap-2">
                              <Ban className="h-4 w-4 text-rose-500 shrink-0" />
                              <span>Order cancelled. Production updates are disabled.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ================= TAB 2: MY SUBMISSIONS ================= */}
        {activeTab === "submissions" && (
          <div className="space-y-8">
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-indigo-600" />
                  My Product Designs & Submissions
                </h3>
                <button
                  onClick={() => window.location.href = "/designer"}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Open 3D Designer
                </button>
              </div>

              {/* Informational Banner */}
              <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-700 select-none">
                <Sparkles className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-slate-900">Create Concepts in the 3D Customizer</p>
                  <p className="text-slate-500 mt-1">
                    Click the <strong>Open 3D Designer</strong> button above to launch the workspace. After selecting shirt properties and decal details, click the <strong>Submit to Manager</strong> button in the designer header to specify details and propose a baseline catalog price.
                  </p>
                </div>
              </div>

              {mySubmissions.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-500 font-semibold">You have not submitted any design concepts yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        <th className="pb-3">Title</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Proposed Base Price</th>
                        <th className="pb-3">Sizes</th>
                        <th className="pb-3">Approval Status</th>
                        <th className="pb-3">Publish State</th>
                        <th className="pb-3">Submitted On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySubmissions.map((p) => (
                        <tr key={p._id} className="border-b last:border-b-0 hover:bg-slate-50/50 transition">
                          <td className="py-4 font-bold text-slate-900">{p.title}</td>
                          <td className="py-4 text-xs text-slate-600">{p.category}</td>
                          <td className="py-4 text-xs font-bold text-slate-950">Rs. {p.basePrice.toFixed(2)}</td>
                          <td className="py-4 text-xs text-slate-500">{(p.sizes || []).join(", ")}</td>
                          <td className="py-4 text-xs">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${p.isApproved
                                ? "bg-emerald-50 text-emerald-600"
                                : p.status === "Archived"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}>
                              {p.isApproved ? "Approved" : p.status === "Archived" ? "Rejected" : "Awaiting Review"}
                            </span>
                          </td>
                          <td className="py-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${p.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                              }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 text-xs text-slate-400">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


          </div>
        )}

        {/* ================= TAB 3: SETTINGS ================= */}
        {activeTab === "settings" && (
          <div className="bg-white border rounded-3xl p-6 shadow-sm max-w-md space-y-8">
            <div>
              <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-indigo-600" />
                Settings & Account Security
              </h3>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider border-b pb-1 mb-4">
                  Profile Information
                </h4>

                {profileError && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}
                {profileSuccess && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Full Name</label>
                  <input
                    type="text"
                    required
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone Number</label>
                  <input
                    type="text"
                    value={employeePhone}
                    onChange={(e) => setEmployeePhone(e.target.value)}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={profileLoading}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    {profileLoading ? "Saving..." : "Save Profile Details"}
                  </button>
                </div>
              </form>
            </div>

            <div className="border-t pt-6">
              <form onSubmit={handleChangePassword} className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider border-b pb-1 mb-4">
                  Change Password
                </h4>

              {passError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passError}</span>
                </div>
              )}
              {passSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{passSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Current Password</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  {passLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
            </div>
          </div>
        )}

      </div>

      {/* 3D Model Modal for viewing custom customer designs */}
      <TShirt3DModal
        isOpen={is3DModalOpen}
        onClose={() => {
          setIs3DModalOpen(false);
          setSelected3DDesign(null);
        }}
        design={selected3DDesign}
      />

      {/* Insufficient Packaging Materials Alert Modal */}
      {packagingAlertModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-100 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="h-12 w-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">{packagingAlertModal.title}</h3>
                <p className="text-xs text-rose-600 font-semibold">{packagingAlertModal.message}</p>
              </div>
            </div>

            {packagingAlertModal.missingItems && packagingAlertModal.missingItems.length > 0 && (
              <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 space-y-2.5">
                <p className="text-xs font-bold text-rose-900 uppercase tracking-wide">Packaging Shortage Breakdown:</p>
                <div className="space-y-1.5">
                  {packagingAlertModal.missingItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs bg-white/80 px-3 py-2 rounded-xl border border-rose-100 shadow-2xs">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="font-semibold text-rose-600">
                        Required: <span className="font-extrabold">{item.required}</span> | Available: <span className="font-extrabold">{item.available}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setPackagingAlertModal({ isOpen: false, title: "", message: "", details: "", missingItems: [] })}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                Close & Notify Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
