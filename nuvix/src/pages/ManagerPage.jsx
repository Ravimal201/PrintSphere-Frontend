import { useState, useEffect } from "react";
import {
  BarChart3, ShoppingCart, Layers, Inbox, Settings, LogOut,
  Loader2, AlertCircle, CheckCircle, TrendingUp, Sparkles, Plus,
  Edit2, Trash2, Check, X, ShieldAlert, Award, FileText, ChevronRight, Download
} from "lucide-react";
import axios from "axios";
import Scene from "../three/Scene";
import TShirt2D from "../components/TShirt2D";

import { API_BASE_URL } from "../config/api";

export default function ManagerPage() {
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "orders" | "products" | "pricing" | "inventory" | "styles" | "settings"

  // Styles tab states
  const [styles, setStyles] = useState([]);
  const [stylesLoading, setStylesLoading] = useState(false);
  const [stylesError, setStylesError] = useState("");
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [styleForm, setStyleForm] = useState({
    name: "",
    path: "",
    gsmPrices: [
      { gsm: "180GSM", price: 1200 },
      { gsm: "220GSM", price: 1500 }
    ],
    colors: [
      { name: "White", value: "#ffffff" },
      { name: "Black", value: "#111827" }
    ]
  });
  const [newGsmName, setNewGsmName] = useState("");
  const [newGsmPrice, setNewGsmPrice] = useState("");
  const [newColor, setNewColor] = useState({ name: "", value: "#ffffff" });

  // Data states
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pricingRules, setPricingRules] = useState(null);

  // Fetching loadings
  const [dataLoading, setDataLoading] = useState(false);

  // Product CRUD states
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    category: "",
    basePrice: 0,
    discount: 0,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["#ffffff"],
    images: [],
    modelPath: "/images/models/male normal t-shirt1.glb",
    defaultColor: "#ffffff",
    status: "Active"
  });
  const [productError, setProductError] = useState("");
  const [productSuccess, setProductSuccess] = useState("");
  const [productActionLoading, setProductActionLoading] = useState(false);

  // Pricing rules inputs
  const [pricingForm, setPricingForm] = useState({
    baseRates: { crewNeck: 12.00, vNeck: 14.00, polo: 18.00 },
    materialPremiums: { cotton: 0.00, polyester: 1.50, organicCotton: 3.00 },
    costPerSqIn: 0.02,
    complexityFeePerLayer: 1.00,
    volumeDiscount: { thresholdQty: 5, discountPercentage: 10 }
  });
  const [pricingSuccess, setPricingSuccess] = useState(false);
  const [pricingError, setPricingError] = useState("");

  // Restock states
  const [restockQuantities, setRestockQuantities] = useState({});

  // Manager 3D preview modal state for pending submissions
  const [selectedSubmissionProduct, setSelectedSubmissionProduct] = useState(null);
  const [submissionSide, setSubmissionSide] = useState("front");
  const [submissionZoom, setSubmissionZoom] = useState(0.85);

  // Assign employee & order status transitions
  const [assignLoading, setAssignLoading] = useState({});
  const [orderNotes, setOrderNotes] = useState({});

  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [passLoading, setPassLoading] = useState(false);

  // Check auth
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!userStr || !token) {
      window.location.href = "/login";
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role === "Manager" || user.role === "Admin") {
        setIsManager(true);
        fetchAllData();
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

  const fetchAllData = async () => {
    setDataLoading(true);
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch concurrently
      const [ordersRes, productsRes, inventoryRes, pricingRes, employeesRes, stylesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/manager/orders`, { headers }),
        axios.get(`${API_BASE_URL}/manager/products`, { headers }),
        axios.get(`${API_BASE_URL}/manager/inventory`, { headers }),
        axios.get(`${API_BASE_URL}/manager/pricing-rules`, { headers }),
        axios.get(`${API_BASE_URL}/manager/employees`, { headers }),
        axios.get(`${API_BASE_URL}/manager/tshirt-styles`, { headers })
      ]);

      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setInventory(inventoryRes.data);
      setPricingRules(pricingRes.data);
      setEmployees(employeesRes.data);
      setStyles(stylesRes.data);

      if (pricingRes.data) {
        setPricingForm({
          baseRates: pricingRes.data.baseRates || { crewNeck: 12.00, vNeck: 14.00, polo: 18.00 },
          materialPremiums: pricingRes.data.materialPremiums || { cotton: 0.00, polyester: 1.50, organicCotton: 3.00 },
          costPerSqIn: pricingRes.data.costPerSqIn ?? 0.02,
          complexityFeePerLayer: pricingRes.data.complexityFeePerLayer ?? 1.00,
          volumeDiscount: pricingRes.data.volumeDiscount || { thresholdQty: 5, discountPercentage: 10 }
        });
      }
    } catch (err) {
      console.error("Fetch dashboard data error:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // ================= ORDERS OPERATIONS =================

  const handleUpdateOrderStatus = async (orderId, status) => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    const note = orderNotes[orderId] || `Status updated to ${status}`;

    try {
      setAssignLoading(prev => ({ ...prev, [orderId]: true }));
      const response = await axios.put(
        `${API_BASE_URL}/manager/orders/${orderId}/status`,
        { status, note },
        { headers }
      );

      setOrders(prev => prev.map(o => o._id === orderId ? response.data.order : o));
      setOrderNotes(prev => ({ ...prev, [orderId]: "" }));
    } catch (err) {
      console.error("Update status error:", err);
      alert(err.response?.data?.message || "Failed to update order status");
    } finally {
      setAssignLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAssignEmployee = async (orderId, employeeId) => {
    if (!employeeId) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setAssignLoading(prev => ({ ...prev, [orderId]: true }));
      const response = await axios.put(
        `${API_BASE_URL}/manager/orders/${orderId}/status`,
        { assignedEmployeeId: employeeId, note: `Assigned employee tasks.` },
        { headers }
      );

      // Refresh order list
      const updatedOrders = await axios.get(`${API_BASE_URL}/manager/orders`, { headers });
      setOrders(updatedOrders.data);
    } catch (err) {
      console.error("Assign employee error:", err);
      alert("Failed to assign employee");
    } finally {
      setAssignLoading(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // ================= PRODUCTS CRUD & SUBMISSIONS =================

  const handleApproveProductDraft = async (id, action) => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.put(
        `${API_BASE_URL}/manager/products/${id}/approve`,
        { action },
        { headers }
      );
      alert(res.data.message);
      // reload products
      const productsRes = await axios.get(`${API_BASE_URL}/manager/products`, { headers });
      setProducts(productsRes.data);
    } catch (err) {
      console.error("Draft action error:", err);
      alert("Failed to process draft design");
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProductError("");
    setProductSuccess("");
    setProductActionLoading(true);

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      if (editingProduct) {
        // Edit Product
        await axios.put(
          `${API_BASE_URL}/manager/products/${editingProduct._id}`,
          productForm,
          { headers }
        );
        setProductSuccess("Product updated successfully!");
      } else {
        // Create Product
        await axios.post(
          `${API_BASE_URL}/manager/products`,
          productForm,
          { headers }
        );
        setProductSuccess("Product created successfully!");
      }

      // Reload
      const productsRes = await axios.get(`${API_BASE_URL}/manager/products`, { headers });
      setProducts(productsRes.data);

      setTimeout(() => {
        setShowProductModal(false);
        setEditingProduct(null);
        resetProductForm();
      }, 1200);

    } catch (err) {
      console.error("Save product error:", err);
      setProductError(err.response?.data?.message || "Failed to save product.");
    } finally {
      setProductActionLoading(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.delete(`${API_BASE_URL}/manager/products/${id}`, { headers });
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error("Delete product error:", err);
      alert("Failed to delete product");
    }
  };

  const handleProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm(prev => ({
        ...prev,
        images: [reader.result]
      }));
    };
    reader.readAsDataURL(file);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      title: product.title,
      description: product.description,
      category: product.category,
      basePrice: product.basePrice,
      discount: product.discount || 0,
      sizes: product.sizes || ["S", "M", "L", "XL", "XXL"],
      colors: product.colors || ["#ffffff"],
      images: product.images || [],
      modelPath: product.modelPath || "/images/models/male normal t-shirt1.glb",
      defaultColor: product.defaultColor || "#ffffff",
      status: product.status || "Active"
    });
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    setProductForm({
      title: "",
      description: "",
      category: "",
      basePrice: 0,
      discount: 0,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["#ffffff"],
      images: [],
      modelPath: "/images/models/male normal t-shirt1.glb",
      defaultColor: "#ffffff",
      status: "Active"
    });
    setProductError("");
    setProductSuccess("");
  };

  // ================= PRICING RULES =================

  const handleSavePricingRules = async (e) => {
    e.preventDefault();
    setPricingSuccess(false);
    setPricingError("");

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const res = await axios.put(`${API_BASE_URL}/manager/pricing-rules`, pricingForm, { headers });
      setPricingRules(res.data.rules);
      setPricingSuccess(true);
      setTimeout(() => setPricingSuccess(false), 2000);
    } catch (err) {
      console.error("Update pricing rules error:", err);
      setPricingError("Failed to update pricing rules.");
    }
  };

  // ================= INVENTORY CONTROL =================

  const handleRestockQuantity = async (itemId) => {
    const restockVal = parseInt(restockQuantities[itemId]);
    if (isNaN(restockVal) || restockVal <= 0) {
      alert("Please enter a valid positive number");
      return;
    }

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const item = inventory.find(i => i._id === itemId);
      const newQty = (item.quantity || 0) + restockVal;

      const res = await axios.put(
        `${API_BASE_URL}/manager/inventory/${itemId}`,
        { quantity: newQty },
        { headers }
      );

      setInventory(prev => prev.map(i => i._id === itemId ? res.data.item : i));
      setRestockQuantities(prev => ({ ...prev, [itemId]: "" }));
      alert("Stock updated successfully!");
    } catch (err) {
      console.error("Restock error:", err);
      alert("Failed to update inventory quantity");
    }
  };

  // ================= PASSWORD CHANGE =================

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

  // ================= T-SHIRT STYLES CRUD =================

  const handleSaveStyle = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    setStylesLoading(true);
    setStylesError("");

    const payload = {
      name: styleForm.name,
      path: styleForm.path,
      gsmPrices: styleForm.gsmPrices,
      colors: styleForm.colors
    };

    try {
      if (editingStyle) {
        await axios.put(`${API_BASE_URL}/manager/tshirt-styles/${editingStyle._id}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE_URL}/manager/tshirt-styles`, payload, { headers });
      }
      setShowStyleModal(false);
      setEditingStyle(null);
      setStyleForm({
        name: "",
        path: "",
        gsmPrices: [
          { gsm: "180GSM", price: 1200 },
          { gsm: "220GSM", price: 1500 }
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Black", value: "#111827" }
        ]
      });
      // Re-fetch
      const stylesRes = await axios.get(`${API_BASE_URL}/manager/tshirt-styles`, { headers });
      setStyles(stylesRes.data);
    } catch (err) {
      console.error("Save style error:", err);
      setStylesError(err.response?.data?.message || "Failed to save style.");
    } finally {
      setStylesLoading(false);
    }
  };

  const handleDeleteStyle = async (styleId) => {
    if (!confirm("Are you sure you want to delete this style?")) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.delete(`${API_BASE_URL}/manager/tshirt-styles/${styleId}`, { headers });
      const stylesRes = await axios.get(`${API_BASE_URL}/manager/tshirt-styles`, { headers });
      setStyles(stylesRes.data);
    } catch (err) {
      console.error("Delete style error:", err);
      alert("Failed to delete style.");
    }
  };

  // Helper selectors / values
  const pendingDrafts = products.filter(p => !p.isApproved && p.status === "Draft");
  const lowStockItems = inventory.filter(item => item.quantity <= item.minThreshold);
  const activeOrdersCount = orders.filter(o => o.orderStatus !== "Completed" && o.orderStatus !== "Cancelled" && o.orderStatus !== "Shipped").length;
  const totalRevenue = orders
    .filter(o => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + (o.totalCost || 0), 0);

  const getSubmissionLayers = () => {
    if (!selectedSubmissionProduct) return [];
    if (selectedSubmissionProduct.layers && selectedSubmissionProduct.layers.length > 0) {
      return selectedSubmissionProduct.layers;
    }
    return [
      {
        id: "logo-layer",
        type: "image",
        url: selectedSubmissionProduct.images?.[0] || "/images/dumyImage.png",
        visible: true,
        locked: true,
        position: [0, 0.1, 0.15],
        rotation: [0, 0, 0],
        scale: [0.35, 0.35, 0.35]
      }
    ];
  };

  const getSubmissionModelPath = () => {
    if (!selectedSubmissionProduct) return "/images/models/male normal t-shirt1.glb";
    if (selectedSubmissionProduct.modelPath) {
      return selectedSubmissionProduct.modelPath;
    }
    const title = (selectedSubmissionProduct.title || "").toLowerCase();
    const category = (selectedSubmissionProduct.category || "").toLowerCase();

    if (title.includes("female") || title.includes("women") || category.includes("female") || category.includes("women")) {
      return "/images/models/female normal t-shirt.glb";
    }
    if (title.includes("long sleeve") || category.includes("long sleeve")) {
      return "/images/models/long_sleeve_t-_shirt.glb";
    }
    if (title.includes("oversized") || category.includes("oversized")) {
      return "/images/models/oversized t-sdirt1.glb";
    }
    if (title.includes("hoodie") || category.includes("hoodie")) {
      return "/images/models/t_shirt_hoodie.glb";
    }
    return "/images/models/male normal t-shirt1.glb";
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!isManager) return null;

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden text-slate-800">

      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col justify-between shrink-0 select-none text-slate-400">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              M
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide leading-none">PrintSphere</h1>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Manager Desk</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "overview"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "orders"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <span className="flex items-center gap-3.5">
                <ShoppingCart className="h-4.5 w-4.5" />
                Orders Fulfillment
              </span>
              {activeOrdersCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-indigo-800 text-indigo-100 rounded-full">
                  {activeOrdersCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "products"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <span className="flex items-center gap-3.5">
                <Layers className="h-4.5 w-4.5" />
                Products & Submissions
              </span>
              {pendingDrafts.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-purple-500 text-white rounded-full">
                  {pendingDrafts.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("pricing")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "pricing"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <Sparkles className="h-4.5 w-4.5" />
              Pricing Rules
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "inventory"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <span className="flex items-center gap-3.5">
                <Inbox className="h-4.5 w-4.5" />
                Inventory stock
              </span>
              {lowStockItems.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black bg-amber-500 text-slate-900 rounded-full">
                  {lowStockItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("styles")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${activeTab === "styles"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
                }`}
            >
              <Layers className="h-4.5 w-4.5" />
              T-Shirt Styles
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

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => window.location.href = '/customer-home'}
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold hover:bg-slate-800 hover:text-slate-200 transition"
              >
                <Award className="h-4.5 w-4.5" />
                Preview Storefront
              </button>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Logged as Manager</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 select-none">
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Settled Revenue</span>
            <p className="text-2xl font-black text-slate-900 mt-1">Rs. {totalRevenue.toFixed(2)}</p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Paid transactions verified</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm relative">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Active Fulfillment</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{activeOrdersCount} orders</p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-2 font-bold">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Pending processing & print</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm relative">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Stock Alert Levels</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {lowStockItems.length === 0 ? "Perfect" : `${lowStockItems.length} Low`}
            </p>
            <div className="flex items-center gap-1.5 text-xs mt-2 font-bold">
              {lowStockItems.length > 0 ? (
                <span className="text-amber-600 flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" /> Items below threshold
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <Check className="h-3.5 w-3.5" /> All stock quantities stable
                </span>
              )}
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">Catalog Products</span>
            <p className="text-2xl font-black text-slate-900 mt-1">{products.length} published</p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-2 font-bold">
              <Layers className="h-3.5 w-3.5" />
              <span>{pendingDrafts.length} employee submissions</span>
            </div>
          </div>
        </div>

        {dataLoading && (
          <div className="mb-6 flex items-center justify-center gap-2 p-3 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold rounded-2xl">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing database changes...</span>
          </div>
        )}

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            <div className="bg-white border rounded-3xl p-6 shadow-sm select-none">
              <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Live Shop Operations & Active Pipeline
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 py-2">
                {["Pending Payment", "Processing", "Printing", "Completed", "Shipped", "Cancelled"].map((status, index) => {
                  const count = orders.filter(o => o.orderStatus === status).length;
                  return (
                    <div key={status} className="border border-slate-100 rounded-2xl p-4 text-center bg-slate-50/50">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">{status}</span>
                      <p className="text-xl font-black text-slate-900 mt-1">{count}</p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">Stage {index + 1}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Low Stock prediction list */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-950 mb-4 flex items-center gap-2">
                  <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
                  Predictive Inventory Alert & Action Console
                </h3>
                {lowStockItems.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-500 font-semibold">No predictive low-stock warnings triggered.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {lowStockItems.map(item => (
                      <div key={item._id} className="flex items-center justify-between border rounded-2xl p-4 hover:bg-slate-50 transition">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{item.itemType}</p>
                          <p className="text-[11px] text-slate-500">
                            {item.tShirtType ? `${item.tShirtType} — ${item.color} (${item.size})` : `Attributes: ${item.color || "None"}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black">
                            {item.quantity} units left
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1">Min threshold: {item.minThreshold}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Employee Designs */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-950 mb-4 flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-purple-500" />
                  Designs Awaiting Approval ({pendingDrafts.length})
                </h3>
                {pendingDrafts.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-500 font-semibold">All employee submissions approved & active.</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {pendingDrafts.map(draft => (
                      <div key={draft._id} className="flex items-center justify-between border rounded-2xl p-4 hover:bg-slate-50 transition">
                        <div className="flex items-center gap-4">
                          <TShirt2D
                            color={draft.colors?.[0]}
                            designUrl={draft.images?.[0]}
                            className="h-16 w-16 bg-slate-50 border rounded-xl shrink-0"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-900">{draft.title}</p>
                            <p className="text-[11px] text-slate-500">{draft.category} — Rs. {draft.basePrice.toFixed(2)}</p>
                            {draft.createdBy && (
                              <span className="text-[9px] text-purple-600 font-extrabold bg-purple-50 px-2 py-0.5 rounded-full mt-1 inline-block">
                                By {draft.createdBy.name || "Employee"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSubmissionProduct(draft);
                              setSubmissionSide("front");
                              setSubmissionZoom(0.85);
                            }}
                            className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                          >
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            <span>View 3D</span>
                          </button>
                          <button
                            onClick={() => handleApproveProductDraft(draft._id, "approve")}
                            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            title="Approve & Publish"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleApproveProductDraft(draft._id, "reject")}
                            className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: ORDERS fulfillment ================= */}
        {activeTab === "orders" && (
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
              Customer Orders & Production Pipeline
            </h3>

            {orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-slate-500 font-semibold">No customer orders found in the database.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order._id} className="border rounded-2xl p-5 hover:border-indigo-200 transition bg-slate-50/20">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-dashed">
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-500">Order ID: ...{order._id.slice(-8)}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${order.paymentStatus === "Paid" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                            }`}>
                            {order.paymentStatus}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${order.orderStatus === "Completed" ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-700"
                            }`}>
                            {order.orderStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Customer: {order.guestEmail || order.customerId?.email || "Unknown"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">Rs. {(order.totalCost || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Content Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                      {/* Items */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Order Items</h4>
                          <div className="space-y-3">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="bg-white p-3 border rounded-xl shadow-xs text-xs">
                                <p className="font-bold text-slate-900">{item.itemType} T-shirt (x{item.quantity})</p>
                                <p className="text-slate-500 text-[10px] mt-0.5">{item.material} / {item.size} / {item.color}</p>

                                {item.itemType === "Customized" && item.designId && (
                                  <div className="mt-2 pt-2 border-t space-y-2">
                                    {item.designId.thumbnailUrl && (
                                      <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg">
                                        <img
                                          src={item.designId.thumbnailUrl}
                                          alt="Preview"
                                          className="h-10 w-10 object-contain bg-white rounded border"
                                          onError={(e) => e.target.src = "/images/dumyImage.png"}
                                        />
                                        <div>
                                          <p className="text-[10px] font-bold text-slate-900">Custom design thumbnail</p>
                                          <a
                                            href={item.designId.thumbnailUrl}
                                            download
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[9px] text-indigo-600 hover:underline flex items-center gap-0.5 mt-0.5"
                                          >
                                            <Download className="h-2.5 w-2.5" /> Download composite
                                          </a>
                                        </div>
                                      </div>
                                    )}

                                    {/* Logo layers */}
                                    {(() => {
                                      const imgLayers = (item.designId.layers || []).filter(l => l.type === "image" || l.type === "logo");
                                      if (imgLayers.length > 0) {
                                        return (
                                          <div className="space-y-1 mt-2">
                                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Logo/Decal Assets:</p>
                                            {imgLayers.map((layer, lIdx) => (
                                              <div key={lIdx} className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg text-[10px]">
                                                <span className="truncate max-w-[120px] font-semibold">{layer.name || `Asset ${lIdx + 1}`}</span>
                                                <a
                                                  href={layer.url}
                                                  download
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="text-indigo-600 hover:underline"
                                                >
                                                  Download
                                                </a>
                                              </div>
                                            ))}
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Ship Address */}
                      <div>
                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Shipping Destination</h4>
                        {order.shippingAddress ? (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.country}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">Address not specified</p>
                        )}
                      </div>

                      {/* Assignments */}
                      <div>
                        <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">Assign Printing Staff</h4>
                        <div className="space-y-3">
                          <select
                            onChange={(e) => handleAssignEmployee(order._id, e.target.value)}
                            value={order.assignedEmployee?._id || ""}
                            className="w-full text-xs border rounded-xl px-2 py-1.5 bg-white font-bold"
                          >
                            <option value="">-- Click to assign staff --</option>
                            {employees.map(emp => (
                              <option key={emp._id} value={emp._id}>{emp.name}</option>
                            ))}
                          </select>
                          {order.assignedEmployee && (
                            <p className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2 py-1 rounded-lg">
                              Assigned task to: {order.assignedEmployee.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Transition Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-dashed">
                      <div className="flex-1">
                        <input
                          type="text"
                          placeholder="Optional timeline update note..."
                          value={orderNotes[order._id] || ""}
                          onChange={(e) => setOrderNotes(prev => ({ ...prev, [order._id]: e.target.value }))}
                          className="w-full text-xs border rounded-xl px-3 py-2 bg-white"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {["Processing", "Printing", "Completed", "Shipped", "Cancelled"].map(st => (
                          <button
                            key={st}
                            disabled={assignLoading[order._id]}
                            onClick={() => handleUpdateOrderStatus(order._id, st)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition ${order.orderStatus === st
                                ? "bg-indigo-600 text-white"
                                : "bg-white border text-slate-700 hover:bg-slate-50"
                              }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: PRODUCT CATALOG ================= */}
        {activeTab === "products" && (
          <div className="space-y-8">

            {/* Catalog Grid */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-indigo-600" />
                    Product Catalog & Categories
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    resetProductForm();
                    setShowProductModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-slate-500 font-semibold">No catalog products loaded.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        <th className="pb-3">Title</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Discount</th>
                        <th className="pb-3">Sizes</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p._id} className="border-b last:border-b-0 hover:bg-slate-50/50 transition">
                          <td className="py-4 font-bold text-slate-900">
                            <div className="flex items-center gap-3">
                              <TShirt2D
                                color={p.colors?.[0]}
                                designUrl={p.images?.[0]}
                                className="h-10 w-10 bg-slate-50 border rounded-lg shrink-0"
                              />
                              <div>
                                <p>{p.title}</p>
                                {!p.isApproved && (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[8px] font-black rounded-full uppercase mt-1 inline-block">
                                    Awaiting Approval
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 text-xs text-slate-600">{p.category}</td>
                          <td className="py-4 text-xs font-bold text-slate-900">Rs. {(p.basePrice || 0).toFixed(2)}</td>
                          <td className="py-4 text-xs">
                            {p.discount > 0 ? (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold">
                                {p.discount}% Off
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-4 text-xs text-slate-500">{(p.sizes || []).join(", ")}</td>
                          <td className="py-4 text-xs">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${p.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
                              }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button
                              onClick={() => openEditProduct(p)}
                              className="inline-flex items-center p-1.5 rounded-lg border hover:bg-slate-50 transition"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-slate-500" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p._id)}
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

            {/* Product Create/Edit Modal */}
            {showProductModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md border shadow-2xl overflow-hidden">
                  <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                        {editingProduct ? "Edit Product Details" : "Create New Store Product"}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">Manager Catalog Administration</p>
                    </div>
                    <button onClick={() => { setShowProductModal(false); setEditingProduct(null); }} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveProduct} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                    {productError && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{productError}</span>
                      </div>
                    )}
                    {productSuccess && (
                      <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                        <CheckCircle className="h-4 w-4 shrink-0" />
                        <span>{productSuccess}</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Product Title</label>
                      <input
                        type="text"
                        required
                        value={productForm.title}
                        onChange={(e) => setProductForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Classic Organic T-shirt"
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Description</label>
                      <textarea
                        required
                        value={productForm.description}
                        onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Explain item features..."
                        className="w-full px-3 py-2 border rounded-xl text-sm h-16"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category</label>
                      <input
                        type="text"
                        required
                        value={productForm.category}
                        onChange={(e) => setProductForm(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="e.g. Summer Collection"
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Base Price (Rs.)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={productForm.basePrice}
                          onChange={(e) => setProductForm(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Discount (%)</label>
                        <input
                          type="number"
                          max="100"
                          min="0"
                          value={productForm.discount}
                          onChange={(e) => setProductForm(prev => ({ ...prev, discount: parseInt(e.target.value) || 0 }))}
                          className="w-full px-3 py-2 border rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Status</label>
                        <select
                          value={productForm.status}
                          onChange={(e) => setProductForm(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-xl text-sm"
                        >
                          <option value="Active">Active</option>
                          <option value="Draft">Draft</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">3D T-Shirt Cut Style</label>
                        <select
                          value={productForm.modelPath}
                          onChange={(e) => setProductForm(prev => ({ ...prev, modelPath: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-xl text-sm"
                        >
                          <option value="/images/models/male normal t-shirt1.glb">Men's T-Shirt</option>
                          <option value="/images/models/female normal t-shirt.glb">Women's T-Shirt</option>
                          <option value="/images/models/long_sleeve_t-_shirt.glb">Long Sleeve Shirt</option>
                          <option value="/images/models/oversized t-sdirt1.glb">Oversized T-Shirt</option>
                          <option value="/images/models/t_shirt_hoodie.glb">Hoodie</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Default Color</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={productForm.defaultColor}
                            onChange={(e) => setProductForm(prev => ({ ...prev, defaultColor: e.target.value, colors: [e.target.value] }))}
                            className="h-8 w-10 border rounded-lg p-0 bg-transparent cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={productForm.defaultColor}
                            onChange={(e) => setProductForm(prev => ({ ...prev, defaultColor: e.target.value, colors: [e.target.value] }))}
                            className="w-full px-3 py-1.5 border rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Product Image (Mockup)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Or Image URL</label>
                      <input
                        type="text"
                        placeholder="e.g. /images/dumyImage.png or Base64 string..."
                        value={productForm.images?.[0] || ""}
                        onChange={(e) => setProductForm(prev => ({ ...prev, images: [e.target.value] }))}
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <button
                        type="button"
                        onClick={() => { setShowProductModal(false); setEditingProduct(null); }}
                        className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={productActionLoading}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                      >
                        {productActionLoading ? "Saving..." : "Save Product"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: PRICING RULES ================= */}
        {activeTab === "pricing" && (
          <div className="bg-white border rounded-3xl p-6 shadow-sm max-w-2xl">
            <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-600" />
              Configure Cost Parameters & Estimation Rules
            </h3>

            <form onSubmit={handleSavePricingRules} className="space-y-6">
              {pricingSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>Pricing parameters updated successfully!</span>
                </div>
              )}
              {pricingError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{pricingError}</span>
                </div>
              )}

              {/* Formulas and Coefficients */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Printing parameters</h4>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase">Printing Cost per Sq. Inch (Rs.)</label>
                  <input
                    type="number"
                    step="0.001"
                    className="w-full px-3 py-2 border rounded-xl text-sm mt-1 max-w-xs"
                    value={pricingForm.costPerSqIn}
                    onChange={(e) => setPricingForm(prev => ({ ...prev, costPerSqIn: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              {/* Volume Discount */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Volume Discounts & threshold</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Quantity Threshold</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-xl text-sm mt-1"
                      value={pricingForm.volumeDiscount.thresholdQty}
                      onChange={(e) => setPricingForm(prev => ({
                        ...prev,
                        volumeDiscount: { ...prev.volumeDiscount, thresholdQty: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase">Discount percentage (%)</label>
                    <input
                      type="number"
                      max="100"
                      className="w-full px-3 py-2 border rounded-xl text-sm mt-1"
                      value={pricingForm.volumeDiscount.discountPercentage}
                      onChange={(e) => setPricingForm(prev => ({
                        ...prev,
                        volumeDiscount: { ...prev.volumeDiscount, discountPercentage: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Save Pricing Rules
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 5: INVENTORY ================= */}
        {activeTab === "inventory" && (
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
              <Inbox className="h-5 w-5 text-indigo-600" />
              Manage Inventory Stock & Restocking
            </h3>

            {inventory.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-slate-500 font-semibold">No inventory records configured.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                      <th className="pb-3">Item Name</th>
                      <th className="pb-3">Type Details</th>
                      <th className="pb-3">Size/Color</th>
                      <th className="pb-3">Current Stock</th>
                      <th className="pb-3">Min Threshold</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Restock Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const isLow = item.quantity <= item.minThreshold;
                      return (
                        <tr key={item._id} className="border-b last:border-b-0 hover:bg-slate-50/50 transition">
                          <td className="py-4 font-bold text-slate-900">{item.itemType}</td>
                          <td className="py-4 text-xs text-slate-600">
                            {item.tShirtType || "Generic consumable"} {item.material ? `(${item.material})` : ""}
                          </td>
                          <td className="py-4 text-xs text-slate-500">
                            {item.size || item.color ? `${item.color || ""} ${item.size || ""}` : "—"}
                          </td>
                          <td className="py-4 text-xs font-bold text-slate-900">{item.quantity} units</td>
                          <td className="py-4 text-xs text-slate-400">{item.minThreshold} units</td>
                          <td className="py-4 text-xs">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isLow
                                ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                                : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                              }`}>
                              {isLow ? "Low stock" : "In Stock"}
                            </span>
                          </td>
                          <td className="py-4 text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <input
                                type="number"
                                placeholder="+ Qty"
                                value={restockQuantities[item._id] || ""}
                                onChange={(e) => setRestockQuantities(prev => ({
                                  ...prev,
                                  [item._id]: e.target.value
                                }))}
                                className="w-16 px-2 py-1 text-xs border rounded-xl text-center"
                              />
                              <button
                                onClick={() => handleRestockQuantity(item._id)}
                                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold transition"
                              >
                                Add
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: T-SHIRT STYLES ================= */}
        {activeTab === "styles" && (
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                <Layers className="h-5 w-5 text-indigo-600" />
                Manage T-Shirt Styles
              </h3>
              <button
                onClick={() => {
                  setEditingStyle(null);
                  setStyleForm({
                    name: "",
                    path: "",
                    gsmPrices: [
                      { gsm: "180GSM", price: 1200 },
                      { gsm: "220GSM", price: 1500 }
                    ],
                    colors: [
                      { name: "White", value: "#ffffff" },
                      { name: "Black", value: "#111827" }
                    ]
                  });
                  setShowStyleModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                Add New Style
              </button>
            </div>

            {styles.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-slate-500 font-semibold">No T-Shirt styles configured.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {styles.map((style) => (
                  <div key={style._id} className="border rounded-2xl p-5 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b pb-3 mb-3">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{style.name}</h4>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{style.type || "Crew Neck"}</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono break-all mb-3.5">
                        Model Path: <span className="text-slate-600 font-semibold">{style.path}</span>
                      </p>
                      <div className="mb-3.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">Weights & Pricing</span>
                        <div className="flex flex-col gap-1.5">
                          {(style.gsmPrices && style.gsmPrices.length > 0
                            ? style.gsmPrices
                            : (style.gsms || []).map(g => ({ gsm: g, price: style.price || 1200 }))
                          ).map((gp, i) => (
                            <div key={i} className="flex justify-between items-center text-[11px] font-semibold text-slate-700 bg-white border px-2.5 py-1.5 rounded-xl shadow-2xs">
                              <span>{gp.gsm}</span>
                              <span className="text-indigo-650 font-bold">Rs. {(gp.price || 0).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">Colors ({style.colors?.length || 0})</span>
                        <div className="flex flex-wrap gap-2">
                          {(style.colors || []).map((color, i) => (
                            <div
                              key={i}
                              className="group relative flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 shadow-2xs"
                              style={{ backgroundColor: color.value }}
                              title={`${color.name} (${color.value})`}
                            >
                              <span className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 rounded bg-slate-950 px-1.5 py-0.5 text-[8px] font-bold text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-10">
                                {color.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 border-t pt-4 mt-4">
                      <button
                        onClick={() => {
                          setEditingStyle(style);
                          setStyleForm({
                            name: style.name,
                            path: style.path,
                            gsmPrices: style.gsmPrices && style.gsmPrices.length > 0
                              ? style.gsmPrices
                              : (style.gsms || []).map(g => ({ gsm: g, price: style.price || 1200 })),
                            colors: style.colors || []
                          });
                          setShowStyleModal(true);
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStyle(style._id)}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 6: SETTINGS ================= */}
        {activeTab === "settings" && (
          <div className="bg-white border rounded-3xl p-6 shadow-sm max-w-md">
            <h3 className="text-lg font-bold text-slate-950 mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-indigo-600" />
              Settings & Account Security
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider border-b pb-1 mb-4">
                Change Account Password
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
        )}

      </div>

      {/* Manager interactive 3D review modal */}
      {selectedSubmissionProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl border shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh] md:h-[600px] select-none text-slate-800">

            {/* Left 3D Panel */}
            <div className="flex-1 bg-slate-50 relative flex flex-col justify-between p-6 border-b md:border-b-0 md:border-r">
              <div className="absolute top-4 left-4 z-10">
                <span className="px-3 py-1 bg-purple-50 border border-purple-100 text-purple-700 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Employee Submission 3D Review
                </span>
              </div>

              {/* Preset Side buttons */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5">
                {["front", "back", "left", "right"].map((side) => (
                  <button
                    key={side}
                    onClick={() => setSubmissionSide(side)}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border transition shadow-xs ${submissionSide === side
                        ? "bg-purple-600 border-purple-600 text-white"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {side}
                  </button>
                ))}
              </div>

              {/* 3D Scene container */}
              <div className="w-full h-full min-h-[280px] md:min-h-0 flex-1">
                <Scene
                  modelPath={getSubmissionModelPath()}
                  shirtColor={selectedSubmissionProduct.colors?.[0] || "#ffffff"}
                  activeSide={submissionSide}
                  zoomLevel={submissionZoom}
                  layers={getSubmissionLayers()}
                  selectedLayerId={null}
                  onSelectLayer={() => { }}
                  onUpdateLayers={() => { }}
                />
              </div>

              {/* Zoom control */}
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xs border rounded-2xl px-4 py-2 self-center z-10 shadow-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Zoom</span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={submissionZoom}
                  onChange={(e) => setSubmissionZoom(parseFloat(e.target.value))}
                  className="w-28 accent-purple-600 h-1 bg-slate-200 rounded-lg appearance-none"
                />
              </div>
            </div>

            {/* Right Product metadata & actions */}
            <div className="w-full md:w-[400px] flex flex-col justify-between p-6 bg-white overflow-y-auto">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">
                      {selectedSubmissionProduct.category}
                    </span>
                    <h3 className="text-xl font-black text-slate-900 leading-tight mt-0.5">
                      {selectedSubmissionProduct.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedSubmissionProduct(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="pb-4 border-b">
                  <span className="text-2xl font-black text-slate-955">
                    Proposed Price: Rs. {selectedSubmissionProduct.basePrice.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Description</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedSubmissionProduct.description}</p>
                </div>

                {selectedSubmissionProduct.createdBy && (
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-purple-600 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Designer</span>
                      <span className="text-xs font-bold text-purple-800">{selectedSubmissionProduct.createdBy.name || "Employee"}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sizes Included</span>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedSubmissionProduct.sizes?.map((sz) => (
                      <span key={sz} className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs">
                        {sz}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fabric Colors</span>
                  <div className="flex gap-2">
                    {selectedSubmissionProduct.colors?.map((col) => (
                      <span
                        key={col}
                        className="w-6 h-6 rounded-full border border-slate-300 shadow-xs"
                        style={{ backgroundColor: col }}
                        title={col}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-8 pt-4 border-t flex flex-col gap-2">
                <button
                  onClick={() => {
                    handleApproveProductDraft(selectedSubmissionProduct._id, "approve");
                    setSelectedSubmissionProduct(null);
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve & Publish to Store</span>
                </button>
                <button
                  onClick={() => {
                    handleApproveProductDraft(selectedSubmissionProduct._id, "reject");
                    setSelectedSubmissionProduct(null);
                  }}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" />
                  <span>Reject Submission</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {showStyleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-sm uppercase tracking-wider">
                {editingStyle ? `Edit Style: ${editingStyle.name}` : "Add New T-Shirt Style"}
              </h3>
              <button
                onClick={() => { setShowStyleModal(false); setEditingStyle(null); }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStyle} className="p-6 space-y-4 overflow-y-auto flex-1">
              {stylesError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                  {stylesError}
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">Style Name</label>
                <input
                  type="text"
                  required
                  value={styleForm.name}
                  onChange={(e) => setStyleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. V-Neck Fitted T-Shirt"
                  className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-indigo-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">3D GLTF Model File Path</label>
                <input
                  type="text"
                  required
                  value={styleForm.path}
                  onChange={(e) => setStyleForm(prev => ({ ...prev, path: e.target.value }))}
                  placeholder="e.g. /images/models/v_neck.glb"
                  className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-indigo-500 font-mono"
                />
              </div>

              <div className="border-t pt-4">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider block mb-2">Configure GSM Weights & Prices</label>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="GSM name (e.g. 220GSM)"
                    value={newGsmName}
                    onChange={(e) => setNewGsmName(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Price (Rs.)"
                    value={newGsmPrice}
                    onChange={(e) => setNewGsmPrice(e.target.value)}
                    className="w-28 px-3 py-2 border rounded-xl text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newGsmName.trim()) return alert("Please type a GSM name.");
                      if (!newGsmPrice) return alert("Please type a price.");
                      setStyleForm(prev => ({
                        ...prev,
                        gsmPrices: [
                          ...prev.gsmPrices.filter(gp => gp.gsm.toLowerCase() !== newGsmName.trim().toLowerCase()),
                          { gsm: newGsmName.trim(), price: Number(newGsmPrice) }
                        ]
                      }));
                      setNewGsmName("");
                      setNewGsmPrice("");
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Add GSM
                  </button>
                </div>

                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                  {styleForm.gsmPrices.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold p-2">No GSM prices added yet.</p>
                  ) : (
                    styleForm.gsmPrices.map((gp, i) => (
                      <div key={i} className="flex items-center justify-between bg-white border rounded-xl px-3 py-1.5 text-xs shadow-2xs">
                        <span className="font-semibold text-slate-700">{gp.gsm}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-900">Rs. {gp.price.toFixed(2)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setStyleForm(prev => ({
                                ...prev,
                                gsmPrices: prev.gsmPrices.filter((_, idx) => idx !== i)
                              }));
                            }}
                            className="text-rose-500 hover:text-rose-700 transition"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider block mb-2">Configure Allowed Brand Colors</label>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Color name (e.g. Royal Blue)"
                    value={newColor.name}
                    onChange={(e) => setNewColor(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 px-3 py-2 border rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="color"
                    value={newColor.value}
                    onChange={(e) => setNewColor(prev => ({ ...prev, value: e.target.value }))}
                    className="h-8 w-12 p-0.5 border rounded-xl cursor-pointer bg-white shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newColor.name.trim()) return alert("Please type a color name.");
                      setStyleForm(prev => ({
                        ...prev,
                        colors: [...prev.colors, { name: newColor.name.trim(), value: newColor.value }]
                      }));
                      setNewColor({ name: "", value: "#ffffff" });
                    }}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/50">
                  {styleForm.colors.length === 0 ? (
                    <p className="text-[10px] text-slate-400 font-semibold p-2">No colors added yet.</p>
                  ) : (
                    styleForm.colors.map((color, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white border rounded-full px-2.5 py-1 text-xs shadow-2xs">
                        <span className="h-3.5 w-3.5 rounded-full border border-slate-200" style={{ backgroundColor: color.value }} />
                        <span className="font-semibold text-slate-700">{color.name}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setStyleForm(prev => ({
                              ...prev,
                              colors: prev.colors.filter((_, idx) => idx !== i)
                            }));
                          }}
                          className="text-slate-400 hover:text-rose-500 font-bold ml-1 text-[10px] shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="border-t pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowStyleModal(false); setEditingStyle(null); }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stylesLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {stylesLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {editingStyle ? "Save Changes" : "Create Style"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
