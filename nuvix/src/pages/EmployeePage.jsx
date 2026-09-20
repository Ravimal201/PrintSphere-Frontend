import { useState, useEffect } from "react";
import {
  ShoppingCart, Layers, Settings, LogOut, Loader2, AlertCircle,
  CheckCircle, Plus, Edit2, Check, X, FileText, Download, User, Sparkles,
  Clock, Ban, Play, Printer, Truck, ArrowRight, Palette, RotateCcw
} from "lucide-react";
import axios from "axios";
import { confirmAction, alertAction } from "../context/ConfirmContext";
import TShirt3DModal from "../components/TShirt3DModal";
import DesignScreenshotViewer from "../components/DesignScreenshotViewer";

import { API_BASE_URL } from "../config/api";
import { resolveColorName, formatGsm } from "../utils/colorHelper";

// Helper to determine the single next actionable status in the pipeline
const getNextPipelineAction = (currentStatus) => {
  switch (currentStatus) {
    case "Processing":
      return {
        nextStatus: "Printing",
        label: "Start Printing",
        icon: Printer,
        btnClass: "bg-purple-600 hover:bg-purple-700 text-white shadow-xs",
        desc: "Advance order to printing stage"
      };
    case "Printing":
      return {
        nextStatus: "Completed",
        label: "Complete Printing",
        icon: CheckCircle,
        btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
        desc: "Mark printing as completed"
      };
    case "Completed":
      return {
        nextStatus: "Shipped",
        label: "Ship Order",
        icon: Truck,
        btnClass: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs",
        desc: "Dispatch and mark as shipped"
      };
    case "Shipped":
    case "Delivered":
    case "Collected":
      return null;
    default:
      // When order is Pending / Paid / Assigned / not yet started in processing
      return {
        nextStatus: "Processing",
        label: "Start Processing",
        icon: Play,
        btnClass: "bg-blue-600 hover:bg-blue-700 text-white shadow-xs",
        desc: "Add order to processing"
      };
  }
};

// Helper to determine the previous reversible status in the pipeline
const getPreviousPipelineAction = (currentStatus) => {
  switch (currentStatus) {
    case "Printing":
      return {
        prevStatus: "Processing",
        label: "Back to Processing",
        icon: RotateCcw,
        desc: "Revert order status back to Processing stage"
      };
    case "Completed":
      return {
        prevStatus: "Printing",
        label: "Back to Printing",
        icon: RotateCcw,
        desc: "Revert order status back to Printing stage"
      };
    case "Shipped":
      return {
        prevStatus: "Completed",
        label: "Back to Completed",
        icon: RotateCcw,
        desc: "Revert order status back to Completed stage"
      };
    default:
      return null;
  }
};

// Helper to extract customer name, email, and phone reliably across populated and unpopulated schemas
const resolveCustomerInfo = (order) => {
  if (!order) return { name: "Customer", email: "", phone: "" };

  // 1. Customer Name
  let name = "";
  if (typeof order.customerId === "object" && order.customerId) {
    name = order.customerId.name || order.customerId.fullName || order.customerId.username || "";
  }
  if (!name && typeof order.userId === "object" && order.userId) {
    name = order.userId.name || order.userId.fullName || order.userId.username || "";
  }
  if (!name && typeof order.user === "object" && order.user) {
    name = order.user.name || order.user.fullName || order.user.username || "";
  }
  if (!name && typeof order.customer === "object" && order.customer) {
    name = order.customer.name || order.customer.fullName || "";
  }
  if (!name) {
    name = order.customerName ||
      order.guestName ||
      order.shippingAddress?.fullName ||
      order.shippingAddress?.name ||
      order.shippingAddress?.recipientName ||
      order.shippingAddress?.recipient ||
      order.billingAddress?.fullName ||
      order.billingAddress?.name ||
      "";
  }

  // 2. Customer Email
  let email = "";
  if (typeof order.customerId === "object" && order.customerId?.email) {
    email = order.customerId.email;
  } else if (typeof order.userId === "object" && order.userId?.email) {
    email = order.userId.email;
  } else if (typeof order.user === "object" && order.user?.email) {
    email = order.user.email;
  } else if (order.customerEmail) {
    email = order.customerEmail;
  } else if (order.guestEmail) {
    email = order.guestEmail;
  } else if (order.email) {
    email = order.email;
  }

  // 3. Customer Phone
  const phone = (typeof order.customerId === "object" && order.customerId?.phone) ||
    (typeof order.userId === "object" && order.userId?.phone) ||
    order.customerPhone ||
    order.shippingAddress?.phone ||
    order.phone ||
    "";

  // Fallback for name if still empty
  if (!name) {
    if (email) {
      const emailPrefix = email.split("@")[0];
      name = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    } else if (typeof order.customerId === "string" && order.customerId.length > 0) {
      name = `Customer #${order.customerId.slice(-6).toUpperCase()}`;
    } else if (order._id) {
      name = `Customer #${order._id.slice(-6).toUpperCase()}`;
    } else {
      name = "Customer";
    }
  }

  return { name, email, phone };
};

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
  const [taskSubTab, setTaskSubTab] = useState("active"); // "active" | "cancelled" | "completed"

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

  const handleUpdateStatus = async (orderId, status, isRevert = false) => {
    let cfg;
    if (isRevert) {
      cfg = {
        title: `Revert to ${status}`,
        message: `Are you sure you want to revert Order #${orderId.slice(-8)} back to "${status}" stage?`,
        confirmText: `Back to ${status}`,
        cancelText: "Cancel",
        type: "warning"
      };
    } else {
      const actionConfig = {
        Processing: {
          title: "Start Processing Order",
          message: `Are you sure you want to mark Order #${orderId.slice(-8)} as Processing and begin production preparation?`,
          confirmText: "Start Processing",
          type: "info"
        },
        Printing: {
          title: "Start Printing Order",
          message: `Are you sure you want to advance Order #${orderId.slice(-8)} to the Printing stage?`,
          confirmText: "Start Printing",
          type: "info"
        },
        Completed: {
          title: "Complete Printing Stage",
          message: `Are you sure you want to mark printing as Completed for Order #${orderId.slice(-8)}?`,
          confirmText: "Complete Printing",
          type: "success"
        },
        Shipped: {
          title: "Ship Order",
          message: `Are you sure you want to dispatch and mark Order #${orderId.slice(-8)} as Shipped?`,
          confirmText: "Ship Order",
          type: "info"
        }
      };

      cfg = actionConfig[status] || {
        title: "Update Order Status",
        message: `Are you sure you want to update Order #${orderId.slice(-8)} status to "${status}"?`,
        confirmText: "Update Status",
        type: "info"
      };
    }

    const isConfirmed = await confirmAction(cfg);
    if (!isConfirmed) return;

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const note = orderNotes[orderId] || `${isRevert ? "Reverted back" : "Status updated"} to ${status} by operator`;

    try {
      setActionLoading(prev => ({ ...prev, [orderId]: true }));
      const response = await axios.put(
        `${API_BASE_URL}/employee/orders/${orderId}/status`,
        { status, note },
        { headers }
      );

      // Merge updated order while preserving already-populated customerId and items objects
      setAssignedOrders(prev => prev.map(o => {
        if (o._id === orderId) {
          const updated = response.data?.order || {};
          const prevCustObj = (typeof o.customerId === "object" && o.customerId) ? o.customerId : null;
          const newCustObj = (typeof updated.customerId === "object" && updated.customerId) ? updated.customerId : null;
          
          return {
            ...o,
            ...updated,
            customerId: newCustObj || prevCustObj || updated.customerId || o.customerId,
            items: (updated.items && updated.items.length > 0 && typeof updated.items[0]?.designId === "object")
              ? updated.items
              : (o.items || updated.items)
          };
        }
        return o;
      }));
      setOrderNotes(prev => ({ ...prev, [orderId]: "" }));
      
      // Silently refresh employee data to guarantee all relations are fresh from DB
      fetchEmployeeData();

      await alertAction({
        title: isRevert ? "Status Reverted" : "Status Updated",
        message: `Order #${orderId.slice(-8)} status successfully ${isRevert ? "reverted" : "updated"} to "${status}"!`,
        type: "success"
      });
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
        await alertAction({
          title: isRevert ? "Revert Failed" : "Update Failed",
          message: errMsg,
          type: "danger"
        });
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
              onClick={() => {
                setActiveTab("tasks");
                setTaskSubTab("active");
                setStatusFilter("All");
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "tasks"
                ? "bg-indigo-600 text-white shadow-lg"
                : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <span className="flex items-center gap-3.5">
                <ShoppingCart className="h-4.5 w-4.5" />
                Assigned Print Tasks
              </span>
              {assignedOrders.filter(o => o.orderStatus !== "Shipped" && o.orderStatus !== "Delivered" && o.orderStatus !== "Collected" && o.orderStatus !== "Cancelled").length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-800 text-indigo-100 rounded-full">
                  {assignedOrders.filter(o => o.orderStatus !== "Shipped" && o.orderStatus !== "Delivered" && o.orderStatus !== "Collected" && o.orderStatus !== "Cancelled").length}
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
              onClick={() => window.location.href = "/designer"}
              className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition hover:bg-slate-800 hover:text-slate-200 cursor-pointer"
            >
              <Palette className="h-4.5 w-4.5 text-slate-400" />
              <span>3D Designer</span>
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
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Assigned Tasks</span>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-black text-slate-900">
                {assignedOrders.filter(o => o.orderStatus !== "Shipped" && o.orderStatus !== "Delivered" && o.orderStatus !== "Collected" && o.orderStatus !== "Cancelled").length}
              </p>
              <span className="text-xs font-semibold text-slate-500">
                active ({assignedOrders.filter(o => o.orderStatus === "Shipped" || o.orderStatus === "Delivered" || o.orderStatus === "Collected").length} completed, {assignedOrders.filter(o => o.orderStatus === "Cancelled").length} cancelled)
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-2 font-bold">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>
                {assignedOrders.filter(o => o.orderStatus !== "Shipped" && o.orderStatus !== "Delivered" && o.orderStatus !== "Collected" && o.orderStatus !== "Cancelled").length > 0
                  ? "Production in progress"
                  : "All active orders shipped"}
              </span>
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
          const isShippedOrDone = (status) => status === "Shipped" || status === "Delivered" || status === "Collected";
          const isCancelledOrder = (status) => status === "Cancelled";

          const activeOrdersList = assignedOrders.filter(o => !isShippedOrDone(o.orderStatus) && !isCancelledOrder(o.orderStatus));
          const cancelledOrdersList = assignedOrders.filter(o => isCancelledOrder(o.orderStatus));
          const completedOrdersList = assignedOrders.filter(o => isShippedOrDone(o.orderStatus));

          const currentPool = taskSubTab === "active"
            ? activeOrdersList
            : taskSubTab === "cancelled"
              ? cancelledOrdersList
              : completedOrdersList;

          const activeFilterButtons = [
            { key: "All", label: "All" },
            { key: "Processing", label: "In Progress" },
            { key: "Printing", label: "Printing" },
            { key: "Completed", label: "Complete" }
          ];

          const filteredOrders = currentPool.filter(order => {
            if (taskSubTab === "active" && statusFilter !== "All") {
              if (statusFilter === "Processing") {
                if (order.orderStatus !== "Processing" && order.orderStatus !== "Pending" && order.orderStatus !== "Assigned") {
                  return false;
                }
              } else if (order.orderStatus !== statusFilter) {
                return false;
              }
            }
            if (searchTerm.trim() !== "") {
              const s = searchTerm.toLowerCase();
              const orderIdMatches = order._id.toLowerCase().includes(s);
              const custInfo = resolveCustomerInfo(order);
              const customerMatches = custInfo.name.toLowerCase().includes(s) ||
                custInfo.email.toLowerCase().includes(s) ||
                custInfo.phone.toLowerCase().includes(s);
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
              </div>

              {/* Sub-bar for Active vs Cancelled vs Completed Orders */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
                <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl w-fit flex-wrap">
                  {/* Active Orders Sub-tab */}
                  <button
                    onClick={() => {
                      setTaskSubTab("active");
                      setStatusFilter("All");
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${taskSubTab === "active"
                        ? "bg-white text-indigo-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Active Orders</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${taskSubTab === "active" ? "bg-indigo-50 text-indigo-600" : "bg-slate-200 text-slate-600"
                      }`}>
                      {activeOrdersList.length}
                    </span>
                  </button>

                  {/* Cancelled Orders Sub-tab */}
                  <button
                    onClick={() => {
                      setTaskSubTab("cancelled");
                      setStatusFilter("All");
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${taskSubTab === "cancelled"
                        ? "bg-white text-rose-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    <Ban className="h-3.5 w-3.5" />
                    <span>Cancelled Orders</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${taskSubTab === "cancelled" ? "bg-rose-50 text-rose-600" : "bg-slate-200 text-slate-600"
                      }`}>
                      {cancelledOrdersList.length}
                    </span>
                  </button>

                  {/* Completed Orders Sub-tab */}
                  <button
                    onClick={() => {
                      setTaskSubTab("completed");
                      setStatusFilter("All");
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${taskSubTab === "completed"
                        ? "bg-white text-emerald-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    <span>Completed Orders</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${taskSubTab === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-slate-200 text-slate-600"
                      }`}>
                      {completedOrdersList.length}
                    </span>
                  </button>
                </div>

                {/* Search and Filters */}
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    type="text"
                    placeholder="Search by ID, customer, specs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50/50 w-full sm:w-52 focus:outline-none focus:border-indigo-500"
                  />
                  {taskSubTab === "active" && (
                    <div className="flex gap-1.5 overflow-x-auto py-1">
                      {activeFilterButtons.map(f => (
                        <button
                          key={f.key}
                          onClick={() => setStatusFilter(f.key)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition cursor-pointer shrink-0 ${statusFilter === f.key
                              ? "bg-indigo-600 text-white shadow-xs"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    {taskSubTab === "active" ? (
                      <Clock className="h-6 w-6 text-indigo-500" />
                    ) : taskSubTab === "cancelled" ? (
                      <Ban className="h-6 w-6 text-rose-500" />
                    ) : (
                      <CheckCircle className="h-6 w-6 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-sm text-slate-700 font-bold">
                    {taskSubTab === "active"
                      ? "No active print tasks match your criteria."
                      : taskSubTab === "cancelled"
                        ? "No cancelled print tasks found."
                        : "No completed orders found."}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {taskSubTab === "active"
                      ? "Active orders in progress will appear here."
                      : taskSubTab === "cancelled"
                        ? "Orders cancelled by managers or customers will appear here."
                        : "Orders will automatically move here once marked as Shipped or Delivered."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredOrders.map((order) => {
                    const pipelineStages = ["Processing", "Printing", "Completed", "Shipped"];
                    const currentStageIdx = pipelineStages.indexOf(order.orderStatus);
                    const nextAction = getNextPipelineAction(order.orderStatus);
                    const prevAction = getPreviousPipelineAction(order.orderStatus);
                    const isCancelled = order.orderStatus === "Cancelled";
                    const isCollected = order.orderStatus === "Collected" || order.orderStatus === "Delivered";
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
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${order.paymentStatus === "Paid"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    : "bg-amber-50 text-amber-600 border border-amber-200"
                                  }`}
                              >
                                Payment: {order.paymentStatus}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${isCancelled
                                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                                    : order.orderStatus === "Completed" || order.orderStatus === "Shipped" || isCollected
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
                              {order.review?.rating && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                  ⭐ {order.review.rating}/5 Rated
                                </span>
                              )}
                            </div>
                            {(() => {
                              const custInfo = resolveCustomerInfo(order);
                              return (
                                <p className="text-xs text-slate-500 mt-1.5 flex items-center flex-wrap gap-1">
                                  <span className="font-medium text-slate-600">Customer:</span>{" "}
                                  <span className="font-bold text-slate-900">{custInfo.name}</span>
                                  {custInfo.email && (
                                    <span className="text-slate-400 font-normal">
                                      ({custInfo.email})
                                    </span>
                                  )}
                                  {custInfo.phone && (
                                    <span className="text-slate-400 font-normal">
                                      • {custInfo.phone}
                                    </span>
                                  )}
                                </p>
                              );
                            })()}
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
                                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${item.itemType === "Customized" || item.designId
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
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${isCurrent
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
                                        className={`w-3 sm:w-6 h-0.5 mx-1 transition ${isPassed ? "bg-emerald-400" : "bg-slate-200"
                                          }`}
                                      />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Interactive Flow Updates (Sequential next step button & Revert back button) */}
                          {!isCancelled ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              {nextAction || prevAction ? (
                                <>
                                  <div className="flex-1">
                                    <input
                                      type="text"
                                      placeholder="Optional work log / operator note..."
                                      value={orderNotes[order._id] || ""}
                                      onChange={(e) => setOrderNotes(prev => ({ ...prev, [order._id]: e.target.value }))}
                                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-indigo-500"
                                    />
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
                                    {prevAction && (
                                      <button
                                        disabled={actionLoading[order._id]}
                                        onClick={() => handleUpdateStatus(order._id, prevAction.prevStatus, true)}
                                        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs hover:border-slate-300 active:scale-[0.98]"
                                        title={prevAction.desc}
                                      >
                                        {actionLoading[order._id] ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0 text-slate-500" />
                                        ) : (
                                          <prevAction.icon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                                        )}
                                        <span>{prevAction.label}</span>
                                      </button>
                                    )}

                                    {nextAction && (
                                      <button
                                        disabled={actionLoading[order._id]}
                                        onClick={() => handleUpdateStatus(order._id, nextAction.nextStatus, false)}
                                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50 active:scale-[0.98] ${nextAction.btnClass}`}
                                        title={nextAction.desc}
                                      >
                                        {actionLoading[order._id] ? (
                                          <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                                        ) : (
                                          <nextAction.icon className="h-4 w-4 shrink-0" />
                                        )}
                                        <span>{nextAction.label}</span>
                                        <ArrowRight className="h-3.5 w-3.5 opacity-80 shrink-0" />
                                      </button>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <div className="w-full flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <span>Production & Dispatch Completed ({order.orderStatus})</span>
                                  </div>
                                  <span className="text-[11px] text-slate-400 font-medium">
                                    No further pipeline updates needed
                                  </span>
                                </div>
                              )}
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
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl text-sm font-extrabold transition-all shadow-md hover:shadow-indigo-200 cursor-pointer"
                >
                  <Plus className="h-5 w-5 stroke-[2.5]" />
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
        showCustomize={false}
        allowDownloads={true}
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
