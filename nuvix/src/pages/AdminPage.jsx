import { useState, useEffect } from "react";
import { 
  Users, UserPlus, Lock, Trash2, Key, Mail, Phone, Shield, LogOut, 
  Loader2, AlertCircle, CheckCircle, BarChart3, TrendingUp, Inbox, 
  Settings, RefreshCw, Layers, ShoppingCart, Info, HardDrive, Check, Bell, Download, FileText,
  Droplets, Package, Box, Filter, Search, Tag, Plus, X,
  Star, MessageSquare, ThumbsUp, ThumbsDown, Smile, ShieldCheck, Eye, AlertTriangle, CreditCard, Printer, CheckCheck, Clock
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { formatGsm } from "../utils/colorHelper";

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("analytics"); // "analytics" | "staff" | "inventory" | "settings" | "notifications"
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("ALL"); // "ALL" | "TSHIRTS" | "INK" | "PAPERS_PACKAGING"
  const [inventorySizeFilter, setInventorySizeFilter] = useState("ALL");
  const [inventoryColorFilter, setInventoryColorFilter] = useState("ALL");
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");

  // Staff list state
  const [staff, setStaff] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  // New staff form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [phone, setPhone] = useState("");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // Password edit state
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // System Settings state
  const [sandboxPayment, setSandboxPayment] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [logLevel, setLogLevel] = useState("info");
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Live System Analytics & Notifications State
  const [notifications, setNotifications] = useState([]);
  const [notificationTypeFilter, setNotificationTypeFilter] = useState("ALL");
  const [notificationStatusFilter, setNotificationStatusFilter] = useState("ALL"); // "ALL" | "UNREAD" | "READ"
  const [notificationSearchQuery, setNotificationSearchQuery] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Inventory & Styles states (exact mirror of Manager Dashboard inventory)
  const [inventory, setInventory] = useState([]);
  const [styles, setStyles] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [restockQuantities, setRestockQuantities] = useState({});
  const [editingThresholdId, setEditingThresholdId] = useState(null);
  const [thresholdInputs, setThresholdInputs] = useState({});
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    itemType: "Plain T-Shirt",
    materialCategory: "Transfer Paper",
    tShirtType: "",
    color: "#ffffff",
    colorName: "White",
    size: "M",
    material: "GSM 180",
    quantity: 50,
    minThreshold: 15,
  });
  const [inventoryActionLoading, setInventoryActionLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [newInkColor, setNewInkColor] = useState({ name: "Cyan (C)", value: "#00ffff" });

  // Customer Satisfaction & Reviews states (Read-only for Admin)
  const [satisfactionReviews, setSatisfactionReviews] = useState([]);
  const [satisfactionStats, setSatisfactionStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    badReviewsCount: 0,
    positiveReviewsCount: 0,
    neutralReviewsCount: 0,
    satisfactionRate: 100,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [satisfactionLoading, setSatisfactionLoading] = useState(false);
  const [satisfactionFilterRating, setSatisfactionFilterRating] = useState("ALL"); // ALL | BAD | POSITIVE | NEUTRAL | 1 | 2 | 3 | 4 | 5
  const [satisfactionSearchQuery, setSatisfactionSearchQuery] = useState("");
  const [satisfactionProductFilter, setSatisfactionProductFilter] = useState("ALL");

  // Check authentication and load data on mount
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStr || !token) {
      window.location.href = "/login";
      return;
    }

    let intervalId;
    try {
      const user = JSON.parse(userStr);
      if (user.role === "Admin") {
        setIsAdmin(true);
        fetchStaff();
        fetchAnalytics();
        fetchInventory();
        fetchNotifications();
        fetchSatisfactionReviews();
        // Poll notifications every 10 seconds
        intervalId = setInterval(fetchNotifications, 10000);
      } else {
        window.location.href = "/customer-home";
      }
    } catch (err) {
      localStorage.clear();
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const fetchStaff = async () => {
    setFetchLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/staff`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStaff(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(response.data);
    } catch (err) {
      console.error("Fetch analytics error:", err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchSatisfactionReviews = async () => {
    setSatisfactionLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.get(`${API_BASE_URL}/admin/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data) {
        setSatisfactionReviews(res.data.reviews || []);
        if (res.data.stats) {
          setSatisfactionStats(res.data.stats);
        }
      }
    } catch (err) {
      console.error("Fetch satisfaction reviews error:", err);
    } finally {
      setSatisfactionLoading(false);
    }
  };

  const fetchInventory = async () => {
    setInventoryLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [invRes, stylesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/manager/inventory`, { headers }),
        axios.get(`${API_BASE_URL}/manager/tshirt-styles`, { headers }).catch(() => ({ data: [] }))
      ]);
      if (invRes.data && Array.isArray(invRes.data)) {
        setInventory(invRes.data);
      }
      if (stylesRes.data && Array.isArray(stylesRes.data)) {
        setStyles(stylesRes.data);
      }
    } catch (err) {
      console.error("Fetch inventory error:", err);
    } finally {
      setInventoryLoading(false);
    }
  };

  const handleRestockQuantity = async (itemId) => {
    const restockVal = Number(restockQuantities[itemId]);
    if (Number.isNaN(restockVal)) {
      alert("Please enter a valid number");
      return;
    }

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const item = inventory.find((i) => i._id === itemId);
      const currentQty = item?.quantity ?? 0;
      const newQty = currentQty + restockVal;

      if (newQty < 0) {
        alert("Stock is insufficient to remove that quantity");
        return;
      }

      const res = await axios.put(
        `${API_BASE_URL}/manager/inventory/${itemId}`,
        { quantity: newQty },
        { headers }
      );

      setInventory((prev) =>
        prev.map((i) => (i._id === itemId ? res.data.item : i))
      );
      setRestockQuantities((prev) => ({ ...prev, [itemId]: "" }));
      alert(
        restockVal < 0
          ? "Stock removed successfully!"
          : "Stock added successfully!"
      );
      fetchAnalytics();
    } catch (err) {
      console.error("Restock error:", err);
      alert(
        err.response?.data?.message || "Failed to update inventory quantity"
      );
    }
  };

  const handleUpdateMinThreshold = async (itemId) => {
    const thresholdValue = Number(thresholdInputs[itemId]);
    if (Number.isNaN(thresholdValue) || thresholdValue < 0) {
      alert("Please enter a valid minimum threshold");
      return;
    }

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.put(
        `${API_BASE_URL}/manager/inventory/${itemId}`,
        { minThreshold: thresholdValue },
        { headers }
      );

      setInventory((prev) =>
        prev.map((i) => (i._id === itemId ? res.data.item : i))
      );
      setEditingThresholdId(null);
      alert("Minimum threshold updated successfully!");
      fetchAnalytics();
    } catch (err) {
      console.error("Threshold update error:", err);
      alert(
        err.response?.data?.message || "Failed to update minimum threshold"
      );
    }
  };

  const handleDeleteInventory = async (itemId) => {
    if (!window.confirm("Are you sure you want to delete this inventory item?")) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.delete(`${API_BASE_URL}/manager/inventory/${itemId}`, { headers });
      setInventory((prev) => prev.filter((i) => i._id !== itemId));
      alert("Inventory item deleted successfully!");
      fetchAnalytics();
    } catch (err) {
      console.error("Delete inventory error:", err);
      alert(err.response?.data?.message || "Failed to delete inventory item");
    }
  };

  const handleSaveInventory = async (e) => {
    e.preventDefault();
    setInventoryError("");
    setInventoryActionLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const selectedStyleObj = styles.find(
        (s) => (s.name || s.type) === inventoryForm.tShirtType
      );
      const styleName = inventoryForm.tShirtType || (styles[0]?.name || styles[0]?.type || "Crew Neck");
      const chosenGsm = formatGsm(inventoryForm.material || selectedStyleObj?.gsmPrices?.[0]?.gsm || selectedStyleObj?.gsms?.[0] || "GSM 180");

      let finalItemType = inventoryForm.itemType || "Plain T-Shirt";
      if (inventoryForm.itemType === "Materials") {
        finalItemType = inventoryForm.materialCategory || "Transfer Paper";
      }

      let chosenColor = inventoryForm.colorName || inventoryForm.color || "Cyan (C)";

      const payload = {
        itemType: finalItemType,
        tShirtType: inventoryForm.itemType === "Plain T-Shirt" ? styleName : undefined,
        color: (inventoryForm.itemType === "Plain T-Shirt" || inventoryForm.itemType === "Printing Ink")
          ? chosenColor
          : undefined,
        size: inventoryForm.itemType === "Plain T-Shirt" ? (inventoryForm.size || "M") : undefined,
        material: inventoryForm.itemType === "Plain T-Shirt" ? chosenGsm : undefined,
        quantity: Number(inventoryForm.quantity) >= 0 ? Number(inventoryForm.quantity) : 0,
        minThreshold: Number(inventoryForm.minThreshold) > 0 ? Number(inventoryForm.minThreshold) : 15,
      };

      const res = await axios.post(`${API_BASE_URL}/manager/inventory`, payload, { headers });

      if (res.data && res.data.item) {
        setInventory((prev) => [res.data.item, ...prev.filter((i) => i._id !== res.data.item._id)]);
      }

      await fetchInventory();
      fetchAnalytics();

      setShowInventoryModal(false);
      setInventoryForm({
        itemType: "Plain T-Shirt",
        materialCategory: "Transfer Paper",
        tShirtType: "",
        color: "#ffffff",
        colorName: "White",
        size: "M",
        material: "GSM 180",
        quantity: 50,
        minThreshold: 15,
      });
      alert("Inventory item added successfully!");
    } catch (err) {
      console.error("Save inventory item error:", err);
      setInventoryError(err.response?.data?.message || "Failed to add inventory item.");
    } finally {
      setInventoryActionLoading(false);
    }
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data);
    } catch (err) {
      console.error("Fetch notifications error:", err);
    }
  };

  const handleMarkAsRead = async (id) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error("Mark notification read error:", err);
    }
  };

  const handleClearAllNotifications = async () => {
    const token = localStorage.getItem("token");
    try {
      await axios.post(`${API_BASE_URL}/notifications/clear`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Clear notifications error:", err);
    }
  };

  const handleExportCSV = () => {
    if (!analytics) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "PRINTSPHERE ADMIN ANALYTICS REPORT\r\n";
    csvContent += `Generated At,${new Date().toLocaleString()}\r\n\r\n`;
    csvContent += "SUMMARY METRICS\r\n";
    csvContent += `Gross Revenue,Rs. ${analytics.grossRevenue.toFixed(2)}\r\n`;
    csvContent += `Total Orders,${analytics.totalOrders}\r\n`;
    csvContent += `Custom Designs Count,${analytics.customDesigns}\r\n\r\n`;
    csvContent += "MONTHLY REVENUE TRENDS\r\n";
    csvContent += "Month,Year,Revenue (Rs.)\r\n";
    analytics.monthlyTrends.forEach(t => {
      csvContent += `${t.month},${t.year},${t.total.toFixed(2)}\r\n`;
    });
    csvContent += "\r\n";
    csvContent += "BEST SELLING PRODUCTS\r\n";
    csvContent += "Rank,Product/Design Name,Quantity Sold,Revenue\r\n";
    analytics.bestSellers.forEach(b => {
      csvContent += `${b.rank},"${b.name.replace(/"/g, '""')}",${b.sales},"${b.revenue}"\r\n`;
    });
    csvContent += "\r\n";
    csvContent += "POPULAR FABRIC COLORS\r\n";
    csvContent += "Color,Quantity Ordered,Revenue (Rs.)\r\n";
    analytics.popularColors.forEach(c => {
      csvContent += `${c.color},${c.count},Rs. ${(c.revenue || 0).toFixed(2)}\r\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `printsphere_analytics_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setFormLoading(true);

    const token = localStorage.getItem("token");

    try {
      await axios.post(
        `${API_BASE_URL}/admin/create-staff`,
        { name, email, password, role, phone },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setFormSuccess(`${role} account created successfully!`);
      setName("");
      setEmail("");
      setPassword("");
      setPhone("");
      fetchStaff();
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to create staff account.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    const token = localStorage.getItem("token");

    try {
      await axios.delete(`${API_BASE_URL}/admin/delete-staff/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchStaff();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to delete staff account.");
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");
    setPassLoading(true);

    const token = localStorage.getItem("token");

    try {
      await axios.put(
        `${API_BASE_URL}/admin/update-staff-password`,
        { userId: selectedStaff._id, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setPassSuccess("Password updated successfully!");
      setNewPassword("");
      setTimeout(() => {
        setSelectedStaff(null);
        setPassSuccess("");
      }, 1500);
    } catch (err) {
      console.error(err);
      setPassError(err.response?.data?.message || "Failed to update password.");
    } finally {
      setPassLoading(false);
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setSettingsSuccess(true);
    setTimeout(() => setSettingsSuccess(false), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const getSvgPathData = () => {
    if (!analytics || !analytics.monthlyTrends || analytics.monthlyTrends.length === 0) {
      return { linePath: "", areaPath: "", points: [] };
    }
    const trends = analytics.monthlyTrends;
    const maxVal = Math.max(...trends.map(t => t.total), 1000);
    const points = trends.map((item, idx) => {
      const x = 50 + idx * 140;
      const y = 200 - (item.total / maxVal) * 160;
      return { x, y, ...item };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    let areaPath = `M ${points[0].x} 220 L ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      areaPath += ` L ${points[i].x} ${points[i].y}`;
    }
    areaPath += ` L ${points[points.length - 1].x} 220 Z`;

    return { linePath, areaPath, points };
  };

  const getPrintSvgPathData = () => {
    if (!analytics || !analytics.monthlyTrends || analytics.monthlyTrends.length === 0) {
      return { printLinePath: "", printAreaPath: "", printPoints: [] };
    }
    const trends = analytics.monthlyTrends;
    const maxVal = Math.max(...trends.map(t => t.total), 1000);
    const printPoints = trends.map((item, idx) => {
      const x = 50 + idx * 140;
      const y = 180 - (item.total / maxVal) * 140;
      return { x, y, ...item };
    });

    let printLinePath = `M ${printPoints[0].x} ${printPoints[0].y}`;
    for (let i = 1; i < printPoints.length; i++) {
      printLinePath += ` L ${printPoints[i].x} ${printPoints[i].y}`;
    }

    let printAreaPath = `M ${printPoints[0].x} 200 L ${printPoints[0].x} ${printPoints[0].y}`;
    for (let i = 1; i < printPoints.length; i++) {
      printAreaPath += ` L ${printPoints[i].x} ${printPoints[i].y}`;
    }
    printAreaPath += ` L ${printPoints[printPoints.length - 1].x} 200 Z`;

    return { printLinePath, printAreaPath, printPoints };
  };

  const { linePath, areaPath, points } = getSvgPathData();
  const { printLinePath, printAreaPath, printPoints } = getPrintSvgPathData();

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @media screen {
          .print-only-report {
            display: none !important;
          }
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm;
          }
          html, body {
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #admin-dashboard-screen {
            display: none !important;
          }
          .print-only-report {
            display: flex !important;
            flex-direction: column !important;
            width: 186mm !important;
            height: 270mm !important;
            justify-content: space-between !important;
            box-sizing: border-box !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />

      {/* Printable Report Wrapper */}
      <div className="print-only-report h-full p-4 bg-white text-slate-900">
        {/* Header */}
        <div className="border-b pb-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 uppercase">PrintSphere Analytics Report</h1>
              <p className="text-xs text-slate-500 mt-1">System Administration & Decision Making Document</p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-bold text-slate-700">Role: Administrator</p>
              <p>Generated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Summary metrics cards */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="border rounded-2xl p-4 bg-slate-50/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gross Revenue</span>
            <p className="text-xl font-extrabold text-slate-950 mt-1">
              Rs. {(analytics?.grossRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="border rounded-2xl p-4 bg-slate-50/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Orders</span>
            <p className="text-xl font-extrabold text-slate-950 mt-1">
              {(analytics?.totalOrders || 0).toLocaleString()}
            </p>
          </div>
          <div className="border rounded-2xl p-4 bg-slate-50/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Custom Designs Uploaded</span>
            <p className="text-xl font-extrabold text-slate-950 mt-1">
              {(analytics?.customDesigns || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Sales Trend chart */}
        <div className="border rounded-2xl p-5 mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Monthly Sales Trends</h3>
          <div className="h-56 w-full flex items-end">
            {analyticsLoading ? (
              <p className="text-xs text-slate-400 text-center w-full">Loading trend data...</p>
            ) : (
              <svg className="w-full h-full" viewBox="0 0 800 220">
                <defs>
                  <linearGradient id="gradient-print" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="30" x2="800" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="90" x2="800" y2="90" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="150" x2="800" y2="150" stroke="#f1f5f9" strokeWidth="1" />
                {printAreaPath && (
                  <path d={printAreaPath} fill="url(#gradient-print)" />
                )}
                {printLinePath && (
                  <path
                    d={printLinePath}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                  />
                )}
                {printPoints.map((pt, idx) => (
                  <circle key={idx} cx={pt.x} cy={pt.y} r="4" fill="#4f46e5" />
                ))}
              </svg>
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-bold px-6 pt-2">
            {printPoints.map((pt, idx) => (
              <span key={idx}>{pt.month}</span>
            ))}
          </div>
        </div>

        {/* Popular colors and best-selling products */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* Colors */}
          <div className="border rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Fabric Color Breakdown</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b pb-2 text-slate-400 font-bold">
                  <th className="pb-2">Color</th>
                  <th className="pb-2">Quantity</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.popularColors || []).map((item) => (
                  <tr key={item.color} className="border-b last:border-b-0">
                    <td className="py-2.5 font-bold text-slate-800">{item.color}</td>
                    <td className="py-2.5 text-slate-600">{item.count} ordered</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">Rs. {(item.revenue || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Best Sellers */}
          <div className="border rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Top-Selling Products</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b pb-2 text-slate-400 font-bold">
                  <th className="pb-2">Product/Design</th>
                  <th className="pb-2">Sales</th>
                  <th className="pb-2 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {(analytics?.bestSellers || []).map((item) => (
                  <tr key={item.name} className="border-b last:border-b-0">
                    <td className="py-2.5 font-bold text-slate-800 truncate max-w-[140px]">{item.name}</td>
                    <td className="py-2.5 text-slate-600">{item.sales} sold</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">{item.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center text-[10px] text-slate-400 flex justify-between select-none mt-auto">
          <span>Confidential - For Internal Use Only</span>
          <span>Page 1 of 1</span>
        </div>
      </div>

      <div id="admin-dashboard-screen" className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden text-slate-800">

      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col justify-between shrink-0 select-none text-slate-400">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              A
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide leading-none">PrintSphere</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Admin Panel</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "analytics"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              Analytics & Reports
            </button>
            <button
              onClick={() => setActiveTab("staff")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "staff"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Users className="h-4.5 w-4.5" />
              Staff Management
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "inventory"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Inbox className="h-4.5 w-4.5" />
              Products & Inventory
            </button>
            <button
              onClick={() => {
                setActiveTab("satisfaction");
                fetchSatisfactionReviews();
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "satisfaction"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center gap-3.5">
                <MessageSquare className="h-4.5 w-4.5" />
                Customer Satisfaction
              </span>
              {satisfactionStats.badReviewsCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                  {satisfactionStats.badReviewsCount} low
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "notifications"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Bell className="h-4.5 w-4.5" />
              Notifications
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "settings"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              System Settings
            </button>

            
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => window.location.href = '/customer-home'}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-slate-200 transition"
              >
                <Shield className="h-4.5 w-4.5" />
                View Store Front
              </button>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
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
        
        {/* KPI Cards on Top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 select-none">
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Gross Revenue</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {analyticsLoading ? "Loading..." : `Rs. ${(analytics?.grossRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Real-time earnings</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Total Orders</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {analyticsLoading ? "Loading..." : (analytics?.totalOrders || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Lifetime volume</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Custom Designs</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {analyticsLoading ? "Loading..." : (analytics?.customDesigns || 0).toLocaleString()}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-2 font-bold">
              <Layers className="h-3.5 w-3.5" />
              <span>User uploads</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">System Connection</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {analytics ? "Active" : "Offline"}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <Check className="h-3.5 w-3.5" />
              <span>MongoDB connected</span>
            </div>
          </div>
        </div>


        {/* ================= TAB 1: ANALYTICS & REPORTS ================= */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            {/* Dashboard Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border rounded-3xl p-6 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-slate-900">Analytics & Reports</h2>
                <p className="text-xs text-slate-400 mt-1">Review real-time performance, revenues, and sales trends from the database.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={fetchAnalytics}
                  disabled={analyticsLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl shadow-sm transition disabled:opacity-50"
                  title="Refresh analytics data"
                >
                  <RefreshCw className={`h-4 w-4 ${analyticsLoading ? "animate-spin text-indigo-600" : ""}`} />
                  Refresh Data
                </button>
                <button
                  onClick={handlePrintPDF}
                  disabled={analyticsLoading}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md transition disabled:opacity-50"
                >
                  <FileText className="h-4.5 w-4.5" /> Download PDF Report
                </button>
              </div>
            </div>

            <div className="bg-white border rounded-3xl p-6 shadow-sm select-none">
              <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Monthly Revenue & Sales Trend
              </h3>
              {/* Sales trend SVG path chart */}
              <div className="h-72 w-full flex items-end">
                {analyticsLoading ? (
                  <div className="h-full w-full flex items-center justify-center">
                    <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
                  </div>
                ) : (
                  <svg className="w-full h-full" viewBox="0 0 800 240">
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Grid Lines */}
                    <line x1="0" y1="40" x2="800" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="100" x2="800" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                    <line x1="0" y1="160" x2="800" y2="160" stroke="#f1f5f9" strokeWidth="1" />
                    {/* Area beneath curve */}
                    {areaPath && (
                      <path d={areaPath} fill="url(#gradient)" />
                    )}
                    {/* Trend Curve Line */}
                    {linePath && (
                      <path
                        d={linePath}
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    )}
                    {/* Scatter Dots */}
                    {points.map((pt, idx) => (
                      <g key={idx}>
                        <circle cx={pt.x} cy={pt.y} r="5" fill="#4f46e5" className="cursor-pointer" />
                        <title>{pt.month} {pt.year}: Rs. {pt.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</title>
                      </g>
                    ))}
                  </svg>
                )}
              </div>
              <div className="flex justify-between text-xs text-slate-400 font-bold px-6 pt-3">
                {analyticsLoading ? (
                  <span>Loading trends...</span>
                ) : (
                  points.map((pt, idx) => (
                    <span key={idx}>{pt.month}</span>
                  ))
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 select-none">
              {/* Popular fabric colors chart */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-indigo-600" />
                  Popular Fabric Colors
                </h3>
                <div className="space-y-4">
                  {analyticsLoading ? (
                    <div className="py-12 flex justify-center">
                      <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                    </div>
                  ) : (analytics?.popularColors || []).map((item) => {
                    const isHex = item.color.startsWith("#");
                    const bgClass = !isHex ? (
                      item.color.toLowerCase() === "white" 
                        ? "bg-slate-200" 
                        : item.color.toLowerCase() === "black" 
                        ? "bg-slate-900" 
                        : item.color.toLowerCase() === "navy blue" 
                        ? "bg-indigo-950" 
                        : item.color.toLowerCase() === "red" 
                        ? "bg-rose-600" 
                        : "bg-indigo-600"
                    ) : "";
                    
                    const maxCount = Math.max(...(analytics?.popularColors || []).map(c => c.count), 1);
                    const pct = Math.round((item.count / maxCount) * 100);
                    
                    return (
                      <div key={item.color} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-600">
                          <span className="flex items-center gap-2">
                            <span 
                              className={`h-3.5 w-3.5 rounded-full border ${bgClass}`}
                              style={isHex ? { backgroundColor: item.color } : {}}
                            />
                            {item.color}
                          </span>
                          <span>{item.count} items ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Conversion Statistics */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                  <Info className="h-5 w-5 text-indigo-600" />
                  Operational Performance
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Active Orders in Pipeline</span>
                    <p className="text-xl font-bold text-slate-800 mt-1">
                      {analyticsLoading ? "..." : (analytics?.operationalStats?.activeOrders ?? 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Fulfilled Orders</span>
                    <p className="text-xl font-bold text-slate-800 mt-1">
                      {analyticsLoading ? "..." : (analytics?.operationalStats?.completedOrders ?? 0)}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Avg Order Value</span>
                    <p className="text-xl font-bold text-slate-800 mt-1">
                      {analyticsLoading ? "..." : `Rs. ${(analytics?.operationalStats?.avgOrderValue || 0).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Custom Designs</span>
                    <p className="text-xl font-bold text-slate-800 mt-1">
                      {analyticsLoading ? "..." : (analytics?.customDesigns || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: STAFF MANAGEMENT ================= */}
        {activeTab === "staff" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
            {/* Staff list */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Active Staff Directory
                </h3>
                <button onClick={fetchStaff} className="text-xs text-indigo-600 font-bold hover:underline">
                  Refresh Directory
                </button>
              </div>

              {fetchLoading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
                </div>
              ) : staff.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed rounded-2xl">
                  <p className="text-sm text-slate-400 font-semibold">No managers or employees registered yet.</p>
                  <p className="text-xs text-slate-300 mt-1">Use the registration panel on the right to add staff.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-xs text-slate-400 uppercase font-black select-none">
                        <th className="pb-3 font-extrabold">Name</th>
                        <th className="pb-3 font-extrabold">Email</th>
                        <th className="pb-3 font-extrabold">Role</th>
                        <th className="pb-3 font-extrabold">Phone</th>
                        <th className="pb-3 text-right font-extrabold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staff.map((member) => (
                        <tr key={member._id} className="border-b last:border-b-0 hover:bg-slate-50/50 transition">
                          <td className="py-4 font-bold text-slate-900">{member.name}</td>
                          <td className="py-4 text-sm text-slate-600">{member.email}</td>
                          <td className="py-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              member.role === "Manager" 
                                ? "bg-purple-50 text-purple-600 ring-1 ring-purple-100" 
                                : "bg-teal-50 text-teal-600 ring-1 ring-teal-100"
                            }`}>
                              {member.role}
                            </span>
                          </td>
                          <td className="py-4 text-sm text-slate-500">{member.phone || "—"}</td>
                          <td className="py-4 text-right space-x-2">
                            <button
                              onClick={() => handleDeleteStaff(member._id)}
                              className="inline-flex items-center p-1.5 rounded-lg border border-red-50 text-red-500 hover:bg-red-50 transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Create Staff */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6 select-none">
                <UserPlus className="h-5 w-5 text-indigo-600" />
                Register Staff User
              </h3>

              {formError && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {formSuccess && (
                <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Employee Name"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Mail className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@printsphere.com"
                      className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Default Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Role Assignment</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Employee">Employee (Printing Operator)</option>
                    <option value="Manager">Manager (Operations Director)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Phone (Optional)</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                      <Phone className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 7X XXX XXXX"
                      className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md disabled:opacity-50 transition"
                >
                  {formLoading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PRODUCTS & INVENTORY ================= */}
        {activeTab === "inventory" && (
          <div className="space-y-8 select-none">
            {/* Inventory KPI Summary Cards */}
            {(() => {
              const invData = inventory.length > 0 ? inventory : (analytics?.inventory || []);
              const tShirts = invData.filter(i => i.itemType === "Plain T-Shirt" || i.itemType?.toLowerCase().includes("t-shirt"));
              const inks = invData.filter(i => i.itemType === "Printing Ink" || i.itemType?.toLowerCase().includes("ink"));
              const packaging = invData.filter(i => {
                const typeLower = (i.itemType || "").toLowerCase();
                return (
                  typeLower.includes("transfer") ||
                  typeLower.includes("paper") ||
                  typeLower.includes("package") ||
                  typeLower.includes("packaging") ||
                  typeLower.includes("tape") ||
                  typeLower.includes("stick") ||
                  typeLower.includes("label") ||
                  typeLower.includes("sticker") ||
                  i.itemType === "Materials"
                );
              });
              const lowStock = invData.filter(i => (i.quantity ?? 0) <= (i.minThreshold ?? 10));

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">T-Shirt Stock</span>
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                        <Tag className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                      {inventoryLoading && invData.length === 0 ? "..." : tShirts.reduce((sum, i) => sum + (i.quantity ?? 0), 0).toLocaleString()}
                    </p>
                    <span className="text-[11px] text-slate-400 font-semibold">Across {tShirts.length} style/size variations</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Ink & Consumables</span>
                      <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                        <Droplets className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                      {inventoryLoading && invData.length === 0 ? "..." : inks.reduce((sum, i) => sum + (i.quantity ?? 0), 0).toLocaleString()}
                    </p>
                    <span className="text-[11px] text-slate-400 font-semibold">{inks.length} DTG inks & fluids</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Packaging Supplies</span>
                      <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                        <Package className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-slate-900 mt-2">
                      {inventoryLoading && invData.length === 0 ? "..." : packaging.reduce((sum, i) => sum + (i.quantity ?? 0), 0).toLocaleString()}
                    </p>
                    <span className="text-[11px] text-slate-400 font-semibold">{packaging.length} items (boxes, papers & tapes)</span>
                  </div>

                  <div className="bg-white border rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Low Stock Warnings</span>
                      <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                        <AlertCircle className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="text-2xl font-black text-rose-600 mt-2">
                      {inventoryLoading && invData.length === 0 ? "..." : lowStock.length}
                    </p>
                    <span className="text-[11px] text-slate-400 font-semibold">Items below safety threshold</span>
                  </div>
                </div>
              );
            })()}

            {/* Main Warehouse Inventory Table & Controls */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-indigo-600" />
                    Manage Inventory Stock & Restocking
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Categorized stock control for garment blanks, printing inks, and packaging supplies.
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => {
                      fetchInventory();
                      fetchAnalytics();
                    }}
                    disabled={inventoryLoading}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                    title="Refresh data"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${inventoryLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => {
                      const defaultStyleName = styles[0]?.name || styles[0]?.type || "Crew Neck";
                      const defaultStyle = styles.find((s) => (s.name || s.type) === defaultStyleName);
                      const firstGsm = formatGsm(defaultStyle?.gsmPrices?.[0]?.gsm || defaultStyle?.gsms?.[0] || "GSM 180");
                      setInventoryForm({
                        itemType: inventoryCategoryFilter === "INK"
                          ? "Printing Ink"
                          : inventoryCategoryFilter === "PAPERS_PACKAGING"
                          ? "Transfer Paper"
                          : "Plain T-Shirt",
                        materialCategory: "Transfer Paper",
                        tShirtType: defaultStyleName,
                        color: defaultStyle?.colors?.[0]?.value || "#ffffff",
                        colorName: defaultStyle?.colors?.[0]?.name || "White",
                        size: "M",
                        material: firstGsm,
                        quantity: 50,
                        minThreshold: 15,
                      });
                      setInventoryError("");
                      setShowInventoryModal(true);
                    }}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Inventory
                  </button>
                </div>
              </div>

              {/* 4 Main Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
                {(() => {
                  const invList = inventory.length > 0 ? inventory : (analytics?.inventory || []);
                  return [
                    { id: "ALL", label: "All Stock Items", icon: Layers },
                    { id: "TSHIRTS", label: "T-Shirts", icon: Tag },
                    { id: "INK", label: "Printing Ink", icon: Droplets },
                    { id: "PAPERS_PACKAGING", label: "Transfer Papers & Packaging", icon: Package },
                  ].map((cat) => {
                    const isActive = inventoryCategoryFilter === cat.id;
                    let count = invList.length;
                    if (cat.id === "TSHIRTS") {
                      count = invList.filter(
                        (i) => i.itemType === "Plain T-Shirt" || i.itemType?.toLowerCase().includes("t-shirt")
                      ).length;
                    } else if (cat.id === "INK") {
                      count = invList.filter(
                        (i) => i.itemType === "Printing Ink" || i.itemType?.toLowerCase().includes("ink")
                      ).length;
                    } else if (cat.id === "PAPERS_PACKAGING") {
                      count = invList.filter((i) => {
                        const typeLower = (i.itemType || "").toLowerCase();
                        return (
                          typeLower.includes("transfer") ||
                          typeLower.includes("paper") ||
                          typeLower.includes("package") ||
                          typeLower.includes("packaging") ||
                          typeLower.includes("tape") ||
                          typeLower.includes("stick") ||
                          typeLower.includes("label") ||
                          typeLower.includes("sticker") ||
                          i.itemType === "Materials"
                        );
                      }).length;
                    }

                    const IconComp = cat.icon;

                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setInventoryCategoryFilter(cat.id);
                          setInventorySizeFilter("ALL");
                          setInventoryColorFilter("ALL");
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                          isActive
                            ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
                        }`}
                      >
                        <IconComp className="h-3.5 w-3.5" />
                        <span>{cat.label}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            isActive
                              ? "bg-indigo-500 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Filter Control Bar (Size, Color, Search based on active category) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/80 p-3.5 border rounded-2xl">
                {/* Size Filter */}
                {inventoryCategoryFilter === "ALL" || inventoryCategoryFilter === "TSHIRTS" ? (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Filter by Size
                    </label>
                    <select
                      value={inventorySizeFilter}
                      onChange={(e) => setInventorySizeFilter(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-xl text-xs font-semibold bg-white focus:outline-indigo-500"
                    >
                      <option value="ALL">All Sizes</option>
                      {["S", "M", "L", "XL", "XXL", "3XL"].map((sz) => (
                        <option key={sz} value={sz}>
                          Size {sz}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {/* Color Filter */}
                {inventoryCategoryFilter === "ALL" || inventoryCategoryFilter === "TSHIRTS" || inventoryCategoryFilter === "INK" ? (
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                      Filter by Color
                    </label>
                    <select
                      value={inventoryColorFilter}
                      onChange={(e) => setInventoryColorFilter(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-xl text-xs font-semibold bg-white focus:outline-indigo-500"
                    >
                      <option value="ALL">All Colors</option>
                      {Array.from(
                        new Set(
                          (inventory.length > 0 ? inventory : (analytics?.inventory || []))
                            .filter((i) => {
                              if (inventoryCategoryFilter === "TSHIRTS") {
                                return i.itemType === "Plain T-Shirt" || i.itemType?.toLowerCase().includes("t-shirt");
                              }
                              if (inventoryCategoryFilter === "INK") {
                                return i.itemType === "Printing Ink" || i.itemType?.toLowerCase().includes("ink");
                              }
                              return true;
                            })
                            .map((i) => i.color)
                            .filter((c) => c && typeof c === "string" && c.trim() !== "")
                        )
                      ).map((colorVal) => (
                        <option key={colorVal} value={colorVal}>
                          {colorVal}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="hidden sm:block" />
                )}

                {/* Search Query */}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                    Search Stock Items
                  </label>
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search stock..."
                      value={inventorySearchQuery}
                      onChange={(e) => setInventorySearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 border rounded-xl text-xs font-semibold bg-white focus:outline-indigo-500"
                    />
                    {inventorySearchQuery && (
                      <button
                        onClick={() => setInventorySearchQuery("")}
                        className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Exact Manager Table Rendering */}
              {(() => {
                const rawInv = inventory.length > 0 ? inventory : (analytics?.inventory || []);
                const filteredInventory = rawInv.filter((item) => {
                  // 1. Category Filter
                  if (inventoryCategoryFilter === "TSHIRTS") {
                    if (item.itemType !== "Plain T-Shirt" && !item.itemType?.toLowerCase().includes("t-shirt")) {
                      return false;
                    }
                  } else if (inventoryCategoryFilter === "INK") {
                    if (item.itemType !== "Printing Ink" && !item.itemType?.toLowerCase().includes("ink")) {
                      return false;
                    }
                  } else if (inventoryCategoryFilter === "PAPERS_PACKAGING") {
                    const typeLower = (item.itemType || "").toLowerCase();
                    if (
                      !typeLower.includes("transfer") &&
                      !typeLower.includes("paper") &&
                      !typeLower.includes("package") &&
                      !typeLower.includes("packaging") &&
                      !typeLower.includes("tape") &&
                      !typeLower.includes("stick") &&
                      !typeLower.includes("label") &&
                      !typeLower.includes("sticker") &&
                      item.itemType !== "Materials"
                    ) {
                      return false;
                    }
                  }

                  // 2. Size Filter
                  if (inventorySizeFilter !== "ALL") {
                    if (item.size !== inventorySizeFilter) {
                      return false;
                    }
                  }

                  // 3. Color Filter
                  if (inventoryColorFilter !== "ALL") {
                    if ((item.color || "").toLowerCase() !== inventoryColorFilter.toLowerCase()) {
                      return false;
                    }
                  }

                  // 4. Search Filter
                  if (inventorySearchQuery.trim()) {
                    const q = inventorySearchQuery.toLowerCase();
                    const matchName = (item.itemType || "").toLowerCase().includes(q);
                    const matchType = (item.tShirtType || "").toLowerCase().includes(q);
                    const matchColor = (item.color || "").toLowerCase().includes(q);
                    const matchSize = (item.size || "").toLowerCase().includes(q);
                    const matchMat = (item.material || "").toLowerCase().includes(q);
                    const matchGsm = (item.gsm || "").toLowerCase().includes(q);
                    if (!matchName && !matchType && !matchColor && !matchSize && !matchMat && !matchGsm) {
                      return false;
                    }
                  }

                  return true;
                });

                if (inventoryLoading && rawInv.length === 0) {
                  return (
                    <div className="py-20 flex justify-center">
                      <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
                    </div>
                  );
                }

                if (filteredInventory.length === 0) {
                  return (
                    <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-sm text-slate-500 font-semibold">
                        No stock items found matching your filters.
                      </p>
                      <button
                        onClick={() => {
                          setInventoryCategoryFilter("ALL");
                          setInventorySizeFilter("ALL");
                          setInventoryColorFilter("ALL");
                          setInventorySearchQuery("");
                        }}
                        className="mt-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                      >
                        Reset filters
                      </button>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="pb-3">Item Name</th>

                          {/* All Items tab columns */}
                          {inventoryCategoryFilter === "ALL" && (
                            <>
                              <th className="pb-3">Style / Details</th>
                              <th className="pb-3">Size / Color</th>
                            </>
                          )}

                          {/* Category 1: T-Shirts columns */}
                          {inventoryCategoryFilter === "TSHIRTS" && (
                            <>
                              <th className="pb-3">Style</th>
                              <th className="pb-3">GSM Weight</th>
                              <th className="pb-3">Size</th>
                              <th className="pb-3">Color</th>
                            </>
                          )}

                          {/* Category 2: Printing Ink columns */}
                          {inventoryCategoryFilter === "INK" && (
                            <th className="pb-3">Color</th>
                          )}

                          {/* Category 3: Transfer Papers & Packaging has no extra columns */}

                          <th className="pb-3">Current Stock</th>
                          <th className="pb-3">Min Threshold</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3 text-right">Actions & Restock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredInventory.map((item) => {
                          const qty = item.quantity ?? item.qty ?? 0;
                          const threshold = item.minThreshold ?? 10;
                          const isLow = qty <= threshold;
                          return (
                            <tr
                              key={item._id}
                              className="border-b last:border-b-0 hover:bg-slate-50/50 transition"
                            >
                              <td className="py-4 font-bold text-slate-900">
                                {item.itemType}
                              </td>

                              {/* All Items tab Data */}
                              {inventoryCategoryFilter === "ALL" && (
                                <>
                                  <td className="py-4 text-xs text-slate-600 font-medium">
                                    <span className="font-bold text-slate-800">
                                      {item.tShirtType || "Generic Consumable"}
                                    </span>{" "}
                                    {item.material ? `(${item.material})` : ""}
                                  </td>
                                  <td className="py-4 text-xs text-slate-500 font-medium">
                                    {item.size || item.color
                                      ? `${item.color || ""} ${item.size ? `— Size ${item.size}` : ""}`
                                      : "—"}
                                  </td>
                                </>
                              )}

                              {/* Category 1: T-Shirts Data */}
                              {inventoryCategoryFilter === "TSHIRTS" && (
                                <>
                                  <td className="py-4 text-xs font-semibold text-slate-800">
                                    {item.tShirtType || "Crew Neck"}
                                  </td>
                                  <td className="py-4 text-xs text-slate-600 font-medium">
                                    {formatGsm(item.material || item.gsm || "GSM 180")}
                                  </td>
                                  <td className="py-4 text-xs text-slate-600 font-medium">
                                    {item.size || "M"}
                                  </td>
                                  <td className="py-4 text-xs font-semibold text-slate-800">
                                    {item.color || "White"}
                                  </td>
                                </>
                              )}

                              {/* Category 2: Printing Ink Data */}
                              {inventoryCategoryFilter === "INK" && (
                                <td className="py-4 text-xs font-semibold text-slate-800">
                                  {item.color || "Cyan/Magenta/Yellow/Black"}
                                </td>
                              )}

                              {/* Category 3: Transfer Papers & Packaging has no extra columns */}

                              {/* Common Stock & Restock Controls */}
                              <td className="py-4 text-xs font-bold text-slate-900">
                                {qty} units
                              </td>
                              <td className="py-4 text-xs text-slate-400">
                                {editingThresholdId === item._id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={
                                        thresholdInputs[item._id] ??
                                        threshold
                                      }
                                      onChange={(e) =>
                                        setThresholdInputs((prev) => ({
                                          ...prev,
                                          [item._id]: e.target.value,
                                        }))
                                      }
                                      className="w-16 px-2 py-1 text-xs border rounded-xl text-center"
                                    />
                                    <button
                                      onClick={() =>
                                        handleUpdateMinThreshold(item._id)
                                      }
                                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                      title="Save threshold"
                                    >
                                      <Check className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setEditingThresholdId(null)}
                                      className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span>{threshold} units</span>
                                    <button
                                      onClick={() => {
                                        setEditingThresholdId(item._id);
                                        setThresholdInputs((prev) => ({
                                          ...prev,
                                          [item._id]: threshold,
                                        }));
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-bold cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                )}
                              </td>
                              <td className="py-4 text-xs">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                    isLow
                                      ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                                      : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                                  }`}
                                >
                                  {isLow ? "Low stock" : "In Stock"}
                                </span>
                              </td>
                              <td className="py-4 text-right">
                                <div className="inline-flex items-center gap-2 justify-end">
                                  <input
                                    type="number"
                                    placeholder="+ Qty"
                                    value={restockQuantities[item._id] || ""}
                                    onChange={(e) =>
                                      setRestockQuantities((prev) => ({
                                        ...prev,
                                        [item._id]: e.target.value,
                                      }))
                                    }
                                    className="w-16 px-2 py-1 text-xs border rounded-xl text-center font-semibold"
                                  />
                                  <button
                                    onClick={() => handleRestockQuantity(item._id)}
                                    className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold transition cursor-pointer"
                                  >
                                    {(() => {
                                      const value = Number(
                                        restockQuantities[item._id] ?? "",
                                      );
                                      if (!Number.isNaN(value) && value < 0) {
                                        return "Remove";
                                      }
                                      return "Add";
                                    })()}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInventory(item._id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                    title="Delete item"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* Best-Selling Products Leaderboard */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6">
                <ShoppingCart className="h-5 w-5 text-indigo-600" />
                Best-Selling Products & Custom Designs Leaderboard
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {analyticsLoading ? (
                  <div className="py-8 flex justify-center col-span-full">
                    <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                  </div>
                ) : !analytics?.bestSellers || analytics.bestSellers.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4 font-semibold col-span-full">No sales data recorded yet.</p>
                ) : (
                  analytics.bestSellers.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-4 rounded-2xl border bg-slate-50/50 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <span className="h-7 w-7 rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          #{item.rank}
                        </span>
                        <div className="leading-tight">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-[180px]">{item.name}</p>
                          <span className="text-[10px] text-slate-400">{item.sales} units sold</span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-indigo-700">{item.revenue}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: SYSTEM SETTINGS ================= */}
        {activeTab === "settings" && (
          <div className="max-w-2xl bg-white border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2 mb-6 select-none">
              <Settings className="h-5 w-5 text-indigo-600" />
              Operational Decisions & Sandbox Parameters
            </h3>

            {settingsSuccess && (
              <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Settings saved successfully!</span>
              </div>
            )}

            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-slate-900">Stripe Payment Sandbox Mode</p>
                    <span className="text-xs text-slate-400">Routes all payments through the Stripe Test Sandbox</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sandboxPayment}
                    onChange={(e) => setSandboxPayment(e.target.checked)}
                    className="h-5 w-5 text-indigo-600 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-slate-900">System Maintenance Mode</p>
                    <span className="text-xs text-slate-400">Shows a maintenance screen to Customers. Employees/Managers bypass.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={maintenanceMode}
                    onChange={(e) => setMaintenanceMode(e.target.checked)}
                    className="h-5 w-5 text-indigo-600 accent-indigo-600 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl">
                  <div className="leading-tight">
                    <p className="text-sm font-bold text-slate-900">Logging Verbosity Level</p>
                    <span className="text-xs text-slate-400 block mb-2">Dictates the level of API monitoring logs in server stdout</span>
                  </div>
                  <select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                    className="px-3 py-2 border bg-white rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="debug">Debug (All events and raw SQL queries)</option>
                    <option value="info">Info (Server starts, connections, and routes)</option>
                    <option value="warn">Warn & Error (Only failure events)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center border-t pt-5">
                <button
                  type="button"
                  onClick={() => alert("Triggering instant database backup... Completed: backup_printsphere_latest.gzip")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 shadow-sm transition"
                >
                  <HardDrive className="h-4 w-4" /> Trigger DB Backup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 5: NOTIFICATIONS ================= */}
        {activeTab === "notifications" && (() => {
          const notificationTypeFilters = [
            { key: "ALL", label: "All Notifications", icon: Bell },
            { key: "Order Update", label: "Order Updates", icon: ShoppingCart },
            { key: "Low Stock", label: "Low Stock Alerts", icon: AlertTriangle },
            { key: "Payment Success", label: "Payment Confirmations", icon: CreditCard },
            { key: "New Print Task", label: "Print Tasks", icon: Printer },
          ];

          const getMeta = (type) => {
            switch (type) {
              case "Low Stock":
                return {
                  label: "Low Stock Alert",
                  Icon: AlertTriangle,
                  badgeClass: "bg-rose-50 border-rose-200 text-rose-700",
                  iconBg: "bg-rose-100 text-rose-600 border-rose-200",
                  cardBorder: "border-rose-100 hover:border-rose-300"
                };
              case "New Print Task":
                return {
                  label: "Print Task",
                  Icon: Printer,
                  badgeClass: "bg-purple-50 border-purple-200 text-purple-700",
                  iconBg: "bg-purple-100 text-purple-600 border-purple-200",
                  cardBorder: "border-purple-100 hover:border-purple-300"
                };
              case "Payment Success":
                return {
                  label: "Payment Confirmation",
                  Icon: CreditCard,
                  badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
                  iconBg: "bg-emerald-100 text-emerald-600 border-emerald-200",
                  cardBorder: "border-emerald-100 hover:border-emerald-300"
                };
              case "Order Update":
                return {
                  label: "Order Update",
                  Icon: ShoppingCart,
                  badgeClass: "bg-blue-50 border-blue-200 text-blue-700",
                  iconBg: "bg-blue-100 text-blue-600 border-blue-200",
                  cardBorder: "border-blue-100 hover:border-blue-300"
                };
              default:
                return {
                  label: type || "System Alert",
                  Icon: Bell,
                  badgeClass: "bg-slate-100 border-slate-200 text-slate-700",
                  iconBg: "bg-slate-100 text-slate-600 border-slate-200",
                  cardBorder: "border-slate-100 hover:border-slate-300"
                };
            }
          };

          const filteredList = notifications.filter((item) => {
            // Type filter
            if (notificationTypeFilter !== "ALL" && item.type !== notificationTypeFilter) {
              return false;
            }
            // Status filter
            if (notificationStatusFilter === "UNREAD" && item.isRead) {
              return false;
            }
            if (notificationStatusFilter === "READ" && !item.isRead) {
              return false;
            }
            // Search query filter
            if (notificationSearchQuery.trim()) {
              const q = notificationSearchQuery.toLowerCase().trim();
              const matchTitle = (item.title || "").toLowerCase().includes(q);
              const matchMsg = (item.message || "").toLowerCase().includes(q);
              const matchType = (item.type || "").toLowerCase().includes(q);
              if (!matchTitle && !matchMsg && !matchType) return false;
            }
            return true;
          });

          const totalUnread = notifications.filter((n) => !n.isRead).length;

          return (
            <div className="bg-white border rounded-3xl p-6 shadow-sm flex flex-col gap-6">
              {/* Top Header & Global Actions */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 select-none pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-950">Live Notification Center</h3>
                      {totalUnread > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {totalUnread} New
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          All Caught Up
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Monitor real-time updates across customer orders, inventory stock levels, payments, and print tasks.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={fetchNotifications}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-100 transition shadow-2xs cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Refresh
                  </button>
                  <button
                    onClick={handleClearAllNotifications}
                    disabled={totalUnread === 0}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:hover:bg-slate-100 rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5 text-slate-500" />
                    Mark All as Read
                  </button>
                </div>
              </div>

              {/* Notification Type Filters (Pills Bar) */}
              <div className="flex flex-wrap gap-2 items-center">
                {notificationTypeFilters.map((tab) => {
                  const Icon = tab.icon;
                  const count = tab.key === "ALL" 
                    ? notifications.length 
                    : notifications.filter((n) => n.type === tab.key).length;
                  const unreadCount = tab.key === "ALL"
                    ? notifications.filter((n) => !n.isRead).length
                    : notifications.filter((n) => n.type === tab.key && !n.isRead).length;

                  const isActive = notificationTypeFilter === tab.key;

                  return (
                    <button
                      key={tab.key}
                      onClick={() => setNotificationTypeFilter(tab.key)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all select-none cursor-pointer border ${
                        isActive
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-slate-50/70 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-200/80"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 ${isActive ? "text-indigo-300" : "text-slate-400"}`} />
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-extrabold ${
                          isActive
                            ? "bg-slate-800 text-indigo-200"
                            : unreadCount > 0
                            ? "bg-rose-100 text-rose-700"
                            : "bg-slate-200/70 text-slate-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Search & Status Controls Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70 p-3 rounded-2xl border border-slate-200/70">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={notificationSearchQuery}
                    onChange={(e) => setNotificationSearchQuery(e.target.value)}
                    placeholder="Search by keyword, order #, or title..."
                    className="w-full pl-9 pr-8 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                  />
                  {notificationSearchQuery && (
                    <button
                      onClick={() => setNotificationSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">
                    Status:
                  </span>
                  <div className="inline-flex rounded-xl bg-white border border-slate-200 p-0.5 shadow-2xs">
                    {[
                      { key: "ALL", label: "All" },
                      { key: "UNREAD", label: "Unread" },
                      { key: "READ", label: "Read" }
                    ].map((statusOpt) => (
                      <button
                        key={statusOpt.key}
                        onClick={() => setNotificationStatusFilter(statusOpt.key)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          notificationStatusFilter === statusOpt.key
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {statusOpt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notification List Body */}
              {notifications.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed rounded-2xl select-none bg-slate-50/50">
                  <Bell className="h-8 w-8 text-slate-300 mx-auto mb-2 animate-bounce" />
                  <p className="text-sm text-slate-600 font-bold">You have no notifications.</p>
                  <p className="text-xs text-slate-400 mt-1">Updates on order activities and system alerts will appear here.</p>
                </div>
              ) : filteredList.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed rounded-2xl select-none bg-slate-50/50 flex flex-col items-center">
                  <Filter className="h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-700 font-bold">No notifications found</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    No notifications match your current filter criteria ({notificationTypeFilter !== "ALL" ? `Type: ${notificationTypeFilter}` : ""} {notificationStatusFilter !== "ALL" ? `Status: ${notificationStatusFilter}` : ""} {notificationSearchQuery ? `Search: "${notificationSearchQuery}"` : ""}).
                  </p>
                  <button
                    onClick={() => {
                      setNotificationTypeFilter("ALL");
                      setNotificationStatusFilter("ALL");
                      setNotificationSearchQuery("");
                    }}
                    className="mt-4 px-4 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl border border-indigo-200 transition cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[620px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredList.map((item) => {
                    const meta = getMeta(item.type);
                    const Icon = meta.Icon;

                    const timeStr = new Date(item.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });

                    return (
                      <div
                        key={item._id}
                        className={`flex items-start justify-between p-4 rounded-2xl border transition duration-200 ${
                          item.isRead
                            ? "bg-slate-50/60 border-slate-100 opacity-80 hover:opacity-100"
                            : `bg-white ${meta.cardBorder} shadow-sm ring-1 ring-slate-100`
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div className={`h-9 w-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${meta.iconBg}`}>
                            <Icon className="h-4.5 w-4.5" />
                          </div>

                          <div className="leading-tight space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wider select-none ${meta.badgeClass}`}>
                                {meta.label}
                              </span>
                              <h4 className={`text-sm font-bold ${item.isRead ? "text-slate-700" : "text-slate-950"}`}>
                                {item.title}
                              </h4>
                              {!item.isRead && (
                                <span className="flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed font-normal">
                              {item.message}
                            </p>

                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-semibold pt-1 select-none">
                              <Clock className="h-3 w-3" />
                              <span>{timeStr}</span>
                            </div>
                          </div>
                        </div>

                        <div className="shrink-0 ml-3">
                          {!item.isRead ? (
                            <button
                              onClick={() => handleMarkAsRead(item._id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] text-indigo-700 font-bold bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition select-none cursor-pointer"
                            >
                              <Check className="h-3 w-3" />
                              Mark Read
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400 font-semibold bg-slate-100 rounded-md select-none">
                              <CheckCheck className="h-2.5 w-2.5" />
                              Read
                            </span>
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

        {/* ================= TAB 6: CUSTOMER SATISFACTION (READ-ONLY FOR ADMIN) ================= */}
        {activeTab === "satisfaction" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header with Read-only Indicator */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Customer Satisfaction & Ratings Analytics
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Comprehensive insights into customer feedback, star rating distributions, and overall customer satisfaction.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-slate-500" /> Read-Only Analytics View
                </span>
                <button
                  onClick={fetchSatisfactionReviews}
                  disabled={satisfactionLoading}
                  className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${satisfactionLoading ? "animate-spin" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards (4 Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Reviews */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider">Total Customer Reviews</span>
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-black text-slate-900">{satisfactionStats.totalReviews}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Total customer submissions recorded</p>
              </div>

              {/* Average Rating */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider">Average Platform Rating</span>
                  <div className="flex text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-900">{satisfactionStats.averageRating || 0}</p>
                  <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                </div>
                <div className="flex text-amber-400 mt-1 gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-2.5 w-2.5 ${
                        s <= Math.round(satisfactionStats.averageRating || 0)
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Negative / Bad Reviews (1-2 Stars) */}
              <div
                onClick={() =>
                  setSatisfactionFilterRating(
                    satisfactionFilterRating === "BAD" ? "ALL" : "BAD"
                  )
                }
                className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition ${
                  satisfactionFilterRating === "BAD"
                    ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400"
                    : "bg-white border-slate-200/80 hover:border-rose-200 hover:bg-rose-50/20"
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Negative / Bad Reviews (1-2★)
                  </span>
                  {satisfactionStats.badReviewsCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full">
                      ATTENTION
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-rose-600">{satisfactionStats.badReviewsCount}</p>
                <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                  {satisfactionFilterRating === "BAD" ? "Filtered to bad feedback (click to reset)" : "Click to filter negative complaints"}
                </p>
              </div>

              {/* Customer Satisfaction Rate */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider">Customer Satisfaction</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-emerald-600">
                  {satisfactionStats.satisfactionRate}%
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {satisfactionStats.positiveReviewsCount} satisfied customers (4★ & 5★)
                </p>
              </div>
            </div>

            {/* Satisfaction Sentiment & Star Breakdown Distribution */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4">
                Rating Distribution & Customer Sentiment Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {[
                  { star: 5, label: "5 Stars (Excellent)", color: "bg-emerald-500", count: satisfactionStats.breakdown?.[5] || 0 },
                  { star: 4, label: "4 Stars (Good)", color: "bg-teal-500", count: satisfactionStats.breakdown?.[4] || 0 },
                  { star: 3, label: "3 Stars (Average)", color: "bg-amber-500", count: satisfactionStats.breakdown?.[3] || 0 },
                  { star: 2, label: "2 Stars (Poor)", color: "bg-orange-500", count: satisfactionStats.breakdown?.[2] || 0 },
                  { star: 1, label: "1 Star (Very Bad)", color: "bg-rose-500", count: satisfactionStats.breakdown?.[1] || 0 },
                ].map((item) => {
                  const pct = satisfactionStats.totalReviews > 0
                    ? Math.round((item.count / satisfactionStats.totalReviews) * 100)
                    : 0;
                  return (
                    <div
                      key={item.star}
                      onClick={() => setSatisfactionFilterRating(String(item.star))}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                        satisfactionFilterRating === String(item.star)
                          ? "border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-400"
                          : "border-slate-100 bg-slate-50/60 hover:bg-slate-100/80"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="flex items-center gap-1 text-slate-800">
                          <span>{item.star}★</span>
                          <span className="text-[10px] text-slate-400 font-normal">({item.count})</span>
                        </span>
                        <span className="text-slate-900 font-black">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Filter Controls & Search */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={satisfactionSearchQuery}
                    onChange={(e) => setSatisfactionSearchQuery(e.target.value)}
                    placeholder="Search feedback by customer name, keywords (e.g., quality, soft, delivery), or product..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-indigo-500 focus:bg-white"
                  />
                  {satisfactionSearchQuery && (
                    <button
                      onClick={() => setSatisfactionSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter by Product */}
                <div className="shrink-0 w-full md:w-64">
                  <select
                    value={satisfactionProductFilter}
                    onChange={(e) => setSatisfactionProductFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-indigo-500"
                  >
                    <option value="ALL">All Products & Orders</option>
                    {Array.from(
                      new Map(
                        satisfactionReviews
                          .filter((r) => r.productId?._id)
                          .map((r) => [r.productId._id, r.productId.title])
                      ).entries()
                    ).map(([id, title]) => (
                      <option key={id} value={id}>
                        {title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rating Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-2 shrink-0">
                  Filter By:
                </span>
                {[
                  { key: "ALL", label: `All Feedback (${satisfactionReviews.length})` },
                  {
                    key: "BAD",
                    label: `🚨 Negative / Bad (1-2★) (${satisfactionStats.badReviewsCount})`,
                    alert: satisfactionStats.badReviewsCount > 0,
                  },
                  {
                    key: "POSITIVE",
                    label: `⭐ Satisfied (4-5★) (${satisfactionStats.positiveReviewsCount})`,
                  },
                  {
                    key: "NEUTRAL",
                    label: `➖ Neutral (3★) (${satisfactionStats.neutralReviewsCount})`,
                  },
                  { key: "1", label: `1★ (${satisfactionStats.breakdown?.[1] || 0})` },
                  { key: "2", label: `2★ (${satisfactionStats.breakdown?.[2] || 0})` },
                  { key: "3", label: `3★ (${satisfactionStats.breakdown?.[3] || 0})` },
                  { key: "4", label: `4★ (${satisfactionStats.breakdown?.[4] || 0})` },
                  { key: "5", label: `5★ (${satisfactionStats.breakdown?.[5] || 0})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSatisfactionFilterRating(tab.key)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${
                      satisfactionFilterRating === tab.key
                        ? tab.key === "BAD"
                          ? "bg-rose-600 text-white shadow-sm"
                          : "bg-indigo-600 text-white shadow-lg"
                        : tab.alert
                        ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Read-Only Feedback List */}
            {(() => {
              const filteredReviews = satisfactionReviews.filter((r) => {
                const rating = Number(r.rating) || 0;
                if (satisfactionFilterRating === "BAD" && rating > 2) return false;
                if (satisfactionFilterRating === "POSITIVE" && rating < 4) return false;
                if (satisfactionFilterRating === "NEUTRAL" && rating !== 3) return false;
                if (["1", "2", "3", "4", "5"].includes(satisfactionFilterRating) && String(rating) !== satisfactionFilterRating) return false;

                if (satisfactionSearchQuery.trim()) {
                  const q = satisfactionSearchQuery.toLowerCase();
                  const matchName = (r.userName || "").toLowerCase().includes(q);
                  const matchComment = (r.comment || "").toLowerCase().includes(q);
                  const matchProd = (r.productId?.title || r.designId?.tShirtType || "").toLowerCase().includes(q);
                  if (!matchName && !matchComment && !matchProd) return false;
                }

                if (satisfactionProductFilter !== "ALL") {
                  const pId = r.productId?._id || r.productId;
                  if (pId !== satisfactionProductFilter) return false;
                }

                return true;
              });

              if (satisfactionLoading) {
                return (
                  <div className="bg-white border rounded-3xl p-12 text-center shadow-xs">
                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-semibold">Loading customer satisfaction reviews...</p>
                  </div>
                );
              }

              if (filteredReviews.length === 0) {
                return (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">No satisfaction feedback found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {satisfactionSearchQuery || satisfactionFilterRating !== "ALL" || satisfactionProductFilter !== "ALL"
                        ? "No reviews match your filter parameters. Try resetting your filter criteria."
                        : "No customer reviews have been submitted yet."}
                    </p>
                    {(satisfactionSearchQuery || satisfactionFilterRating !== "ALL" || satisfactionProductFilter !== "ALL") && (
                      <button
                        onClick={() => {
                          setSatisfactionSearchQuery("");
                          setSatisfactionFilterRating("ALL");
                          setSatisfactionProductFilter("ALL");
                        }}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredReviews.map((rev) => {
                    const rating = Number(rev.rating) || 0;
                    const isBad = rating <= 2;
                    const isGood = rating >= 4;
                    const productName =
                      rev.productId?.title ||
                      rev.designId?.tShirtType ||
                      (rev.orderId ? `Order #${String(rev.orderId._id || rev.orderId).slice(-6).toUpperCase()}` : "Custom Design");
                    const productImage =
                      rev.productId?.images?.[0] ||
                      rev.designId?.thumbnailUrl ||
                      null;

                    return (
                      <div
                        key={rev._id}
                        className={`bg-white border rounded-2xl p-5 shadow-xs transition hover:shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                          isBad
                            ? "border-rose-200 bg-rose-50/15"
                            : isGood
                            ? "border-emerald-100 bg-white"
                            : "border-slate-200/80 bg-white"
                        }`}
                      >
                        {/* Customer feedback info */}
                        <div className="flex-1 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* Avatar */}
                            <div
                              className={`h-8 w-8 rounded-full text-white font-black text-xs flex items-center justify-center shadow-2xs ${
                                isBad
                                  ? "bg-rose-500"
                                  : isGood
                                  ? "bg-emerald-500"
                                  : "bg-indigo-500"
                              }`}
                            >
                              {(rev.userName || "C")[0].toUpperCase()}
                            </div>

                            <div>
                              <span className="text-xs font-black text-slate-900">
                                {rev.userName || "Verified Customer"}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-2 font-medium">
                                {new Date(rev.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>

                            {/* Stars */}
                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                              <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3 w-3 ${
                                      s <= rev.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-slate-200"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-slate-700">
                                {rev.rating}.0
                              </span>
                            </div>

                            {/* Sentiment Badge */}
                            {isBad ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[10px] font-black flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Dissatisfied / Complaint
                              </span>
                            ) : isGood ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-black flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" /> Satisfied Customer
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-[10px] font-black">
                                Neutral Rating
                              </span>
                            )}
                          </div>

                          {/* Customer Comment */}
                          <div
                            className={`p-3.5 rounded-xl text-xs leading-relaxed ${
                              isBad
                                ? "bg-rose-50/70 border border-rose-100 text-rose-950 font-medium"
                                : "bg-slate-50 border border-slate-100 text-slate-700"
                            }`}
                          >
                            <p className="italic">
                              "{rev.comment || "(No written text comment provided, star rating only)"}"
                            </p>
                          </div>

                          {/* Product Reference */}
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                            {productImage && (
                              <img
                                src={productImage}
                                alt={productName}
                                className="h-6 w-6 rounded object-cover border border-slate-200"
                              />
                            )}
                            <span>
                              Item: <strong className="text-slate-800 font-bold">{productName}</strong>
                            </span>
                            {rev.productId?.category && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[9px] font-semibold text-slate-600">
                                {rev.productId.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Read-only Badge on right */}
                        <div className="shrink-0 self-end md:self-center">
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-bold border border-slate-200/80">
                            Read-Only
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ================= MODAL: ADD INVENTORY ================= */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">
                  Add New Inventory Stock
                </h3>
                <p className="text-[10px] text-indigo-300 mt-0.5">
                  Stock Control & T-Shirt Style Inventory
                </p>
              </div>
              <button
                onClick={() => setShowInventoryModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveInventory}
              className="p-6 space-y-4 overflow-y-auto flex-1 text-slate-800"
            >
              {inventoryError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                  {inventoryError}
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Inventory Item Type
                </label>
                <select
                  value={inventoryForm.itemType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    const defaultStyleName = styles[0]?.name || styles[0]?.type || "Crew Neck";
                    const defaultStyle = styles.find((s) => (s.name || s.type) === defaultStyleName);
                    setInventoryForm((prev) => ({
                      ...prev,
                      itemType: newType,
                      materialCategory: "Transfer Paper",
                      tShirtType: newType === "Plain T-Shirt" ? defaultStyleName : "",
                      colorName: newType === "Printing Ink" ? "Cyan (C)" : (defaultStyle?.colors?.[0]?.name || "White"),
                      color: newType === "Printing Ink" ? "Cyan (C)" : (defaultStyle?.colors?.[0]?.value || "#ffffff"),
                    }));
                  }}
                  className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-indigo-500 font-semibold bg-white"
                >
                  <option value="Plain T-Shirt">T-Shirt (Garment Stock)</option>
                  <option value="Printing Ink">Printing Ink</option>
                  <option value="Materials">Materials & Packaging Supplies</option>
                </select>
              </div>

              {/* Sub-Material Selection when itemType === "Materials" */}
              {inventoryForm.itemType === "Materials" && (
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Select Material Category
                  </label>
                  <select
                    value={inventoryForm.materialCategory || "Transfer Paper"}
                    onChange={(e) =>
                      setInventoryForm((prev) => ({
                        ...prev,
                        materialCategory: e.target.value,
                      }))
                    }
                    className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-indigo-500 font-semibold bg-white"
                  >
                    <option value="Transfer Paper">Transfer Paper</option>
                    <option value="Packaging Material">Packaging Material</option>
                    <option value="Stick Tapes">Stick Tapes</option>
                    <option value="Label Stickers">Label Stickers</option>
                  </select>
                </div>
              )}

              {/* Printing Ink Color Selection Box */}
              {inventoryForm.itemType === "Printing Ink" && (
                <div className="space-y-3 bg-slate-50 p-4 border rounded-2xl">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                    Select Printing Ink Color Preset
                  </label>

                  {/* Essential Ink Presets List */}
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {[
                      {
                        name: "Cyan (C)",
                        value: "#00FFFF",
                        desc: "A bright, greenish-blue ink that filters out red light.",
                      },
                      {
                        name: "Magenta (M)",
                        value: "#FF00FF",
                        desc: "A vivid purplish-pink ink that filters out green light.",
                      },
                      {
                        name: "Yellow (Y)",
                        value: "#FFFF00",
                        desc: "A bright yellow ink that filters out blue light.",
                      },
                      {
                        name: "Key / Black (K)",
                        value: "#111827",
                        desc: "Key / Black process ink for deep shadows and line work.",
                      },
                      {
                        name: "White",
                        value: "#FFFFFF",
                        desc: "White underbase ink for dark garment printing.",
                      },
                      {
                        name: "Spot Red",
                        value: "#EF4444",
                        desc: "Vivid spot red screen printing ink.",
                      },
                      {
                        name: "Spot Blue",
                        value: "#3B82F6",
                        desc: "Royal spot blue screen printing ink.",
                      },
                      {
                        name: "Spot Green",
                        value: "#22C55E",
                        desc: "Bright spot green printing ink.",
                      },
                      {
                        name: "Metallic Gold",
                        value: "#EAB308",
                        desc: "Shimmering metallic gold specialty ink.",
                      },
                      {
                        name: "Metallic Silver",
                        value: "#94A3B8",
                        desc: "Metallic silver shimmer specialty ink.",
                      },
                    ].map((ink) => {
                      const isSelected =
                        inventoryForm.colorName === ink.name || inventoryForm.color === ink.name;
                      return (
                        <button
                          key={ink.name}
                          type="button"
                          onClick={() => {
                            setNewInkColor({ name: ink.name, value: ink.value });
                            setInventoryForm((prev) => ({
                              ...prev,
                              colorName: ink.name,
                              color: ink.name,
                            }));
                          }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${
                            isSelected
                              ? "ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50/80 shadow-xs"
                              : "border-slate-200 bg-white hover:bg-slate-100/70"
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span
                              className="h-4 w-4 rounded-full border border-slate-300 shrink-0"
                              style={{ backgroundColor: ink.value }}
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900">
                                {ink.name}
                              </p>
                              <p className="text-[10px] text-slate-500 font-medium">
                                {ink.desc}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-indigo-600 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Ink Color Preview Badge */}
                  {inventoryForm.colorName && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <span className="text-[10px] font-bold text-slate-400">Selected Ink:</span>
                      <div className="flex items-center gap-1.5 bg-white border border-indigo-200 rounded-full px-3 py-1 text-xs shadow-2xs">
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: newInkColor.value }}
                        />
                        <span className="font-bold text-indigo-950">
                          {inventoryForm.colorName}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {inventoryForm.itemType === "Plain T-Shirt" && (
                <>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Select T-Shirt Style / Type
                    </label>
                    <select
                      value={inventoryForm.tShirtType || (styles[0]?.name || styles[0]?.type || "Crew Neck")}
                      onChange={(e) => {
                        const styleVal = e.target.value;
                        const matchStyle = styles.find(
                          (s) => (s.name || s.type) === styleVal
                        );
                        const firstGsm = formatGsm(matchStyle?.gsmPrices?.[0]?.gsm || matchStyle?.gsms?.[0] || "GSM 180");
                        setInventoryForm((prev) => ({
                          ...prev,
                          tShirtType: styleVal,
                          colorName: matchStyle?.colors?.[0]?.name || "White",
                          color: matchStyle?.colors?.[0]?.value || "#ffffff",
                          material: firstGsm,
                        }));
                      }}
                      className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-indigo-500 font-semibold bg-white"
                    >
                      {styles.length > 0 ? (
                        styles.map((s) => (
                          <option key={s._id} value={s.name || s.type}>
                            {s.name || s.type}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="Crew Neck">Crew Neck</option>
                          <option value="V-Neck">V-Neck</option>
                          <option value="Polo">Polo</option>
                          <option value="Oversized">Oversized</option>
                          <option value="Hoodie">Hoodie</option>
                          <option value="Long Sleeve">Long Sleeve</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">
                      Allowed Style Color
                    </label>
                    {(() => {
                      const curStyle = styles.find(
                        (s) => (s.name || s.type) === (inventoryForm.tShirtType || styles[0]?.name || styles[0]?.type)
                      );
                      const availableColors = curStyle?.colors || [
                        { name: "White", value: "#ffffff" },
                        { name: "Black", value: "#111827" },
                      ];
                      return (
                        <div className="flex flex-wrap gap-2">
                          {availableColors.map((c, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() =>
                                setInventoryForm((prev) => ({
                                  ...prev,
                                  colorName: c.name,
                                  color: c.value,
                                }))
                              }
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer ${
                                inventoryForm.colorName === c.name
                                  ? "ring-2 ring-indigo-600 border-indigo-600 bg-indigo-50 text-indigo-950 font-bold"
                                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span
                                className="h-3.5 w-3.5 rounded-full border border-slate-300 shrink-0"
                                style={{ backgroundColor: c.value }}
                              />
                              <span>{c.name}</span>
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Size
                      </label>
                      <select
                        value={inventoryForm.size}
                        onChange={(e) =>
                          setInventoryForm((prev) => ({
                            ...prev,
                            size: e.target.value,
                          }))
                        }
                        className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-indigo-500 font-semibold bg-white"
                      >
                        {["S", "M", "L", "XL", "XXL", "3XL"].map((sz) => (
                          <option key={sz} value={sz}>
                            Size {sz}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        GSM Weight
                      </label>
                      {(() => {
                        const curStyle = styles.find(
                          (s) => (s.name || s.type) === (inventoryForm.tShirtType || styles[0]?.name || styles[0]?.type)
                        );
                        const styleGsms = curStyle?.gsmPrices && curStyle.gsmPrices.length > 0
                          ? curStyle.gsmPrices.map((gp) => formatGsm(gp.gsm))
                          : (curStyle?.gsms && curStyle.gsms.length > 0 ? curStyle.gsms.map(formatGsm) : ["GSM 180", "GSM 200", "GSM 220", "GSM 240"]);

                        return (
                          <select
                            value={inventoryForm.material}
                            onChange={(e) =>
                              setInventoryForm((prev) => ({
                                ...prev,
                                material: e.target.value,
                              }))
                            }
                            className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-indigo-500 font-semibold bg-white"
                          >
                            {styleGsms.map((gsmVal) => (
                              <option key={gsmVal} value={gsmVal}>
                                {gsmVal}
                              </option>
                            ))}
                          </select>
                        );
                      })()}
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4 border-t pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={inventoryForm.quantity}
                    onChange={(e) =>
                      setInventoryForm((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={inventoryForm.minThreshold}
                    onChange={(e) =>
                      setInventoryForm((prev) => ({
                        ...prev,
                        minThreshold: e.target.value,
                      }))
                    }
                    className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowInventoryModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inventoryActionLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {inventoryActionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Inventory Stock"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </>
  );
}

function Palette(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/>
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/>
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/>
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/>
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.63-.77 1.63-1.7 0-.44-.18-.85-.47-1.17-.3-.3-.48-.73-.48-1.19 0-.92.75-1.64 1.64-1.64H17c3.86 0 7-3.14 7-7 0-4.96-4.49-9-10-9z"/>
    </svg>
  );
}
