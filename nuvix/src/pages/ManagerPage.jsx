import { useState, useEffect } from "react";
import { confirmAction, alertAction } from "../context/ConfirmContext";
import {
  BarChart3,
  ShoppingCart,
  Layers,
  Inbox,
  Settings,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ShieldAlert,
  Award,
  FileText,
  ChevronRight,
  Download,
  Search,
  Tag,
  Package,
  Filter,
  Ban,
  Clock,
  UserCheck,
  User,
  Calculator,
  DollarSign,
  HelpCircle,
  Info,
  ArrowRight,
  Sliders,
  ShieldCheck,
  Scale,
  Ruler,
  Boxes,
  RefreshCw,
  Zap,
  Percent,
  Star,
  MessageSquare,
  ThumbsDown,
  ThumbsUp,
  Eye,
  Mail,
  Phone,
  Menu,
} from "lucide-react";
import axios from "axios";
import Scene from "../three/Scene";
import TShirt2D from "../components/TShirt2D";
import TShirt3DModal from "../components/TShirt3DModal";
import DesignScreenshotViewer from "../components/DesignScreenshotViewer";
import TShirtStyleCard from "../components/TShirtStyleCard";
import Store3DCardPreview from "../components/Store3DCardPreview";

import { API_BASE_URL } from "../config/api";
import { resolveColorName, formatGsm } from "../utils/colorHelper";

export default function ManagerPage() {
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "orders" | "products" | "pricing" | "inventory" | "styles" | "settings"
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Styles tab states
  const [styles, setStyles] = useState([]);
  const [stylesLoading, setStylesLoading] = useState(false);
  const [stylesError, setStylesError] = useState("");
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [editingStyle, setEditingStyle] = useState(null);
  const [styleForm, setStyleForm] = useState({
    name: "",
    path: "",
    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    gsmPrices: [
      { gsm: "GSM 180", price: 1200 },
      { gsm: "GSM 220", price: 1500 },
    ],
    colors: [
      { name: "White", value: "#ffffff" },
      { name: "Black", value: "#111827" },
    ],
  });
  const [newGsmName, setNewGsmName] = useState("");
  const [newGsmPrice, setNewGsmPrice] = useState("");
  const [newColor, setNewColor] = useState({ name: "", value: "#ffffff" });
  const [newCustomSize, setNewCustomSize] = useState("");

  // Data states
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pricingRules, setPricingRules] = useState(null);

  // Reviews Moderation states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    badReviewsCount: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [reviewFilterRating, setReviewFilterRating] = useState("ALL"); // ALL | BAD | 1 | 2 | 3 | 4 | 5
  const [reviewSearchQuery, setReviewSearchQuery] = useState("");
  const [reviewProductFilter, setReviewProductFilter] = useState("ALL");

  // Inquiries / Contact Messages states
  const [inquiries, setInquiries] = useState([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState("ALL");
  const [inquirySourceFilter, setInquirySourceFilter] = useState("ALL");
  const [inquirySearchQuery, setInquirySearchQuery] = useState("");
  const [inquiryStats, setInquiryStats] = useState({ total: 0, new: 0, resolved: 0 });
  const [inquiryActionLoading, setInquiryActionLoading] = useState({});

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
    gsms: ["GSM 180", "GSM 200", "GSM 220", "GSM 240"],
    colors: ["#ffffff"],
    images: [],
    modelPath: "/images/models/male normal t-shirt1.glb",
    defaultColor: "#ffffff",
    status: "Active",
  });
  const [productError, setProductError] = useState("");
  const [productSuccess, setProductSuccess] = useState("");
  const [productActionLoading, setProductActionLoading] = useState(false);
  const [productTabFilter, setProductTabFilter] = useState("all"); // "all" | "pending" | "approved" | "archived"
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [approvingProductId, setApprovingProductId] = useState(null);

  // Orders tab states & filters
  const [orderTabFilter, setOrderTabFilter] = useState("all");

  // Order status classification helpers
  const isCancelledOrder = (order) => {
    return (
      order.orderStatus === "Cancelled" ||
      order.orderStatus === "Canceled"
    );
  };

  const isDeliveredOrder = (order) => {
    if (isCancelledOrder(order)) return false;
    return (
      order.orderStatus === "Collected" ||
      order.orderStatus === "Delivered" ||
      Boolean(order.isCollected)
    );
  };

  const isPendingPaymentOrder = (order) => {
    if (isCancelledOrder(order) || isDeliveredOrder(order)) return false;
    return (
      order.orderStatus === "Pending Payment" ||
      order.paymentStatus === "Pending"
    );
  };

  const isActiveOrder = (order) => {
    if (isCancelledOrder(order) || isDeliveredOrder(order)) return false;
    const hasEmployee = Boolean(
      order.assignedEmployee &&
      (typeof order.assignedEmployee === "object"
        ? order.assignedEmployee._id || order.assignedEmployee.name
        : order.assignedEmployee)
    );
    return !hasEmployee;
  };

  const isProgressOrder = (order) => {
    if (isCancelledOrder(order) || isDeliveredOrder(order)) return false;
    return order.orderStatus === "Processing";
  };

  const isPrintingOrder = (order) => {
    if (isCancelledOrder(order) || isDeliveredOrder(order)) return false;
    return order.orderStatus === "Printing";
  };

  const isCompletedOrder = (order) => {
    if (isCancelledOrder(order) || isDeliveredOrder(order)) return false;
    return order.orderStatus === "Completed";
  };

  const isShippedOrder = (order) => {
    if (isCancelledOrder(order) || isDeliveredOrder(order)) return false;
    return order.orderStatus === "Shipped";
  };

  // Order cancellation state
  const [cancellingOrder, setCancellingOrder] = useState(null); // { orderId, orderNumber, customerName }
  const [cancelReasonInput, setCancelReasonInput] = useState("");

  // Pricing rules inputs
  const [pricingForm, setPricingForm] = useState({
    baseRates: { crewNeck: 12.0, vNeck: 14.0, polo: 18.0 },
    materialPremiums: { cotton: 0.0, polyester: 1.5, organicCotton: 3.0 },
    costPerSqIn: 0.02,
    complexityFeePerLayer: 1.0,
    volumeDiscount: { thresholdQty: 5, discountPercentage: 10 },
  });
  const [pricingSuccess, setPricingSuccess] = useState(false);
  const [pricingError, setPricingError] = useState("");

  // Quick price calculation example inputs
  const [calcWidth, setCalcWidth] = useState(8);
  const [calcHeight, setCalcHeight] = useState(10);
  const [calcExtraLayers, setCalcExtraLayers] = useState(0);

  // Restock & Inventory states
  const [restockQuantities, setRestockQuantities] = useState({});
  const [editingThresholdId, setEditingThresholdId] = useState(null);
  const [thresholdInputs, setThresholdInputs] = useState({});
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    itemType: "Plain T-Shirt",
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
  const [showCustomInkColor, setShowCustomInkColor] = useState(false);

  // Inventory Filtering states
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState("TSHIRTS"); // TSHIRTS, INK, PAPERS_PACKAGING
  const [inventorySizeFilter, setInventorySizeFilter] = useState("ALL");
  const [inventoryColorFilter, setInventoryColorFilter] = useState("ALL");
  const [inventorySearchQuery, setInventorySearchQuery] = useState("");

  // Manager 3D preview modal state for pending submissions
  const [selectedSubmissionProduct, setSelectedSubmissionProduct] =
    useState(null);
  const [submissionSide, setSubmissionSide] = useState("front");
  const [submissionZoom, setSubmissionZoom] = useState(0.85);

  // Manager 3D preview modal state for custom customer designs in orders
  const [selected3DDesign, setSelected3DDesign] = useState(null);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);

  // Assign employee & order status transitions
  const [assignLoading, setAssignLoading] = useState({});
  const [orderNotes, setOrderNotes] = useState({});
  const [editingEmployeeOrderId, setEditingEmployeeOrderId] = useState(null);
  const [selectedEmployeeForOrder, setSelectedEmployeeForOrder] = useState({});

  // Insufficient Inventory popup modal state
  const [inventoryAlertModal, setInventoryAlertModal] = useState({
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
  const [showStorePreview, setShowStorePreview] = useState(false);

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
    try {
      const headers = { Authorization: `Bearer ${token}` };
      // Fetch concurrently with resilient fallbacks
      const [
        ordersRes,
        productsRes,
        inventoryRes,
        pricingRes,
        employeesRes,
        stylesRes,
        reviewsRes,
        inquiriesRes,
      ] = await Promise.all([
        axios
          .get(`${API_BASE_URL}/manager/orders`, { headers })
          .catch((e) => { console.warn("Failed to fetch orders:", e); return { data: [] }; }),
        axios
          .get(`${API_BASE_URL}/manager/products`, { headers })
          .catch((e) => { console.warn("Failed to fetch products:", e); return { data: [] }; }),
        axios
          .get(`${API_BASE_URL}/manager/inventory`, { headers })
          .catch((e) => { console.warn("Failed to fetch inventory:", e); return { data: [] }; }),
        axios
          .get(`${API_BASE_URL}/manager/pricing-rules`, { headers })
          .catch((e) => { console.warn("Failed to fetch pricing rules:", e); return { data: null }; }),
        axios
          .get(`${API_BASE_URL}/manager/employees`, { headers })
          .catch((e) => { console.warn("Failed to fetch employees:", e); return { data: [] }; }),
        axios
          .get(`${API_BASE_URL}/manager/tshirt-styles`, { headers })
          .catch((e) => { console.warn("Failed to fetch tshirt styles:", e); return { data: [] }; }),
        axios
          .get(`${API_BASE_URL}/manager/reviews`, { headers })
          .catch(() => ({ data: { reviews: [], stats: {} } })),
        axios
          .get(`${API_BASE_URL}/contact/inquiries`)
          .catch(() => ({ data: { data: [], stats: { total: 0, new: 0, resolved: 0 } } })),
      ]);

      setOrders(ordersRes.data || []);
      setProducts(productsRes.data || []);
      setInventory(inventoryRes.data || []);
      setPricingRules(pricingRes.data || null);
      setEmployees(employeesRes.data || []);
      setStyles(stylesRes.data || []);
      if (reviewsRes.data) {
        setReviews(reviewsRes.data.reviews || []);
        if (reviewsRes.data.stats) {
          setReviewStats(reviewsRes.data.stats);
        }
      }

      // Inquiries data
      if (inquiriesRes?.data?.success) {
        setInquiries(inquiriesRes.data.data || []);
        if (inquiriesRes.data.stats) {
          setInquiryStats(inquiriesRes.data.stats);
        }
      }

      if (pricingRes.data) {
        setPricingForm({
          baseRates: pricingRes.data.baseRates || {
            crewNeck: 12.0,
            vNeck: 14.0,
            polo: 18.0,
          },
          materialPremiums: pricingRes.data.materialPremiums || {
            cotton: 0.0,
            polyester: 1.5,
            organicCotton: 3.0,
          },
          costPerSqIn: pricingRes.data.costPerSqIn ?? 0.02,
          complexityFeePerLayer: pricingRes.data.complexityFeePerLayer ?? 1.0,
          volumeDiscount: pricingRes.data.volumeDiscount || {
            thresholdQty: 5,
            discountPercentage: 10,
          },
        });
      }
    } catch (err) {
      console.error("Fetch dashboard data error:", err);
    } finally {
      setDataLoading(false);
    }
  };

  const fetchInquiries = async () => {
    setInquiriesLoading(true);
    try {
      const inqRes = await axios.get(`${API_BASE_URL}/contact/inquiries`);
      if (inqRes.data?.success) {
        setInquiries(inqRes.data.data || []);
        if (inqRes.data.stats) {
          setInquiryStats(inqRes.data.stats);
        }
      }
    } catch (err) {
      console.error("Error fetching inquiries:", err);
    } finally {
      setInquiriesLoading(false);
    }
  };

  const handleUpdateInquiryStatus = async (id, newStatus) => {
    setInquiryActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.patch(`${API_BASE_URL}/contact/inquiries/${id}/status`, { status: newStatus });
      setInquiries((prev) =>
        prev.map((inq) => (inq._id === id ? { ...inq, status: newStatus } : inq))
      );
      // Refresh stats
      fetchInquiries();
    } catch (err) {
      console.error("Error updating inquiry status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    } finally {
      setInquiryActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDeleteInquiry = async (id) => {
    const isConfirmed = await confirmAction({
      title: "Delete Customer Inquiry",
      message: "Are you sure you want to delete this customer inquiry? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger"
    });
    if (!isConfirmed) return;
    setInquiryActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await axios.delete(`${API_BASE_URL}/contact/inquiries/${id}`);
      setInquiries((prev) => prev.filter((inq) => inq._id !== id));
      fetchInquiries();
    } catch (err) {
      console.error("Error deleting inquiry:", err);
      alertAction({
        title: "Delete Failed",
        message: err.response?.data?.message || "Failed to delete inquiry",
        type: "danger"
      });
    } finally {
      setInquiryActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // ================= ORDERS OPERATIONS =================

  const openCancelOrderModal = (order) => {
    setCancellingOrder({
      orderId: order._id,
      orderNumber: order._id.slice(-8).toUpperCase(),
      customerName:
        order.customerId?.name ||
        (typeof order.customerId === "object" && order.customerId?.email) ||
        order.guestEmail ||
        "Customer",
    });
    setCancelReasonInput("");
  };

  const handleConfirmCancelOrder = async () => {
    if (!cancellingOrder) return;
    const orderId = cancellingOrder.orderId;
    const finalReason = cancelReasonInput.trim() || "Order cancelled by store manager.";

    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setAssignLoading((prev) => ({ ...prev, [orderId]: true }));
      const response = await axios.put(
        `${API_BASE_URL}/manager/orders/${orderId}/status`,
        {
          status: "Cancelled",
          note: finalReason,
          cancellationReason: finalReason,
          cancelReason: finalReason,
        },
        { headers },
      );

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? response.data.order : o)),
      );
      setCancellingOrder(null);
      setCancelReasonInput("");
    } catch (err) {
      console.error("Cancel order error:", err);
      alert(err.response?.data?.message || "Failed to cancel order");
    } finally {
      setAssignLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleAssignEmployee = async (orderId, employeeId) => {
    if (!employeeId) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setAssignLoading((prev) => ({ ...prev, [orderId]: true }));
      const response = await axios.put(
        `${API_BASE_URL}/manager/orders/${orderId}/status`,
        { assignedEmployeeId: employeeId, note: `Assigned employee tasks.` },
        { headers },
      );

      // Update state
      if (response.data?.order) {
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? response.data.order : o)),
        );
      } else {
        const updatedOrders = await axios.get(`${API_BASE_URL}/manager/orders`, {
          headers,
        });
        setOrders(updatedOrders.data);
      }

      // Also refresh inventory state so stock deduction is reflected live
      try {
        const invRes = await axios.get(`${API_BASE_URL}/manager/inventory`, { headers });
        setInventory(invRes.data);
      } catch (invErr) {
        console.error("Refresh inventory error:", invErr);
      }

      setEditingEmployeeOrderId(null);
    } catch (err) {
      console.error("Assign employee error:", err);
      const errMsg = err.response?.data?.message || "Failed to assign employee";
      const details = err.response?.data?.details;
      const missingMaterials = err.response?.data?.missingMaterials || [];

      if (details || missingMaterials.length > 0) {
        setInventoryAlertModal({
          isOpen: true,
          title: "Insufficient Inventory Materials!",
          message: errMsg,
          details: details || "",
          missingItems: missingMaterials
        });
      } else {
        alert(errMsg);
      }
    } finally {
      setAssignLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  // ================= PRODUCTS CRUD & SUBMISSIONS =================

  const handleApproveProductDraft = async (id, action) => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setApprovingProductId(id);
      const res = await axios.put(
        `${API_BASE_URL}/manager/products/${id}/approve`,
        { action },
        { headers },
      );
      // reload products
      const productsRes = await axios.get(`${API_BASE_URL}/manager/products`, {
        headers,
      });
      setProducts(productsRes.data);
      if (selectedSubmissionProduct && selectedSubmissionProduct._id === id) {
        setSelectedSubmissionProduct(null);
      }
    } catch (err) {
      console.error("Draft action error:", err);
      alert(err.response?.data?.message || "Failed to process draft design");
    } finally {
      setApprovingProductId(null);
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
      const payloadToSave = {
        ...productForm,
        category: productForm.category || "T-Shirts"
      };

      if (editingProduct) {
        // Edit Product
        await axios.put(
          `${API_BASE_URL}/manager/products/${editingProduct._id}`,
          payloadToSave,
          { headers },
        );
        setProductSuccess("Product updated successfully!");
      } else {
        // Create Product
        await axios.post(`${API_BASE_URL}/manager/products`, payloadToSave, {
          headers,
        });
        setProductSuccess("Product created successfully!");
      }

      // Reload
      const productsRes = await axios.get(`${API_BASE_URL}/manager/products`, {
        headers,
      });
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
    const isConfirmed = await confirmAction({
      title: "Delete Store Product",
      message: "Are you sure you want to delete this product from the store?",
      confirmText: "Delete",
      type: "danger"
    });
    if (!isConfirmed) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.delete(`${API_BASE_URL}/manager/products/${id}`, { headers });
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete product error:", err);
      alertAction({
        title: "Delete Failed",
        message: "Failed to delete product",
        type: "danger"
      });
    }
  };

  const handleProductImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProductForm((prev) => ({
        ...prev,
        images: [reader.result],
      }));
    };
    reader.readAsDataURL(file);
  };

  const openEditProduct = (product) => {
    setEditingProduct(product);
    let resolvedGsms = product.gsms || [];
    if (resolvedGsms.length === 0) {
      const matchedStyle = styles.find((s) => s.path === product.modelPath);
      if (matchedStyle) {
        if (matchedStyle.gsmPrices && matchedStyle.gsmPrices.length > 0) {
          resolvedGsms = matchedStyle.gsmPrices.map((gp) => formatGsm(gp.gsm));
        } else if (matchedStyle.gsms && matchedStyle.gsms.length > 0) {
          resolvedGsms = matchedStyle.gsms.map(formatGsm);
        }
      }
    }
    if (resolvedGsms.length === 0) {
      resolvedGsms = ["GSM 180", "GSM 200", "GSM 220", "GSM 240"];
    }

    setProductForm({
      title: product.title,
      description: product.description,
      category: product.category,
      basePrice: product.basePrice,
      discount: product.discount || 0,
      sizes: product.sizes || ["S", "M", "L", "XL", "XXL"],
      gsms: resolvedGsms,
      colors: product.colors || ["#ffffff"],
      images: product.images || [],
      modelPath: product.modelPath || "/images/models/male normal t-shirt1.glb",
      defaultColor: product.defaultColor || "#ffffff",
      status: product.status || "Active",
    });
    setShowProductModal(true);
  };

  const resetProductForm = () => {
    const firstStyle = styles && styles.length > 0 ? styles[0] : null;
    let initialGsms = [];
    if (firstStyle) {
      if (firstStyle.gsmPrices && firstStyle.gsmPrices.length > 0) {
        initialGsms = firstStyle.gsmPrices.map((gp) => formatGsm(gp.gsm));
      } else if (firstStyle.gsms && firstStyle.gsms.length > 0) {
        initialGsms = firstStyle.gsms.map(formatGsm);
      }
    }
    if (initialGsms.length === 0) {
      initialGsms = ["GSM 180", "GSM 200", "GSM 220", "GSM 240"];
    }

    let initialColors = [];
    if (firstStyle && firstStyle.colors && firstStyle.colors.length > 0) {
      initialColors = firstStyle.colors.map((c) => (typeof c === "string" ? c : c.value));
    }
    if (initialColors.length === 0) {
      initialColors = ["#ffffff"];
    }

    setProductForm({
      title: "",
      description: "",
      category: firstStyle ? (firstStyle.name || firstStyle.type || "") : "",
      basePrice: firstStyle ? (firstStyle.price || 0) : 0,
      discount: 0,
      sizes: ["S", "M", "L", "XL", "XXL"],
      gsms: initialGsms,
      colors: initialColors,
      images: [],
      modelPath: firstStyle ? firstStyle.path : "/images/models/male normal t-shirt1.glb",
      defaultColor: initialColors[0] || "#ffffff",
      status: "Active",
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
      const res = await axios.put(
        `${API_BASE_URL}/manager/pricing-rules`,
        pricingForm,
        { headers },
      );
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
        { headers },
      );

      setInventory((prev) =>
        prev.map((i) => (i._id === itemId ? res.data.item : i)),
      );
      setRestockQuantities((prev) => ({ ...prev, [itemId]: "" }));
      alert(
        restockVal < 0
          ? "Stock removed successfully!"
          : "Stock added successfully!",
      );
    } catch (err) {
      console.error("Restock error:", err);
      alert(
        err.response?.data?.message || "Failed to update inventory quantity",
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
        { headers },
      );

      setInventory((prev) =>
        prev.map((i) => (i._id === itemId ? res.data.item : i)),
      );
      setEditingThresholdId(null);
      alert("Minimum threshold updated successfully!");
    } catch (err) {
      console.error("Threshold update error:", err);
      alert(
        err.response?.data?.message || "Failed to update minimum threshold",
      );
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
        { headers },
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
      type: styleForm.name, // style name is used for type
      sizes: styleForm.sizes && styleForm.sizes.length > 0 ? styleForm.sizes : ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
      gsmPrices: styleForm.gsmPrices,
      colors: styleForm.colors,
    };

    try {
      if (editingStyle) {
        await axios.put(
          `${API_BASE_URL}/manager/tshirt-styles/${editingStyle._id}`,
          payload,
          { headers },
        );
      } else {
        await axios.post(`${API_BASE_URL}/manager/tshirt-styles`, payload, {
          headers,
        });
      }
      setShowStyleModal(false);
      setEditingStyle(null);
      setStyleForm({
        name: "",
        path: "",
        sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
        gsmPrices: [
          { gsm: "GSM 180", price: 1200 },
          { gsm: "GSM 220", price: 1500 },
        ],
        colors: [
          { name: "White", value: "#ffffff" },
          { name: "Black", value: "#111827" },
        ],
      });
      // Re-fetch
      const stylesRes = await axios.get(
        `${API_BASE_URL}/manager/tshirt-styles`,
        { headers },
      );
      setStyles(stylesRes.data);
    } catch (err) {
      console.error("Save style error:", err);
      setStylesError(err.response?.data?.message || "Failed to save style.");
    } finally {
      setStylesLoading(false);
    }
  };

  const handleDeleteStyle = async (styleId) => {
    const isConfirmed = await confirmAction({
      title: "Delete T-Shirt Style",
      message: "Are you sure you want to delete this 3D style template?",
      confirmText: "Delete",
      type: "danger"
    });
    if (!isConfirmed) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.delete(`${API_BASE_URL}/manager/tshirt-styles/${styleId}`, {
        headers,
      });
      const stylesRes = await axios.get(
        `${API_BASE_URL}/manager/tshirt-styles`,
        { headers },
      );
      setStyles(stylesRes.data);
    } catch (err) {
      console.error("Delete style error:", err);
      alertAction({
        title: "Delete Failed",
        message: "Failed to delete style.",
        type: "danger"
      });
    }
  };

  // ================= INVENTORY CRUD =================

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

      const invRes = await axios.get(`${API_BASE_URL}/manager/inventory`, { headers });
      if (invRes.data && Array.isArray(invRes.data)) {
        setInventory(invRes.data);
      }

      setShowInventoryModal(false);
      setShowCustomInkColor(false);
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
    } catch (err) {
      console.error("Save inventory item error:", err);
      setInventoryError(err.response?.data?.message || "Failed to add inventory item.");
    } finally {
      setInventoryActionLoading(false);
    }
  };

  const handleDeleteInventory = async (id) => {
    const isConfirmed = await confirmAction({
      title: "Delete Inventory Item",
      message: "Are you sure you want to delete this inventory item? This action cannot be undone.",
      confirmText: "Delete",
      type: "danger"
    });
    if (!isConfirmed) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.delete(`${API_BASE_URL}/manager/inventory/${id}`, { headers });
      const invRes = await axios.get(`${API_BASE_URL}/manager/inventory`, { headers });
      setInventory(invRes.data);
    } catch (err) {
      console.error("Delete inventory item error:", err);
      alertAction({
        title: "Delete Failed",
        message: err.response?.data?.message || "Failed to delete inventory item.",
        type: "danger"
      });
    }
  };

  // Helper selectors / values
  const pendingDrafts = products.filter(
    (p) => !p.isApproved && p.status !== "Archived",
  );
  const lowStockItems = inventory.filter(
    (item) => item.quantity <= item.minThreshold,
  );
  const activeOrdersCount = orders.filter(
    (o) =>
      o.orderStatus !== "Completed" &&
      o.orderStatus !== "Cancelled" &&
      o.orderStatus !== "Shipped",
  ).length;
  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "Paid")
    .reduce((sum, o) => sum + (o.totalCost || 0), 0);

  const getSubmissionLayers = () => {
    if (!selectedSubmissionProduct) return [];
    if (
      selectedSubmissionProduct.layers &&
      selectedSubmissionProduct.layers.length > 0
    ) {
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
        scale: [0.35, 0.35, 0.35],
      },
    ];
  };

  const getSubmissionModelPath = () => {
    if (!selectedSubmissionProduct)
      return "/images/models/male normal t-shirt1.glb";
    if (selectedSubmissionProduct.modelPath && typeof selectedSubmissionProduct.modelPath === "string" && (selectedSubmissionProduct.modelPath.toLowerCase().endsWith(".glb") || selectedSubmissionProduct.modelPath.toLowerCase().endsWith(".gltf") || selectedSubmissionProduct.modelPath.toLowerCase().endsWith(".fbx"))) {
      return selectedSubmissionProduct.modelPath;
    }
    const title = (selectedSubmissionProduct.title || "").toLowerCase();
    const category = (selectedSubmissionProduct.category || "").toLowerCase();

    if (
      title.includes("female") ||
      title.includes("women") ||
      category.includes("female") ||
      category.includes("women")
    ) {
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
    <div className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden text-slate-800 relative">
      {/* Mobile Sidebar Backdrop Overlay */}
      {isMobileSidebarOpen && (
        <div
          onClick={() => setIsMobileSidebarOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-64 xl:w-72 bg-slate-900 flex flex-col justify-between shrink-0 select-none text-slate-400 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 h-full max-h-screen ${
          isMobileSidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Top Header Branding */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-[0_4px_12px_rgba(99,102,241,0.3)] shrink-0">
              M
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-white text-base tracking-wide leading-none truncate">
                PrintSphere
              </h1>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold block mt-1">
                Manager Desk
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5 min-h-0 [scrollbar-width:thin] [scrollbar-color:#334155_transparent]">
          <button
            onClick={() => {
              setActiveTab("overview");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
              activeTab === "overview"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <BarChart3 className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Dashboard Overview</span>
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("orders");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
              activeTab === "orders"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <ShoppingCart className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Orders Fulfillment</span>
            </span>
            {activeOrdersCount > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                  activeTab === "orders"
                    ? "bg-indigo-800 text-white"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                }`}
              >
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("products");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
              activeTab === "products"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Layers className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Products & Submissions</span>
            </span>
            {pendingDrafts.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                  activeTab === "products"
                    ? "bg-purple-800 text-white"
                    : "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                }`}
              >
                {pendingDrafts.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("pricing");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
              activeTab === "pricing"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Sparkles className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Pricing Rules</span>
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("inventory");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
              activeTab === "inventory"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Inbox className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Inventory Stock</span>
            </span>
            {lowStockItems.length > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                  activeTab === "inventory"
                    ? "bg-amber-400 text-slate-950 font-black"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {lowStockItems.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("styles");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
              activeTab === "styles"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Sliders className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">T-Shirt Styles</span>
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("reviews");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
              activeTab === "reviews"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <MessageSquare className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Reviews & Moderation</span>
            </span>
            {reviewStats.badReviewsCount > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 animate-pulse ${
                  activeTab === "reviews"
                    ? "bg-rose-800 text-white"
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}
              >
                {reviewStats.badReviewsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("inquiries");
              fetchInquiries();
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
              activeTab === "inquiries"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Mail className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Customer Inquiries</span>
            </span>
            {inquiryStats.new > 0 && (
              <span
                className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full shrink-0 ${
                  activeTab === "inquiries"
                    ? "bg-indigo-800 text-white"
                    : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                }`}
              >
                {inquiryStats.new}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("settings");
              setIsMobileSidebarOpen(false);
            }}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
              activeTab === "settings"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
            }`}
          >
            <span className="flex items-center gap-3 min-w-0">
              <Settings className="h-4.5 w-4.5 shrink-0" />
              <span className="truncate">Settings & Security</span>
            </span>
          </button>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                setActiveTab("store-preview");
                setShowStorePreview(true);
                setIsMobileSidebarOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 cursor-pointer text-left ${
                activeTab === "store-preview"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25"
                  : "text-slate-400 hover:bg-slate-800/80 hover:text-slate-100"
              }`}
            >
              <span className="flex items-center gap-3 min-w-0">
                <Award className="h-4.5 w-4.5 shrink-0" />
                <span className="truncate">Store Preview</span>
              </span>
            </button>
          </div>
        </nav>

        {/* Pinned Bottom User & Logout Section */}
        <div className="p-3.5 border-t border-slate-800 shrink-0 bg-slate-900/95">
          <div className="flex items-center justify-between mb-2.5 px-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] text-slate-400 font-semibold tracking-wide">
                Manager Session
              </span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-bold border border-slate-700">
              Active
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl border border-red-500/30 hover:border-red-500 text-xs text-red-400 font-semibold hover:bg-red-500/10 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile & Tablet Top Bar Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shrink-0 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition cursor-pointer border border-slate-200 shrink-0"
              aria-label="Open sidebar menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-slate-900 leading-tight truncate">
                PrintSphere
              </h2>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block truncate">
                {activeTab === "overview" && "Dashboard Overview"}
                {activeTab === "orders" && "Orders Fulfillment"}
                {activeTab === "products" && "Products & Submissions"}
                {activeTab === "pricing" && "Pricing Rules"}
                {activeTab === "inventory" && "Inventory Stock"}
                {activeTab === "styles" && "T-Shirt Styles"}
                {activeTab === "reviews" && "Reviews & Moderation"}
                {activeTab === "inquiries" && "Customer Inquiries"}
                {activeTab === "settings" && "Settings & Security"}
                {activeTab === "store-preview" && "Store Preview"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
              M
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="p-4 sm:p-6 lg:p-8">
        {/* Statistics Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 select-none">
          <div className="bg-white border rounded-3xl p-6 shadow-sm">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
              Settled Revenue
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              Rs. {totalRevenue.toFixed(2)}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-bold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Paid transactions verified</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm relative">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
              Active Fulfillment
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {activeOrdersCount} orders
            </p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-2 font-bold">
              <ShoppingCart className="h-3.5 w-3.5" />
              <span>Pending processing & print</span>
            </div>
          </div>
          <div className="bg-white border rounded-3xl p-6 shadow-sm relative">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
              Stock Alert Levels
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {lowStockItems.length === 0
                ? "Perfect"
                : `${lowStockItems.length} Low`}
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
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-black">
              Catalog Products
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {products.length} published
            </p>
            <div className="flex items-center gap-1.5 text-xs text-indigo-600 mt-2 font-bold">
              <Layers className="h-3.5 w-3.5" />
              <span>{pendingDrafts.length} employee submissions</span>
            </div>
          </div>
        </div>

        {activeTab === "store-preview" && (
          <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-950">
                  Store Preview
                </h3>
                <p className="text-sm text-slate-500">
                  This preview shows the store page only while the manager
                  dashboard stays visible.
                </p>
              </div>
            </div>
            <div className="h-[75vh] min-h-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
              <iframe
                src={`${window.location.origin}/store?preview=manager`}
                title="Store Preview"
                className="h-full w-full border-0"
              />
            </div>
          </div>
        )}

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
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 py-2">
                {[
                  { label: "Active (Unassigned)", filter: (o) => isActiveOrder(o) },
                  { label: "Processing", filter: (o) => isProgressOrder(o) },
                  { label: "Printing", filter: (o) => isPrintingOrder(o) },
                  { label: "Completed", filter: (o) => isCompletedOrder(o) },
                  { label: "Shipped", filter: (o) => isShippedOrder(o) },
                  { label: "Delivered", filter: (o) => isDeliveredOrder(o) },
                  { label: "Cancelled", filter: (o) => isCancelledOrder(o) },
                  { label: "Pending Payment", filter: (o) => isPendingPaymentOrder(o) },
                ].map((item, index) => {
                  const count = orders.filter(item.filter).length;
                  return (
                    <div
                      key={item.label}
                      className="border border-slate-100 rounded-2xl p-3 text-center bg-slate-50/50"
                    >
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                        {item.label}
                      </span>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {count}
                      </p>
                      <span className="text-[9px] text-slate-400 block mt-0.5">
                        Stage {index + 1}
                      </span>
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
                    <p className="text-sm text-slate-500 font-semibold">
                      No predictive low-stock warnings triggered.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {lowStockItems.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between border rounded-2xl p-4 hover:bg-slate-50 transition"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {item.itemType}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {item.tShirtType
                              ? `${item.tShirtType} — ${item.color} (${item.size})`
                              : `Attributes: ${item.color || "None"}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black">
                            {item.quantity} units left
                          </span>
                          <p className="text-[9px] text-slate-400 mt-1">
                            Min threshold: {item.minThreshold}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending Employee Designs */}
              <div className="bg-white border rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-purple-500" />
                    Designs Awaiting Approval ({pendingDrafts.length})
                  </h3>
                  {pendingDrafts.length > 0 && (
                    <button
                      onClick={() => setActiveTab("products")}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition"
                    >
                      <span>Manage All in Products</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {pendingDrafts.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="text-sm text-slate-700 font-bold">
                      All Submissions Reviewed
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      All employee design submissions are approved & active.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                    {pendingDrafts.map((draft) => (
                      <div
                        key={draft._id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between border border-slate-200/90 rounded-2xl p-4 hover:border-purple-200 hover:bg-purple-50/20 transition gap-3"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 shrink-0 relative rounded-xl overflow-hidden shadow-2xs border border-slate-200 bg-slate-50">
                            <Store3DCardPreview
                              product={draft}
                              activeColor={draft.colors?.[0] || "#ffffff"}
                              showControls={false}
                              hideBadge={true}
                              className="!h-16 !w-16 !rounded-xl !p-0"
                              onClick={() => {
                                setSelectedSubmissionProduct(draft);
                                setSubmissionSide("front");
                                setSubmissionZoom(0.85);
                              }}
                            />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {draft.title}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {draft.category} — Rs.{" "}
                              {(draft.basePrice || 0).toFixed(2)}
                            </p>
                            {draft.createdBy && (
                              <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1">
                                <User className="h-3 w-3 text-purple-500" /> By {draft.createdBy.name || "Employee"}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
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
                            disabled={approvingProductId === draft._id}
                            onClick={() =>
                              handleApproveProductDraft(draft._id, "approve")
                            }
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            title="Approve & Publish"
                          >
                            {approvingProductId === draft._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            )}
                            <span>Approve</span>
                          </button>
                          <button
                            disabled={approvingProductId === draft._id}
                            onClick={() =>
                              handleApproveProductDraft(draft._id, "reject")
                            }
                            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                            title="Disapprove / Reject"
                          >
                            {approvingProductId === draft._id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <X className="h-3.5 w-3.5 stroke-[2.5]" />
                            )}
                            <span>Disapprove</span>
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
        {activeTab === "orders" && (() => {
          const orderCounts = {
            all: orders.length,
            active: orders.filter(isActiveOrder).length,
            progress: orders.filter(isProgressOrder).length,
            printing: orders.filter(isPrintingOrder).length,
            completed: orders.filter(isCompletedOrder).length,
            shipped: orders.filter(isShippedOrder).length,
            delivered: orders.filter(isDeliveredOrder).length,
            cancelled: orders.filter(isCancelledOrder).length,
          };

          const filteredOrders = orders.filter((order) => {
            if (orderTabFilter === "active" && !isActiveOrder(order)) return false;
            if (orderTabFilter === "progress" && !isProgressOrder(order)) return false;
            if (orderTabFilter === "printing" && !isPrintingOrder(order)) return false;
            if (orderTabFilter === "completed" && !isCompletedOrder(order)) return false;
            if (orderTabFilter === "shipped" && !isShippedOrder(order)) return false;
            if (orderTabFilter === "delivered" && !isDeliveredOrder(order)) return false;
            if (orderTabFilter === "cancelled" && !isCancelledOrder(order)) return false;

            return true;
          });

          return (
            <div className="bg-white border rounded-3xl p-6 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-indigo-600" />
                    Customer Orders & Production Pipeline
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Filter by active (unassigned), progress orders, printing orders, completed orders, shipped orders, delivered orders, or cancelled orders. Assign staff and manage production workflow.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    {orders.length} Total Orders
                  </span>
                </div>
              </div>

              {/* Status Filter Tabs - Well Aligned Grid */}
              <div className="pt-2 border-t border-slate-100">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                  {[
                    { id: "all", label: "All Orders", count: orderCounts.all },
                    { id: "active", label: "Active", count: orderCounts.active },
                    { id: "progress", label: "Progress Orders", count: orderCounts.progress },
                    { id: "printing", label: "Printing Orders", count: orderCounts.printing },
                    { id: "completed", label: "Completed Orders", count: orderCounts.completed },
                    { id: "shipped", label: "Shipped Orders", count: orderCounts.shipped },
                    { id: "delivered", label: "Delivered Orders", count: orderCounts.delivered },
                    { id: "cancelled", label: "Cancelled Orders", count: orderCounts.cancelled },
                  ].map((tab) => {
                    const isActive = orderTabFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setOrderTabFilter(tab.id)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-1.5 cursor-pointer w-full text-left ${
                          isActive
                            ? "bg-slate-950 text-white shadow-xs"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                        }`}
                      >
                        <span className="truncate">{tab.label}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-white text-slate-700 border border-slate-200"
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Order List / Empty States */}
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Package className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-600 font-bold">No customer orders found in the database.</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-14 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 space-y-3">
                  <Filter className="h-9 w-9 text-slate-300 mx-auto" />
                  <div>
                    <p className="text-sm text-slate-700 font-bold">No orders match the selected filter.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try switching to another filter tab.
                    </p>
                  </div>
                  <button
                    onClick={() => setOrderTabFilter("all")}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                  >
                    Show All Orders
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const pipelineStages = ["Processing", "Printing", "Completed", "Shipped"];
                    const currentStageIdx = pipelineStages.indexOf(order.orderStatus);
                    const isCancelled = isCancelledOrder(order);
                    const isPendingPayment = isPendingPaymentOrder(order);
                    const isDelivered = isDeliveredOrder(order);
                    const latestTimeline = order.timeline && order.timeline.length > 0 ? order.timeline[order.timeline.length - 1] : null;

                    return (
                      <div
                        key={order._id}
                        className="border border-slate-200/90 rounded-2xl p-4 hover:border-indigo-200 transition bg-white shadow-xs space-y-3"
                      >
                        {/* Compact Order Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-xs font-black text-slate-900">
                              Order <span className="font-mono text-indigo-600 font-bold">#{order._id.slice(-8)}</span>
                            </span>

                            {/* Payment Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                                order.paymentStatus === "Paid"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {order.paymentStatus || "Pending"}
                            </span>

                            {/* Order Status Badge */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase flex items-center gap-1 ${
                                isCancelled
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : isDelivered
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                    : isPendingPayment
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : order.orderStatus === "Completed" || order.orderStatus === "Shipped"
                                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                                        : order.orderStatus === "Printing"
                                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                                          : order.orderStatus === "Processing"
                                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                            : "bg-slate-100 text-slate-700 border border-slate-200"
                              }`}
                            >
                              {isDelivered && <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                              {isCancelled && <Ban className="h-3 w-3 text-rose-500" />}
                              <span>{isDelivered ? "Delivered (Collected)" : order.orderStatus}</span>
                            </span>

                            <span className="text-slate-300">|</span>
                            <span className="text-xs text-slate-600 font-medium">
                              <span className="font-bold text-slate-900">
                                {order.customerId?.name ||
                                  (typeof order.customerId === "object" && order.customerId?.email) ||
                                  order.guestEmail ||
                                  "Customer"}
                              </span>
                              {order.customerId?.name && (order.customerId?.email || order.guestEmail) ? (
                                <span className="text-slate-400 font-normal ml-1">
                                  ({order.customerId?.email || order.guestEmail})
                                </span>
                              ) : null}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(order.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-base font-black text-slate-950">
                              Rs. {(order.totalCost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Main Section: Compact Sidebar Meta Info + Wide 3D Views & Items */}
                        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-3 items-start">
                          {/* Left Sidebar: Shipping & Assigned Employee */}
                          <div className="space-y-2.5">
                            {/* Shipping Destination */}
                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 space-y-1">
                              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                                Shipping Destination
                              </span>
                              {order.shippingAddress ? (
                                <p className="text-xs text-slate-700 font-medium leading-tight">
                                  {order.shippingAddress.street ? `${order.shippingAddress.street}, ` : ""}
                                  {order.shippingAddress.city ? `${order.shippingAddress.city}, ` : ""}
                                  {order.shippingAddress.country || "Sri Lanka"}
                                </p>
                              ) : (
                                <p className="text-xs text-slate-400 italic">Address not specified</p>
                              )}
                            </div>

                            {/* Employee Assignment */}
                            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-2.5 space-y-1.5">
                              <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">
                                Assigned Operator
                              </span>
                              {order.assignedEmployee && editingEmployeeOrderId !== order._id ? (
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                                      {order.assignedEmployee.name ? order.assignedEmployee.name.charAt(0).toUpperCase() : "E"}
                                    </div>
                                    <span className="text-xs font-bold text-slate-900 truncate">
                                      {order.assignedEmployee.name}
                                    </span>
                                  </div>

                                  {!isCancelled && !isDelivered && order.orderStatus !== "Shipped" && (
                                    <button
                                      onClick={() => {
                                        setEditingEmployeeOrderId(order._id);
                                        setSelectedEmployeeForOrder((prev) => ({
                                          ...prev,
                                          [order._id]: order.assignedEmployee?._id || "",
                                        }));
                                      }}
                                      className="px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition flex items-center gap-1 shrink-0 cursor-pointer bg-white"
                                      title="Edit assigned employee"
                                    >
                                      <Edit2 className="h-2.5 w-2.5 text-indigo-600" />
                                      <span>Edit</span>
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  {editingEmployeeOrderId === order._id ? (
                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-1">
                                        <select
                                          value={selectedEmployeeForOrder[order._id] || order.assignedEmployee?._id || ""}
                                          onChange={(e) =>
                                            setSelectedEmployeeForOrder((prev) => ({
                                              ...prev,
                                              [order._id]: e.target.value,
                                            }))
                                          }
                                          className="flex-1 text-[11px] border border-slate-300 rounded-lg px-2 py-1 bg-white font-medium focus:outline-none focus:border-indigo-500"
                                        >
                                          <option value="">-- Select Employee --</option>
                                          {employees.map((emp) => (
                                            <option key={emp._id} value={emp._id}>
                                              {emp.name}
                                            </option>
                                          ))}
                                        </select>
                                        <button
                                          disabled={assignLoading[order._id] || !selectedEmployeeForOrder[order._id]}
                                          onClick={() => {
                                            const empId = selectedEmployeeForOrder[order._id];
                                            if (empId) {
                                              handleAssignEmployee(order._id, empId);
                                            }
                                          }}
                                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                        >
                                          {assignLoading[order._id] ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                          ) : (
                                            <Check className="h-3 w-3" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => setEditingEmployeeOrderId(null)}
                                          className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <select
                                        disabled={assignLoading[order._id] || isCancelled || isDelivered}
                                        onChange={(e) => handleAssignEmployee(order._id, e.target.value)}
                                        defaultValue=""
                                        className="w-full text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white font-medium text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-50"
                                      >
                                        <option value="" disabled>
                                          -- Assign staff --
                                        </option>
                                        {employees.map((emp) => (
                                          <option key={emp._id} value={emp._id}>
                                            {emp.name}
                                          </option>
                                        ))}
                                      </select>
                                      {!order.assignedEmployee && !isCancelled && !isDelivered && (
                                        <p className="text-[9px] text-amber-600 font-semibold flex items-center gap-1">
                                          <AlertCircle className="h-2.5 w-2.5 shrink-0" />
                                          No staff assigned
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right Area: Items List with Small 3D Views */}
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="bg-white p-2.5 border border-slate-200/90 rounded-xl space-y-2"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-100 pb-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-slate-900 text-xs">
                                      {item.tShirtStyle || (item.itemType ? `${item.itemType} T-shirt` : "T-Shirt")} (x{item.quantity})
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      Size: <span className="font-bold text-slate-800">{item.selectedSize || item.size}</span> |
                                      Color: <span className="font-bold text-slate-800">{resolveColorName(item.selectedColor || item.color)}</span> |
                                      GSM: <span className="font-bold text-slate-800">{formatGsm(item.gsm || item.material || "GSM 180")}</span>
                                    </span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${item.itemType === "Customized" || item.designId
                                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                    }`}>
                                    {item.itemType === "Customized" || item.designId ? "Custom Print" : "Catalog"}
                                  </span>
                                </div>

                                {/* Multi-Angle 3D View Small Thumbnails */}
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

                        {/* Compact Bottom Footer: Status Stepper & Cancel Action */}
                        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                              Status:
                            </span>

                            {isCancelled ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-[11px] font-bold">
                                <Ban className="h-3 w-3 text-rose-500 shrink-0" />
                                Order Cancelled
                              </span>
                            ) : isDelivered ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-[11px] font-bold">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <span>Order Delivered & Collected by Customer</span>
                                {order.collectedAt && (
                                  <span className="text-[10px] font-normal text-emerald-600 ml-1">
                                    ({new Date(order.collectedAt).toLocaleDateString()})
                                  </span>
                                )}
                              </span>
                            ) : isPendingPayment ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-[11px] font-bold">
                                <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                                Awaiting Customer Payment
                              </span>
                            ) : (
                              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                                {pipelineStages.map((stage, sIdx) => {
                                  const isPassed = currentStageIdx > sIdx;
                                  const isCurrent = currentStageIdx === sIdx;

                                  return (
                                    <div key={stage} className="flex items-center shrink-0">
                                      <div
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition ${isCurrent
                                          ? "bg-indigo-600 text-white shadow-2xs font-black"
                                          : isPassed
                                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            : "bg-slate-100 text-slate-400 border border-slate-200"
                                          }`}
                                      >
                                        {isPassed ? (
                                          <Check className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                                        ) : isCurrent ? (
                                          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping shrink-0" />
                                        ) : (
                                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 shrink-0" />
                                        )}
                                        <span>{stage}</span>
                                      </div>
                                      {sIdx < pipelineStages.length - 1 && (
                                        <div
                                          className={`w-2 h-0.5 mx-0.5 transition ${isPassed ? "bg-emerald-400" : "bg-slate-200"
                                            }`}
                                        />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {latestTimeline?.note && (
                              <span className="text-[10px] text-slate-400 italic truncate max-w-xs">
                                ({latestTimeline.note})
                              </span>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="shrink-0">
                            {!isCancelled && !isDelivered && order.orderStatus !== "Shipped" ? (
                              <button
                                disabled={assignLoading[order._id]}
                                onClick={() => openCancelOrderModal(order)}
                                className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 rounded-lg text-[10px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                title="Cancel this order"
                              >
                                {assignLoading[order._id] ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Ban className="h-3 w-3" />
                                )}
                                <span>Cancel</span>
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {/* ================= TAB 3: PRODUCT CATALOG & SUBMISSIONS ================= */}
        {activeTab === "products" && (
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white border rounded-3xl p-6 shadow-sm">
              <div>
                <h3 className="text-xl font-black text-slate-950 flex items-center gap-2.5">
                  <Layers className="h-6 w-6 text-indigo-600" />
                  Products & Design Submissions
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Review employee design submissions, approve or disapprove designs, and manage the live product catalog.
                </p>
              </div>
            </div>

            {/* SECTION 1: EMPLOYEE SUBMISSIONS & PENDING APPROVALS SHOWCASE */}
            <div className="bg-white border rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-black text-slate-900">
                        Employee Design Submissions
                      </h4>
                      {pendingDrafts.length > 0 ? (
                        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 font-black text-xs rounded-full animate-pulse">
                          {pendingDrafts.length} Pending Review
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> All Reviewed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Designs created by staff members that require manager approval before being published to the store.
                    </p>
                  </div>
                </div>
              </div>

              {pendingDrafts.length === 0 ? (
                <div className="text-center py-10 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-8">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 border border-emerald-100">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">
                    All Employee Submissions Reviewed
                  </p>
                  <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                    There are currently no staff design concepts waiting for your approval. New submissions will appear here automatically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {pendingDrafts.map((draft) => (
                    <div
                      key={draft._id}
                      className="border border-slate-200/90 hover:border-purple-300 rounded-2xl p-5 bg-white shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 group"
                    >
                      {/* Top info */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[10px] font-black uppercase tracking-wider">
                            {draft.category || "T-Shirts"}
                          </span>
                          <span className="text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Rs. {(draft.basePrice || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* 3D Frozen T-Shirt Card Preview like in Store */}
                        <div className="relative rounded-2xl overflow-hidden shadow-xs border border-slate-100">
                          <Store3DCardPreview
                            product={draft}
                            activeColor={draft.colors?.[0] || "#ffffff"}
                            onClick={() => {
                              setSelectedSubmissionProduct(draft);
                              setSubmissionSide("front");
                              setSubmissionZoom(0.85);
                            }}
                          />
                        </div>

                        {/* Details */}
                        <div>
                          <h5 className="font-bold text-slate-900 text-sm line-clamp-1">
                            {draft.title}
                          </h5>
                          {draft.description && (
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                              {draft.description}
                            </p>
                          )}
                          <div className="flex items-center flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-slate-100">
                            {draft.createdBy && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                                <User className="h-3 w-3" />
                                {draft.createdBy.name || "Employee"}
                              </span>
                            )}
                            {draft.sizes && draft.sizes.length > 0 && (
                              <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-md">
                                Sizes: {draft.sizes.join(", ")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* CLEAR APPROVE & DISAPPROVE BUTTONS */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <button
                          disabled={approvingProductId === draft._id}
                          onClick={() =>
                            handleApproveProductDraft(draft._id, "approve")
                          }
                          className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          title="Approve submission and publish to live store"
                        >
                          {approvingProductId === draft._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 stroke-[2.5]" />
                          )}
                          <span>Approve & Publish</span>
                        </button>
                        <button
                          disabled={approvingProductId === draft._id}
                          onClick={() =>
                            handleApproveProductDraft(draft._id, "reject")
                          }
                          className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                          title="Disapprove / Reject submission"
                        >
                          {approvingProductId === draft._id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4 stroke-[2.5]" />
                          )}
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: COMPLETE CATALOG & SUBMISSIONS TABLE */}
            <div className="bg-white border rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                    <Package className="h-5 w-5 text-indigo-600" />
                    Live Products & Submissions Directory
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Filter by status, search items, and perform instant approvals or edits.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
                  <button
                    onClick={() => setProductTabFilter("all")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${productTabFilter === "all"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    All ({products.length})
                  </button>
                  <button
                    onClick={() => setProductTabFilter("pending")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${productTabFilter === "pending"
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    <span>Pending</span>
                    {pendingDrafts.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-purple-200 text-purple-900 rounded-full text-[10px] font-black">
                        {pendingDrafts.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setProductTabFilter("approved")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${productTabFilter === "approved"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Approved ({products.filter((p) => p.isApproved).length})
                  </button>
                  <button
                    onClick={() => setProductTabFilter("archived")}
                    className={`px-3 py-1.5 rounded-xl font-bold transition ${productTabFilter === "archived"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                      }`}
                  >
                    Disapproved ({products.filter((p) => p.status === "Archived" || (!p.isApproved && p.status !== "Draft")).length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by title, category, or creator name..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                />
              </div>

              {/* Filtered Products Table */}
              {(() => {
                const filteredProducts = products.filter((p) => {
                  if (productTabFilter === "pending") {
                    if (p.isApproved || p.status === "Archived") return false;
                  } else if (productTabFilter === "approved") {
                    if (!p.isApproved) return false;
                  } else if (productTabFilter === "archived") {
                    if (p.status !== "Archived" && (p.isApproved || p.status === "Draft")) return false;
                  }

                  if (productSearchQuery.trim()) {
                    const q = productSearchQuery.toLowerCase();
                    const matchTitle = (p.title || "").toLowerCase().includes(q);
                    const matchCat = (p.category || "").toLowerCase().includes(q);
                    const matchCreator = (p.createdBy?.name || "").toLowerCase().includes(q);
                    if (!matchTitle && !matchCat && !matchCreator) return false;
                  }

                  return true;
                });

                if (filteredProducts.length === 0) {
                  return (
                    <div className="text-center py-16">
                      <p className="text-sm text-slate-500 font-semibold">
                        No products match the selected criteria.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                          <th className="pb-3">Product / Design</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Price</th>
                          <th className="pb-3">Discount</th>
                          <th className="pb-3">Sizes & GSM</th>
                          <th className="pb-3">Approval Status</th>
                          <th className="pb-3 text-right">Review & Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((p) => {
                          const isPending = !p.isApproved && p.status !== "Archived";
                          const isDisapproved = p.status === "Archived";
                          const isApproved = p.isApproved;

                          return (
                            <tr
                              key={p._id}
                              className="border-b last:border-b-0 hover:bg-slate-50/70 transition"
                            >
                              <td className="py-4 font-bold text-slate-900">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 shrink-0 relative rounded-xl overflow-hidden shadow-2xs border border-slate-200 bg-slate-50">
                                    <Store3DCardPreview
                                      product={p}
                                      activeColor={p.colors?.[0] || "#ffffff"}
                                      showControls={false}
                                      hideBadge={true}
                                      className="!h-12 !w-12 !rounded-xl !p-0"
                                      onClick={() => {
                                        setSelectedSubmissionProduct(p);
                                        setSubmissionSide("front");
                                        setSubmissionZoom(0.85);
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <p className="text-sm">{p.title}</p>
                                    {p.createdBy && (
                                      <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full mt-0.5 inline-flex items-center gap-1">
                                        <User className="h-3 w-3" /> By {p.createdBy.name || "Employee"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 text-xs text-slate-600 font-medium">
                                {p.category}
                              </td>
                              <td className="py-4 text-xs font-black text-slate-900">
                                Rs. {(p.basePrice || 0).toFixed(2)}
                              </td>
                              <td className="py-4 text-xs">
                                {p.discount > 0 ? (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full font-bold">
                                    {p.discount}% Off
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-4 text-xs text-slate-500">
                                <div className="space-y-0.5">
                                  <p className="font-semibold text-slate-700">{(p.sizes || []).join(", ") || "All Sizes"}</p>
                                  <p className="text-[11px] text-slate-400">
                                    {(() => {
                                      if (p.gsms && p.gsms.length > 0) {
                                        return p.gsms.join(", ");
                                      }
                                      const matchedStyle = styles.find((s) => s.path === p.modelPath);
                                      if (matchedStyle) {
                                        if (matchedStyle.gsmPrices && matchedStyle.gsmPrices.length > 0) {
                                          return matchedStyle.gsmPrices.map((gp) => gp.gsm).join(", ");
                                        }
                                        if (matchedStyle.gsms && matchedStyle.gsms.length > 0) {
                                          return matchedStyle.gsms.join(", ");
                                        }
                                      }
                                      return "GSM 180";
                                    })()}
                                  </p>
                                </div>
                              </td>
                              <td className="py-4 text-xs">
                                {isApproved ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Approved & Live
                                  </span>
                                ) : isPending ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-[11px] font-bold animate-pulse">
                                    <Clock className="h-3.5 w-3.5" /> Pending Review
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-[11px] font-bold">
                                    <Ban className="h-3.5 w-3.5" /> Disapproved
                                  </span>
                                )}
                              </td>
                              <td className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* CLEAR APPROVE & DISAPPROVE BUTTONS IN TABLE */}
                                  {!isApproved && (
                                    <button
                                      disabled={approvingProductId === p._id}
                                      onClick={() => handleApproveProductDraft(p._id, "approve")}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="Approve & Publish to Store"
                                    >
                                      {approvingProductId === p._id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                                      )}
                                      <span>Approve</span>
                                    </button>
                                  )}

                                  {isApproved ? (
                                    <button
                                      disabled={approvingProductId === p._id}
                                      onClick={() => handleApproveProductDraft(p._id, "reject")}
                                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="Revoke Approval / Disapprove"
                                    >
                                      {approvingProductId === p._id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <X className="h-3.5 w-3.5 stroke-[2]" />
                                      )}
                                      <span>Disapprove</span>
                                    </button>
                                  ) : !isDisapproved ? (
                                    <button
                                      disabled={approvingProductId === p._id}
                                      onClick={() => handleApproveProductDraft(p._id, "reject")}
                                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                      title="Disapprove / Reject"
                                    >
                                      {approvingProductId === p._id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <X className="h-3.5 w-3.5 stroke-[2.5]" />
                                      )}
                                      <span>Disapprove</span>
                                    </button>
                                  ) : null}

                                  {/* 3D Preview */}
                                  <button
                                    onClick={() => {
                                      setSelectedSubmissionProduct(p);
                                      setSubmissionSide("front");
                                      setSubmissionZoom(0.85);
                                    }}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition"
                                    title="Inspect in 3D"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                  </button>

                                  {/* Edit */}
                                  <button
                                    onClick={() => openEditProduct(p)}
                                    className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-600"
                                    title="Edit Product Details"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => handleDeleteProduct(p._id)}
                                    className="p-1.5 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                    title="Delete Product"
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

            {/* Product Create/Edit Modal */}
            {showProductModal && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md border shadow-2xl overflow-hidden">
                  <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                        {editingProduct
                          ? "Edit Product Details"
                          : "Create New Store Product"}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Manager Catalog Administration
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowProductModal(false);
                        setEditingProduct(null);
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  <form
                    onSubmit={handleSaveProduct}
                    className="p-5 space-y-4 max-h-[75vh] overflow-y-auto"
                  >
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
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Product Title
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.title}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        placeholder="e.g. Classic Organic T-shirt"
                        className="w-full px-3 py-2 border rounded-xl text-sm"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Description
                      </label>
                      <textarea
                        required
                        value={productForm.description}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Explain item features..."
                        className="w-full px-3 py-2 border rounded-xl text-sm h-16"
                      />
                    </div>



                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Base Price (Rs.)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={productForm.basePrice}
                          onChange={(e) =>
                            setProductForm((prev) => ({
                              ...prev,
                              basePrice: parseFloat(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-3 py-2 border rounded-xl text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          max="100"
                          min="0"
                          value={productForm.discount}
                          onChange={(e) =>
                            setProductForm((prev) => ({
                              ...prev,
                              discount: parseInt(e.target.value) || 0,
                            }))
                          }
                          className="w-full px-3 py-2 border rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Status
                        </label>
                        <select
                          value={productForm.status}
                          onChange={(e) =>
                            setProductForm((prev) => ({
                              ...prev,
                              status: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border rounded-xl text-sm"
                        >
                          <option value="Active">Active</option>
                          <option value="Draft">Draft</option>
                          <option value="Archived">Archived</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          T shirt Style
                        </label>
                        <select
                          value={productForm.modelPath}
                          onChange={(e) => {
                            const selectedPath = e.target.value;
                            const matchedStyle = styles.find((s) => s.path === selectedPath);

                            // Extract GSMs for matched style
                            let styleGsms = [];
                            if (matchedStyle) {
                              if (matchedStyle.gsmPrices && matchedStyle.gsmPrices.length > 0) {
                                styleGsms = matchedStyle.gsmPrices.map((gp) => formatGsm(gp.gsm));
                              } else if (matchedStyle.gsms && matchedStyle.gsms.length > 0) {
                                styleGsms = matchedStyle.gsms.map(formatGsm);
                              }
                            }
                            if (styleGsms.length === 0) {
                              styleGsms = ["GSM 180", "GSM 200", "GSM 220", "GSM 240"];
                            }

                            // Extract Colors for matched style
                            let styleColors = [];
                            if (matchedStyle && matchedStyle.colors && matchedStyle.colors.length > 0) {
                              styleColors = matchedStyle.colors.map((c) => (typeof c === "string" ? c : c.value));
                            }
                            if (styleColors.length === 0) {
                              styleColors = ["#ffffff"];
                            }

                            setProductForm((prev) => ({
                              ...prev,
                              modelPath: selectedPath,
                              category: matchedStyle ? (matchedStyle.name || matchedStyle.type || prev.category) : prev.category,
                              gsms: styleGsms,
                              colors: styleColors,
                              defaultColor: styleColors[0] || "#ffffff",
                            }));
                          }}
                          className="w-full px-3 py-2 border rounded-xl text-sm font-semibold bg-white"
                        >
                          {styles && styles.length > 0 ? (
                            styles.map((st) => (
                              <option key={st._id || st.path} value={st.path}>
                                {st.name || st.type} ({st.type})
                              </option>
                            ))
                          ) : (
                            <>
                              <option value="/images/models/male normal t-shirt1.glb">
                                Men's T-Shirt (Crew Neck)
                              </option>
                              <option value="/images/models/female normal t-shirt.glb">
                                Women's T-Shirt (V-Neck)
                              </option>
                              <option value="/images/models/long_sleeve_t-_shirt.glb">
                                Long Sleeve Shirt (Crew Neck)
                              </option>
                              <option value="/images/models/oversized t-sdirt1.glb">
                                Oversized T-Shirt (Crew Neck)
                              </option>
                              <option value="/images/models/t_shirt_hoodie.glb">
                                Hoodie (Polo)
                              </option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>

                    {/* Available Sizes Checkboxes */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                        <span>Available Sizes</span>
                        <span className="text-[9px] text-indigo-600 font-normal">
                          Selected: {(productForm.sizes || []).join(", ") || "None"}
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {["S", "M", "L", "XL", "XXL"].map((size) => {
                          const isSelected = (productForm.sizes || []).includes(size);
                          return (
                            <label
                              key={size}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${isSelected
                                ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs"
                                : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setProductForm((prev) => {
                                    const currentSizes = prev.sizes || [];
                                    const updatedSizes = checked
                                      ? [...currentSizes, size]
                                      : currentSizes.filter((s) => s !== size);
                                    return { ...prev, sizes: updatedSizes };
                                  });
                                }}
                                className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span>{size}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Available GSM Values Checkboxes (Filtered by selected T-shirt Style) */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                        <span>Available GSM Values (from T shirt Style)</span>
                        <span className="text-[9px] text-indigo-600 font-normal">
                          Selected: {(productForm.gsms || []).join(", ") || "None"}
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {(() => {
                          const matchedStyle = styles.find((s) => s.path === productForm.modelPath);
                          let availableGsms = [];
                          if (matchedStyle) {
                            if (matchedStyle.gsmPrices && matchedStyle.gsmPrices.length > 0) {
                              availableGsms = matchedStyle.gsmPrices.map((gp) => formatGsm(gp.gsm));
                            } else if (matchedStyle.gsms && matchedStyle.gsms.length > 0) {
                              availableGsms = matchedStyle.gsms.map(formatGsm);
                            }
                          }
                          if (availableGsms.length === 0) {
                            availableGsms = ["GSM 180", "GSM 200", "GSM 220", "GSM 240", "GSM 280", "GSM 320"];
                          }

                          return availableGsms.map((gsm) => {
                            const isSelected = (productForm.gsms || []).includes(gsm);
                            return (
                              <label
                                key={gsm}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${isSelected
                                  ? "bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs"
                                  : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                                  }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    setProductForm((prev) => {
                                      const currentGsms = prev.gsms || [];
                                      const updatedGsms = checked
                                        ? [...currentGsms, gsm]
                                        : currentGsms.filter((g) => g !== gsm);
                                      return { ...prev, gsms: updatedGsms };
                                    });
                                  }}
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span>{gsm}</span>
                              </label>
                            );
                          });
                        })()}
                      </div>

                    </div>

                    {/* Available Colors Selection (from selected T shirt Style) */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                        <span>Select Product Colors (from T shirt Style)</span>
                        <span className="text-[9px] text-indigo-600 font-normal">
                          Selected: {(productForm.colors || []).length} colors
                        </span>
                      </label>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {(() => {
                          const matchedStyle = styles.find((s) => s.path === productForm.modelPath);
                          let availableStyleColors = matchedStyle && matchedStyle.colors && matchedStyle.colors.length > 0
                            ? matchedStyle.colors
                            : [
                              { name: "White", value: "#ffffff" },
                              { name: "Black", value: "#111827" },
                              { name: "Navy Blue", value: "#1e3a8a" },
                              { name: "Red", value: "#dc2626" },
                            ];

                          return availableStyleColors.map((cObj) => {
                            const hexVal = typeof cObj === "string" ? cObj : cObj.value;
                            const nameVal = typeof cObj === "string" ? cObj : cObj.name;
                            const isSelected = (productForm.colors || []).some(
                              (c) => c.toLowerCase() === hexVal.toLowerCase()
                            );

                            return (
                              <button
                                key={hexVal}
                                type="button"
                                onClick={() => {
                                  setProductForm((prev) => {
                                    const currentColors = prev.colors || [];
                                    let updatedColors;
                                    if (isSelected) {
                                      updatedColors = currentColors.filter(
                                        (c) => c.toLowerCase() !== hexVal.toLowerCase()
                                      );
                                      if (updatedColors.length === 0) updatedColors = [hexVal];
                                    } else {
                                      updatedColors = [...currentColors, hexVal];
                                    }
                                    return {
                                      ...prev,
                                      colors: updatedColors,
                                      defaultColor: updatedColors[0] || "#ffffff",
                                    };
                                  });
                                }}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${isSelected
                                  ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                                  }`}
                              >
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0"
                                  style={{ backgroundColor: hexVal }}
                                />
                                <span>{nameVal}</span>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Default Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={productForm.defaultColor}
                            onChange={(e) =>
                              setProductForm((prev) => ({
                                ...prev,
                                defaultColor: e.target.value,
                                colors: [e.target.value],
                              }))
                            }
                            className="h-8 w-10 border rounded-lg p-0 bg-transparent cursor-pointer shrink-0"
                          />
                          <input
                            type="text"
                            value={productForm.defaultColor}
                            onChange={(e) =>
                              setProductForm((prev) => ({
                                ...prev,
                                defaultColor: e.target.value,
                                colors: [e.target.value],
                              }))
                            }
                            className="w-full px-3 py-1.5 border rounded-xl text-xs"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                          Product Image (Mockup)
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProductImageUpload}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        Or Image URL
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. /images/dumyImage.png or Base64 string..."
                        value={productForm.images?.[0] || ""}
                        onChange={(e) =>
                          setProductForm((prev) => ({
                            ...prev,
                            images: [e.target.value],
                          }))
                        }
                        className="w-full px-3 py-2 border rounded-xl text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProductModal(false);
                          setEditingProduct(null);
                        }}
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
          <div className="bg-white border rounded-3xl p-6 sm:p-8 shadow-sm max-w-3xl space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-5">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Configure Cost Parameters & Estimation Rules
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Set printing cost per unit area and volume discounts for customer price estimations.
                </p>
              </div>
              <span className="self-start sm:self-auto text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full">
                Currency: LKR (Rs.)
              </span>
            </div>

            {pricingSuccess && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-600 shrink-0" />
                <span>Pricing parameters updated successfully!</span>
              </div>
            )}
            {pricingError && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
                <span>{pricingError}</span>
              </div>
            )}

            <form onSubmit={handleSavePricingRules} className="space-y-6">
              {/* Field 1: Printing Cost per Sq. Inch */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    1. Printing Cost per Square Inch
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Unit: <strong>Rs. / sq. inch</strong>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-xs">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    className="w-full pl-10 pr-24 py-2.5 border rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={pricingForm.costPerSqIn}
                    onChange={(e) =>
                      setPricingForm((prev) => ({
                        ...prev,
                        costPerSqIn: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 font-medium text-xs">
                    / sq. inch
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  💡 <strong>How it works:</strong> A standard 8" × 10" graphic is 80 sq. inches. At Rs. {(Number(pricingForm.costPerSqIn) || 0).toFixed(3)}/sq.in, it adds <strong>Rs. {(80 * (Number(pricingForm.costPerSqIn) || 0)).toFixed(2)}</strong> for printing.
                </p>
              </div>

              {/* Field 2: Design Complexity Fee */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    2. Complexity Fee per Extra Layer
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Unit: <strong>Rs. / layer</strong>
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-xs">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full pl-10 pr-28 py-2.5 border rounded-xl text-sm font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    value={pricingForm.complexityFeePerLayer}
                    onChange={(e) =>
                      setPricingForm((prev) => ({
                        ...prev,
                        complexityFeePerLayer: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 font-medium text-xs">
                    / extra layer
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  The 1st base artwork layer is free. This fee applies to additional graphic/text layers.
                </p>
              </div>

              {/* Field 3: Bulk Order Volume Discount */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                  3. Bulk Order Volume Discount
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Minimum Pieces Threshold
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold text-slate-900 pr-16 focus:border-indigo-500"
                        value={pricingForm.volumeDiscount?.thresholdQty}
                        onChange={(e) =>
                          setPricingForm((prev) => ({
                            ...prev,
                            volumeDiscount: {
                              ...prev.volumeDiscount,
                              thresholdQty: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 font-medium text-xs">
                        Pieces
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      Discount Percentage
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className="w-full px-3.5 py-2.5 border rounded-xl text-sm font-bold text-slate-900 pr-10 focus:border-indigo-500"
                        value={pricingForm.volumeDiscount?.discountPercentage}
                        onChange={(e) =>
                          setPricingForm((prev) => ({
                            ...prev,
                            volumeDiscount: {
                              ...prev.volumeDiscount,
                              discountPercentage: parseInt(e.target.value) || 0,
                            },
                          }))
                        }
                      />
                      <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 font-bold text-xs">
                        %
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                  💡 Orders of <strong>{pricingForm.volumeDiscount?.thresholdQty || 5} or more pieces</strong> will automatically receive a <strong>{pricingForm.volumeDiscount?.discountPercentage || 0}% discount</strong> on their total order.
                </p>
              </div>

              {/* Interactive Quick Price Calculation Example */}
              <div className="bg-gradient-to-r from-indigo-50/90 to-slate-50 border border-indigo-100 rounded-2xl p-4.5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Calculator className="h-4 w-4 text-indigo-600" />
                    Quick Price Calculation Example
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 px-2 py-0.5 rounded-md">
                    Print Area & Complexity Cost Only
                  </span>
                </div>

                {/* Interactive Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Print Width (Inches)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      className="w-full px-3 py-1.5 border rounded-xl text-xs font-bold text-slate-900 bg-white focus:border-indigo-500"
                      value={calcWidth}
                      onChange={(e) => setCalcWidth(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Print Height (Inches)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      className="w-full px-3 py-1.5 border rounded-xl text-xs font-bold text-slate-900 bg-white focus:border-indigo-500"
                      value={calcHeight}
                      onChange={(e) => setCalcHeight(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">
                      Complexity (Extra Layers)
                    </label>
                    <select
                      className="w-full px-3 py-1.5 border rounded-xl text-xs font-bold text-slate-900 bg-white focus:border-indigo-500"
                      value={calcExtraLayers}
                      onChange={(e) => setCalcExtraLayers(parseInt(e.target.value) || 0)}
                    >
                      <option value={0}>0 Extra (1 Base Layer)</option>
                      <option value={1}>1 Extra Layer</option>
                      <option value={2}>2 Extra Layers</option>
                      <option value={3}>3 Extra Layers</option>
                      <option value={4}>4 Extra Layers</option>
                    </select>
                  </div>
                </div>

                {/* Calculation Breakdown Result */}
                <div className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-indigo-100 bg-white/70 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <span>
                      • Print Area ({calcWidth}" × {calcHeight}" = {(Number(calcWidth) * Number(calcHeight)).toFixed(1)} sq.in @ Rs. {(Number(pricingForm.costPerSqIn) || 0).toFixed(3)}/sq.in):
                    </span>
                    <span className="font-semibold text-slate-900">
                      Rs. {((Number(calcWidth) * Number(calcHeight)) * (Number(pricingForm.costPerSqIn) || 0)).toFixed(2)}
                    </span>
                  </div>

                  {Number(calcExtraLayers) > 0 && (
                    <div className="flex justify-between items-center text-purple-700">
                      <span>
                        • Complexity Fee ({calcExtraLayers} extra layer{calcExtraLayers > 1 ? "s" : ""} @ Rs. {(Number(pricingForm.complexityFeePerLayer) || 0).toFixed(2)}/layer):
                      </span>
                      <span className="font-semibold">
                        + Rs. {(Number(calcExtraLayers) * (Number(pricingForm.complexityFeePerLayer) || 0)).toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-1.5 border-t border-slate-200 font-bold text-slate-900">
                    <span>Total Printing & Complexity Cost:</span>
                    <span className="text-indigo-600 font-black text-sm">
                      Rs. {(
                        (Number(calcWidth) * Number(calcHeight) * (Number(pricingForm.costPerSqIn) || 0)) +
                        (Number(calcExtraLayers) * (Number(pricingForm.complexityFeePerLayer) || 0))
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Save Pricing Rules</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= TAB 5: INVENTORY ================= */}
        {activeTab === "inventory" && (
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

            {/* 4 Main Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
              {[
                { id: "ALL", label: "All Stock Items", icon: Layers },
                { id: "TSHIRTS", label: "T-Shirts", icon: Tag },
                { id: "INK", label: "Printing Ink", icon: Layers },
                { id: "PAPERS_PACKAGING", label: "Transfer Papers & Packaging", icon: Package },
              ].map((cat) => {
                const isActive = inventoryCategoryFilter === cat.id;
                let count = inventory.length;
                if (cat.id === "TSHIRTS") {
                  count = inventory.filter(
                    (i) => i.itemType === "Plain T-Shirt" || i.itemType?.toLowerCase().includes("t-shirt")
                  ).length;
                } else if (cat.id === "INK") {
                  count = inventory.filter(
                    (i) => i.itemType === "Printing Ink" || i.itemType?.toLowerCase().includes("ink")
                  ).length;
                } else if (cat.id === "PAPERS_PACKAGING") {
                  count = inventory.filter((i) => {
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

                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setInventoryCategoryFilter(cat.id);
                      setInventorySizeFilter("ALL");
                      setInventoryColorFilter("ALL");
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${isActive
                      ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
                      }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isActive
                        ? "bg-indigo-500 text-white"
                        : "bg-slate-200 text-slate-700"
                        }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
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
                        inventory
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

            {/* Inventory Items Table per Category */}
            {(() => {
              const filteredInventory = inventory.filter((item) => {
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
                  if (!matchName && !matchType && !matchColor && !matchSize && !matchMat) {
                    return false;
                  }
                }

                return true;
              });

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
                        const isLow = item.quantity <= item.minThreshold;
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

                            {/* Common Stock & Restock Controls */}
                            <td className="py-4 text-xs font-bold text-slate-900">
                              {item.quantity} units
                            </td>
                            <td className="py-4 text-xs text-slate-400">
                              {editingThresholdId === item._id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={
                                      thresholdInputs[item._id] ??
                                      item.minThreshold
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
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingThresholdId(null)}
                                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span>{item.minThreshold} units</span>
                                  <button
                                    onClick={() => {
                                      setEditingThresholdId(item._id);
                                      setThresholdInputs((prev) => ({
                                        ...prev,
                                        [item._id]: item.minThreshold,
                                      }));
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 text-[10px] font-bold"
                                  >
                                    Edit
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-4 text-xs">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${isLow
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
                                  className="w-16 px-2 py-1 text-xs border rounded-xl text-center"
                                />
                                <button
                                  onClick={() => handleRestockQuantity(item._id)}
                                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-[10px] font-bold transition"
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
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
                      { gsm: "GSM 180", price: 1200 },
                      { gsm: "GSM 220", price: 1500 },
                    ],
                    colors: [
                      { name: "White", value: "#ffffff" },
                      { name: "Black", value: "#111827" },
                    ],
                    sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
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
              <div className="text-center py-16 bg-white border border-slate-200 rounded-3xl p-8 shadow-xs">
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Layers className="h-6 w-6" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-base mb-1">
                  No T-Shirt styles configured
                </h4>
                <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto mb-4">
                  Add 3D T-Shirt styles with custom 3D model meshes, GSM pricing tiers, and brand color palettes.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStyle(null);
                    setStyleForm({
                      name: "",
                      path: "/images/models/male normal t-shirt1.glb",
                      gsmPrices: [
                        { gsm: "GSM 180", price: 1200 },
                        { gsm: "GSM 220", price: 1500 },
                      ],
                      colors: [
                        { name: "White", value: "#ffffff" },
                        { name: "Black", value: "#111827" },
                      ],
                      sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
                    });
                    setShowStyleModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Add First Style
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {styles.map((style) => (
                  <TShirtStyleCard
                    key={style._id}
                    style={style}
                    onEdit={(styleToEdit) => {
                      setEditingStyle(styleToEdit);
                      setStyleForm({
                        name: styleToEdit.name || styleToEdit.type || "",
                        path: styleToEdit.path || "",
                        gsmPrices:
                          styleToEdit.gsmPrices && styleToEdit.gsmPrices.length > 0
                            ? styleToEdit.gsmPrices
                            : (styleToEdit.gsms || []).map((g) => ({
                              gsm: g,
                              price: styleToEdit.price || 1200,
                            })),
                        colors: styleToEdit.colors || [],
                        sizes:
                          styleToEdit.sizes && styleToEdit.sizes.length > 0
                            ? styleToEdit.sizes
                            : ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
                      });
                      setShowStyleModal(true);
                    }}
                    onDelete={handleDeleteStyle}
                  />
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Current Password
                </label>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  New Password
                </label>
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
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                  Confirm New Password
                </label>
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

        {/* ================= TAB 7: REVIEWS & COMMENT MODERATION ================= */}
        {activeTab === "reviews" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header / Intro */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <MessageSquare className="h-5 w-5" />
                  </span>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Customer Reviews & Bad Comment Moderation
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Inspect user feedback, identify low rating complaints, and instantly delete bad or abusive comments to maintain store reputation.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    const token = localStorage.getItem("token");
                    const headers = { Authorization: `Bearer ${token}` };
                    try {
                      const res = await axios.get(`${API_BASE_URL}/manager/reviews`, { headers });
                      if (res.data) {
                        setReviews(res.data.reviews || []);
                        if (res.data.stats) setReviewStats(res.data.stats);
                      }
                    } catch (e) {
                      console.error("Refresh reviews error:", e);
                    }
                  }}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Refresh Reviews</span>
                </button>
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider">Total Reviews</span>
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                </div>
                <p className="text-2xl font-black text-slate-900">{reviews.length}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Across all products & custom orders</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider">Average Rating</span>
                  <div className="flex text-amber-400">
                    <Star className="h-4 w-4 fill-amber-400" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-black text-slate-900">{reviewStats.averageRating || 0}</p>
                  <span className="text-xs text-slate-400 font-bold">/ 5.0</span>
                </div>
                <div className="flex text-amber-400 mt-1 gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-2.5 w-2.5 ${s <= Math.round(reviewStats.averageRating || 0)
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                        }`}
                    />
                  ))}
                </div>
              </div>

              <div
                onClick={() => setReviewFilterRating(reviewFilterRating === "BAD" ? "ALL" : "BAD")}
                className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition ${reviewFilterRating === "BAD"
                  ? "bg-rose-50 border-rose-300 ring-2 ring-rose-400"
                  : "bg-white border-slate-200/80 hover:border-rose-200 hover:bg-rose-50/20"
                  }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-rose-600 flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" /> Bad / Low Ratings (1-2★)
                  </span>
                  {reviewStats.badReviewsCount > 0 && (
                    <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-full">
                      ACTION
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-rose-600">{reviewStats.badReviewsCount}</p>
                <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                  {reviewFilterRating === "BAD" ? "Showing bad comments (click to show all)" : "Click to filter negative comments"}
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider">Positive Sentiment</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-emerald-600">
                  {reviews.length > 0
                    ? Math.round((((reviewStats.breakdown?.[4] || 0) + (reviewStats.breakdown?.[5] || 0)) / reviews.length) * 100)
                    : 100}
                  %
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">4 & 5-star customer satisfactions</p>
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
                    value={reviewSearchQuery}
                    onChange={(e) => setReviewSearchQuery(e.target.value)}
                    placeholder="Search by customer name, comment keywords (e.g. bad, broken, late), or product..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-indigo-500 focus:bg-white"
                  />
                  {reviewSearchQuery && (
                    <button
                      onClick={() => setReviewSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter by Product */}
                <div className="shrink-0 w-full md:w-64">
                  <select
                    value={reviewProductFilter}
                    onChange={(e) => setReviewProductFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-indigo-500"
                  >
                    <option value="ALL">All Store Products & Designs</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title} ({p.ratingsCount || 0} reviews)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rating Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-2 shrink-0">
                  Rating Filter:
                </span>
                {[
                  { key: "ALL", label: `All Reviews (${reviews.length})` },
                  {
                    key: "BAD",
                    label: `🚨 Bad / Low (1-2★) (${reviewStats.badReviewsCount})`,
                    alert: reviewStats.badReviewsCount > 0,
                  },
                  { key: "1", label: `1 Star (${reviewStats.breakdown?.[1] || 0})` },
                  { key: "2", label: `2 Stars (${reviewStats.breakdown?.[2] || 0})` },
                  { key: "3", label: `3 Stars (${reviewStats.breakdown?.[3] || 0})` },
                  { key: "4", label: `4 Stars (${reviewStats.breakdown?.[4] || 0})` },
                  { key: "5", label: `5 Stars (${reviewStats.breakdown?.[5] || 0})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setReviewFilterRating(tab.key)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${reviewFilterRating === tab.key
                      ? tab.key === "BAD"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "bg-indigo-600 text-white shadow-sm"
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

            {/* Reviews List */}
            {(() => {
              const filteredReviews = reviews.filter((r) => {
                if (reviewFilterRating === "BAD" && (Number(r.rating) || 0) > 2) return false;
                if (["1", "2", "3", "4", "5"].includes(reviewFilterRating) && String(r.rating) !== reviewFilterRating) return false;

                if (reviewSearchQuery.trim()) {
                  const q = reviewSearchQuery.toLowerCase();
                  const matchName = (r.userName || "").toLowerCase().includes(q);
                  const matchComment = (r.comment || "").toLowerCase().includes(q);
                  const matchProd = (r.productId?.title || r.designId?.tShirtType || "").toLowerCase().includes(q);
                  if (!matchName && !matchComment && !matchProd) return false;
                }

                if (reviewProductFilter !== "ALL") {
                  const pId = r.productId?._id || r.productId;
                  if (pId !== reviewProductFilter) return false;
                }

                return true;
              });

              if (filteredReviews.length === 0) {
                return (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">No reviews found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {reviewSearchQuery || reviewFilterRating !== "ALL" || reviewProductFilter !== "ALL"
                        ? "No reviews match your current filters. Try resetting the search or filter criteria."
                        : "No customer reviews have been submitted yet."}
                    </p>
                    {(reviewSearchQuery || reviewFilterRating !== "ALL" || reviewProductFilter !== "ALL") && (
                      <button
                        onClick={() => {
                          setReviewSearchQuery("");
                          setReviewFilterRating("ALL");
                          setReviewProductFilter("ALL");
                        }}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filteredReviews.map((rev) => {
                    const isBad = (Number(rev.rating) || 0) <= 2;
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
                        className={`bg-white border rounded-2xl p-5 shadow-xs transition hover:shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${isBad ? "border-rose-200 bg-rose-50/10" : "border-slate-200/80"
                          }`}
                      >
                        {/* Left: Customer info & review details */}
                        <div className="flex-1 space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2.5">
                            {/* User Avatar Initials */}
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                              {(rev.userName || "C")[0].toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-black text-slate-900">
                                {rev.userName || "Verified Buyer"}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-2 font-medium">
                                {new Date(rev.createdAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>

                            {/* Rating Stars */}
                            <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">
                              <div className="flex text-amber-400">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`h-3 w-3 ${s <= rev.rating
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

                            {/* Bad Comment Badge */}
                            {isBad && (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 rounded-md text-[10px] font-black flex items-center gap-1">
                                <ShieldAlert className="h-3 w-3" /> Bad / Low Feedback
                              </span>
                            )}
                          </div>

                          {/* Comment Content */}
                          <div
                            className={`p-3 rounded-xl text-xs leading-relaxed ${isBad
                              ? "bg-rose-50/50 border border-rose-100 text-rose-950 font-medium"
                              : "bg-slate-50 border border-slate-100 text-slate-700"
                              }`}
                          >
                            <p className="italic">
                              "{rev.comment || "(No text comment provided, star rating only)"}"
                            </p>
                          </div>

                          {/* Associated Product / Order info */}
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

                        {/* Right: Read-only badge */}
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

        {/* ================= TAB: CUSTOMER INQUIRIES & CONTACT MESSAGES ================= */}
        {activeTab === "inquiries" && (
          <div className="space-y-6">
            {/* Header & Overview Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                  <Mail className="h-5 w-5 text-indigo-600" />
                  Customer Inquiries & Form Messages
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Incoming contact inquiries, support tickets, and questions submitted across the site.
                </p>
              </div>

              <button
                onClick={fetchInquiries}
                disabled={inquiriesLoading}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs self-start sm:self-auto"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${inquiriesLoading ? "animate-spin" : ""}`} />
                <span>Refresh Messages</span>
              </button>
            </div>

            {/* Inquiries Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider">Total Received</span>
                  <Inbox className="h-4 w-4 text-slate-400" />
                </div>
                <p className="text-2xl font-black text-slate-900">{inquiryStats.total || inquiries.length}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">All customer form submissions</p>
              </div>

              <div
                onClick={() => setInquiryStatusFilter(inquiryStatusFilter === "New" ? "ALL" : "New")}
                className={`border rounded-2xl p-4 shadow-xs cursor-pointer transition ${inquiryStatusFilter === "New"
                  ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-400"
                  : "bg-white border-slate-200/80 hover:bg-indigo-50/30"
                  }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-indigo-600 flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" /> New / Unresolved
                  </span>
                  {inquiryStats.new > 0 && (
                    <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[9px] font-black rounded-full">
                      ACTION
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black text-indigo-600">{inquiryStats.new || 0}</p>
                <p className="text-[10px] text-indigo-500 font-semibold mt-0.5">
                  {inquiryStatusFilter === "New" ? "Filtered: New messages" : "Click to view unread messages"}
                </p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-600">Resolved Inquiries</span>
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="text-2xl font-black text-emerald-600">{inquiryStats.resolved || 0}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Completed inquiries & answers</p>
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
                    value={inquirySearchQuery}
                    onChange={(e) => setInquirySearchQuery(e.target.value)}
                    placeholder="Search by name, email, subject, or message content..."
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-indigo-500 focus:bg-white"
                  />
                  {inquirySearchQuery && (
                    <button
                      onClick={() => setInquirySearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter by Form Source */}
                <div className="shrink-0 w-full md:w-56">
                  <select
                    value={inquirySourceFilter}
                    onChange={(e) => setInquirySourceFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-indigo-500"
                  >
                    <option value="ALL">All Form Sources</option>
                    <option value="Contact Us">Contact Us Page</option>
                    <option value="Support Page">Support Page</option>
                    <option value="How It Works">How It Works Page</option>
                  </select>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[10px] font-black uppercase text-slate-400 mr-2 shrink-0">
                  Status:
                </span>
                {[
                  { key: "ALL", label: `All Inquiries (${inquiries.length})` },
                  { key: "New", label: `New (${inquiries.filter((i) => i.status === "New").length})` },
                  { key: "In Progress", label: `In Progress (${inquiries.filter((i) => i.status === "In Progress").length})` },
                  { key: "Resolved", label: `Resolved (${inquiries.filter((i) => i.status === "Resolved").length})` },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setInquiryStatusFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition shrink-0 cursor-pointer ${inquiryStatusFilter === tab.key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inquiries List */}
            {(() => {
              const filteredInquiries = inquiries.filter((inq) => {
                if (inquiryStatusFilter !== "ALL" && inq.status !== inquiryStatusFilter) return false;
                if (inquirySourceFilter !== "ALL" && inq.source !== inquirySourceFilter) return false;

                if (inquirySearchQuery.trim()) {
                  const q = inquirySearchQuery.toLowerCase();
                  const matchName = (inq.name || "").toLowerCase().includes(q);
                  const matchEmail = (inq.email || "").toLowerCase().includes(q);
                  const matchSubject = (inq.subject || "").toLowerCase().includes(q);
                  const matchMessage = (inq.message || "").toLowerCase().includes(q);
                  if (!matchName && !matchEmail && !matchSubject && !matchMessage) return false;
                }

                return true;
              });

              if (filteredInquiries.length === 0) {
                return (
                  <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center shadow-xs">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                      <Mail className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">No inquiries found</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {inquirySearchQuery || inquiryStatusFilter !== "ALL" || inquirySourceFilter !== "ALL"
                        ? "No inquiries match your current filters. Try resetting your search."
                        : "No customer contact messages have been received yet."}
                    </p>
                    {(inquirySearchQuery || inquiryStatusFilter !== "ALL" || inquirySourceFilter !== "ALL") && (
                      <button
                        onClick={() => {
                          setInquirySearchQuery("");
                          setInquiryStatusFilter("ALL");
                          setInquirySourceFilter("ALL");
                        }}
                        className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filteredInquiries.map((inq) => {
                    const isNew = inq.status === "New";
                    const isResolved = inq.status === "Resolved";
                    const isLoading = !!inquiryActionLoading[inq._id];

                    return (
                      <div
                        key={inq._id}
                        className={`bg-white border rounded-3xl p-5 md:p-6 transition shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-5 ${isNew
                          ? "border-indigo-200 bg-indigo-50/10"
                          : isResolved
                            ? "border-slate-200/80 opacity-90"
                            : "border-slate-200/80"
                          }`}
                      >
                        {/* Left Inquiry Info */}
                        <div className="flex-1 space-y-3">
                          {/* Sender & Badges Header */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="text-sm font-black text-slate-900">{inq.name}</h4>
                            <span className="text-xs text-slate-400 font-semibold">&bull;</span>
                            <a
                              href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject || 'PrintSphere Inquiry')}`}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
                            >
                              <Mail className="h-3 w-3" />
                              {inq.email}
                            </a>

                            {/* Source Badge */}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-200">
                              {inq.source || "Contact Us"}
                            </span>

                            {/* Status Badge */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${isNew
                                ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                                : isResolved
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                            >
                              {inq.status || "New"}
                            </span>

                            <span className="text-[10px] text-slate-400 font-medium ml-auto">
                              {new Date(inq.createdAt).toLocaleString()}
                            </span>
                          </div>

                          {/* Subject */}
                          <p className="text-xs font-bold text-slate-800">
                            Subject: <span className="font-semibold text-slate-600">{inq.subject || "General Inquiry"}</span>
                          </p>

                          {/* Message Body */}
                          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                            {inq.message}
                          </div>
                        </div>

                        {/* Right Action Buttons & User Contact Info */}
                        <div className="shrink-0 flex flex-row md:flex-col items-center md:items-end gap-2.5 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                          {/* User Contact Info: Email */}
                          <div className="flex flex-col items-start md:items-end w-full">
                            <a
                              href={`mailto:${inq.email}?subject=Re: ${encodeURIComponent(inq.subject || 'PrintSphere Inquiry')}`}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50/70 hover:bg-indigo-100/70 px-3 py-1.5 rounded-xl border border-indigo-100 transition max-w-full"
                              title="Customer Email"
                            >
                              <Mail className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                              <span className="truncate">{inq.email}</span>
                            </a>
                          </div>

                          {/* Dynamic Sequential Status Action Buttons */}
                          {inq.status === "New" && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleUpdateInquiryStatus(inq._id, "In Progress")}
                              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Mark inquiry as In Progress"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Clock className="h-3.5 w-3.5" />
                              )}
                              <span>In Progress</span>
                            </button>
                          )}

                          {inq.status === "In Progress" && (
                            <button
                              disabled={isLoading}
                              onClick={() => handleUpdateInquiryStatus(inq._id, "Resolved")}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                              title="Mark inquiry as Resolved"
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5" />
                              )}
                              <span>Resolved</span>
                            </button>
                          )}

                          {inq.status === "Resolved" && (
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-1.5 select-none">
                                <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Resolved</span>
                              </span>
                              <button
                                disabled={isLoading}
                                onClick={() => handleUpdateInquiryStatus(inq._id, "In Progress")}
                                className="text-[11px] text-slate-400 hover:text-indigo-600 font-semibold underline px-1 cursor-pointer disabled:opacity-50"
                                title="Reopen inquiry as In Progress"
                              >
                                Reopen
                              </button>
                            </div>
                          )}

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteInquiry(inq._id)}
                            disabled={isLoading}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Delete Inquiry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
                  shirtColor={
                    selectedSubmissionProduct.colors?.[0] || "#ffffff"
                  }
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
                <span className="text-[10px] font-bold text-slate-500 uppercase">
                  Zoom
                </span>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={submissionZoom}
                  onChange={(e) =>
                    setSubmissionZoom(parseFloat(e.target.value))
                  }
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
                    Proposed Price: Rs.{" "}
                    {selectedSubmissionProduct.basePrice.toFixed(2)}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Description
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedSubmissionProduct.description}
                  </p>
                </div>

                {selectedSubmissionProduct.createdBy && (
                  <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-purple-600 shrink-0" />
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">
                        Designer
                      </span>
                      <span className="text-xs font-bold text-purple-800">
                        {selectedSubmissionProduct.createdBy.name || "Employee"}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Sizes Included
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {selectedSubmissionProduct.sizes?.map((sz) => (
                      <span
                        key={sz}
                        className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
                      >
                        {sz}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Fabric Colors
                  </span>
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
              <div className="mt-8 pt-4 border-t flex flex-col gap-2.5">
                <button
                  disabled={approvingProductId === selectedSubmissionProduct._id}
                  onClick={() => {
                    handleApproveProductDraft(
                      selectedSubmissionProduct._id,
                      "approve",
                    );
                  }}
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {approvingProductId === selectedSubmissionProduct._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4.5 w-4.5 stroke-[2.5]" />
                  )}
                  <span>Approve & Publish to Store</span>
                </button>
                <button
                  disabled={approvingProductId === selectedSubmissionProduct._id}
                  onClick={() => {
                    handleApproveProductDraft(
                      selectedSubmissionProduct._id,
                      "reject",
                    );
                  }}
                  className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {approvingProductId === selectedSubmissionProduct._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4.5 w-4.5 stroke-[2.5]" />
                  )}
                  <span>Disapprove / Reject Submission</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Add New Inventory Modal */}
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
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
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
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
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
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
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
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition cursor-pointer ${isSelected
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
                    <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
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
                    <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider block mb-1.5">
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
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition cursor-pointer ${inventoryForm.colorName === c.name
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
                      <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
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
                      <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
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
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
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
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
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
                  {inventoryActionLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  Save Inventory Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Insufficient Inventory Alert Modal */}
      {inventoryAlertModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-rose-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-rose-50/70 border-b border-rose-100 flex items-start gap-4">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shrink-0 shadow-xs">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-rose-950">
                    {inventoryAlertModal.title || "Insufficient Inventory Stock!"}
                  </h3>
                  <button
                    onClick={() => setInventoryAlertModal((prev) => ({ ...prev, isOpen: false }))}
                    className="p-1 text-slate-400 hover:text-slate-600 transition rounded-lg"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-rose-700 mt-1 font-semibold">
                  {inventoryAlertModal.message || "Cannot assign employee to this order because required materials are out of stock."}
                </p>
              </div>
            </div>

            {/* Content & Details */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Required Materials Shortage:
                </p>
                {inventoryAlertModal.missingItems && inventoryAlertModal.missingItems.length > 0 ? (
                  <div className="space-y-2.5">
                    {inventoryAlertModal.missingItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs font-bold text-slate-900">
                            {item.style || item.tShirtStyle || "Plain T-Shirt"}
                          </p>
                          <div className="flex flex-wrap gap-1.5 text-[10px] text-slate-500 font-semibold">
                            <span className="px-2 py-0.5 bg-white border rounded-md">Size: {item.size}</span>
                            <span className="px-2 py-0.5 bg-white border rounded-md">Color: {resolveColorName(item.color)}</span>
                            <span className="px-2 py-0.5 bg-white border rounded-md">GSM: {item.gsm}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-slate-700">
                            Required: <span className="font-black text-rose-600">{item.required}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
                            In Stock: <span className="font-bold text-amber-600">{item.available}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 text-xs text-rose-800 whitespace-pre-line font-medium">
                    {inventoryAlertModal.details}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Please restock the missing plain t-shirts in the inventory tab before assigning this order to an employee.</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-slate-50 border-t flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                onClick={() => setInventoryAlertModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-full sm:w-auto px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border rounded-xl hover:bg-white transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setInventoryAlertModal((prev) => ({ ...prev, isOpen: false }));
                  setActiveTab("inventory");
                }}
                className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Package className="h-3.5 w-3.5" />
                Go to Inventory & Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit T-Shirt Style Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-600/30 rounded-xl text-indigo-400">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wider">
                    {editingStyle ? "Edit T-Shirt Style" : "Add New T-Shirt Style"}
                  </h3>
                  <p className="text-[10px] text-indigo-300 mt-0.5">
                    3D Model Configuration, Pricing & Color Swatches
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowStyleModal(false);
                  setEditingStyle(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveStyle}
              className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800"
            >
              {stylesError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{stylesError}</span>
                </div>
              )}

              {/* Live 3D Model Preview */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1.5">
                  3D Model Preview (Live)
                </label>
                <Store3DCardPreview
                  product={{
                    title: styleForm.name || "T-Shirt Style Preview",
                    tShirtType: styleForm.name || "Crew Neck",
                    path: styleForm.path || "/images/models/male normal t-shirt1.glb",
                    modelPath: styleForm.path || "/images/models/male normal t-shirt1.glb",
                    colors: (styleForm.colors || []).map((c) =>
                      typeof c === "string" ? c : c.value
                    ),
                  }}
                  activeColor={
                    styleForm.colors?.[0]
                      ? typeof styleForm.colors[0] === "string"
                        ? styleForm.colors[0]
                        : styleForm.colors[0].value
                      : "#ffffff"
                  }
                  showControls={true}
                  hideBadge={false}
                  className="h-48 w-full rounded-2xl bg-gradient-to-b from-slate-50 via-slate-100/70 to-slate-100 border border-slate-200/80 shadow-inner"
                />
              </div>

              {/* Style Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  Style Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Crew Neck, Women's V-Neck, Long Sleeve Shirt, Oversized Tee, Hoodie"
                  value={styleForm.name}
                  onChange={(e) =>
                    setStyleForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold focus:outline-indigo-500"
                />
              </div>

              {/* 3D Model Path Preset / Custom */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  3D Model File (.glb, .gltf, .fbx) *
                </label>
                <select
                  value={styleForm.path}
                  onChange={(e) =>
                    setStyleForm((prev) => ({ ...prev, path: e.target.value }))
                  }
                  className="w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-indigo-500 bg-white"
                >
                  <option value="">-- Select from Available 3D Model Files --</option>
                  <option value="/images/models/male normal t-shirt1.glb">
                    Men's Normal T-Shirt (male normal t-shirt1.glb)
                  </option>
                  <option value="/images/models/female normal t-shirt.glb">
                    Women's T-Shirt (female normal t-shirt.glb)
                  </option>
                  <option value="/images/models/long_sleeve_t-_shirt.glb">
                    Long Sleeve T-Shirt (long_sleeve_t-_shirt.glb)
                  </option>
                  <option value="/images/models/oversized t-sdirt1.glb">
                    Oversized T-Shirt (oversized t-sdirt1.glb)
                  </option>
                  <option value="/images/models/t_shirt_hoodie.glb">
                    T-Shirt Hoodie / Polo (t_shirt_hoodie.glb)
                  </option>
                  <option value="/images/models/T SHIRT.fbx">
                    Classic T-Shirt (T SHIRT.fbx)
                  </option>
                  <option value="/images/models/amazigh_traditional_t-shirt.glb">
                    Amazigh Traditional T-Shirt (amazigh_traditional_t-shirt.glb)
                  </option>
                  <option value="/images/models/orange_shirt_with_collar.glb">
                    Collar Shirt (orange_shirt_with_collar.glb)
                  </option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Or enter custom path e.g. /images/models/custom.glb"
                  value={styleForm.path}
                  onChange={(e) =>
                    setStyleForm((prev) => ({ ...prev, path: e.target.value }))
                  }
                  className="w-full px-3.5 py-2 border rounded-xl text-xs font-mono text-slate-700 focus:outline-indigo-500 mt-1"
                />
              </div>

              {/* GSM Weights & Prices Section */}
              <div className="space-y-2.5 border rounded-2xl p-4 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Fabric Weights & Pricing (GSM)
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {styleForm.gsmPrices?.length || 0} Weights Added
                  </span>
                </div>

                {/* List of current GSMs */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {(styleForm.gsmPrices || []).map((gp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-white rounded-xl border border-slate-200 text-xs shadow-2xs"
                    >
                      <span className="font-bold text-slate-800">{gp.gsm}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-extrabold text-indigo-600">
                          Rs. {Number(gp.price || 0).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStyleForm((prev) => ({
                              ...prev,
                              gsmPrices: prev.gsmPrices.filter((_, i) => i !== idx),
                            }));
                          }}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new GSM inputs */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="e.g. GSM 200"
                    value={newGsmName}
                    onChange={(e) => setNewGsmName(e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded-xl text-xs bg-white focus:outline-indigo-500"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Price (Rs.)"
                    value={newGsmPrice}
                    onChange={(e) => setNewGsmPrice(e.target.value)}
                    className="w-28 px-3 py-1.5 border rounded-xl text-xs bg-white focus:outline-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newGsmName.trim() || !newGsmPrice) return;
                      const formatted = newGsmName.toUpperCase().includes("GSM")
                        ? newGsmName.toUpperCase().trim()
                        : `GSM ${newGsmName.trim()}`;
                      setStyleForm((prev) => ({
                        ...prev,
                        gsmPrices: [
                          ...(prev.gsmPrices || []),
                          { gsm: formatted, price: Number(newGsmPrice) },
                        ],
                      }));
                      setNewGsmName("");
                      setNewGsmPrice("");
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Colors Swatches Section */}
              <div className="space-y-2.5 border rounded-2xl p-4 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                    Available Fabric Colors
                  </label>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {styleForm.colors?.length || 0} Colors
                  </span>
                </div>

                {/* Swatches display */}
                <div className="flex flex-wrap gap-2">
                  {(styleForm.colors || []).map((color, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-white border border-slate-200 rounded-full text-xs shadow-2xs group"
                    >
                      <span
                        className="h-4 w-4 rounded-full border border-slate-300 shrink-0"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-[11px] font-semibold text-slate-700">
                        {color.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setStyleForm((prev) => ({
                            ...prev,
                            colors: prev.colors.filter((_, i) => i !== idx),
                          }));
                        }}
                        className="text-slate-400 hover:text-rose-600 transition"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add new color inputs */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="color"
                    value={newColor.value}
                    onChange={(e) =>
                      setNewColor((prev) => ({ ...prev, value: e.target.value }))
                    }
                    className="w-9 h-8 border rounded-xl cursor-pointer shrink-0"
                  />
                  <input
                    type="text"
                    placeholder="Color Name (e.g. Navy Blue)"
                    value={newColor.name}
                    onChange={(e) =>
                      setNewColor((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="flex-1 px-3 py-1.5 border rounded-xl text-xs bg-white focus:outline-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newColor.name.trim()) return;
                      setStyleForm((prev) => ({
                        ...prev,
                        colors: [
                          ...(prev.colors || []),
                          { name: newColor.name.trim(), value: newColor.value },
                        ],
                      }));
                      setNewColor({ name: "", value: "#ffffff" });
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>

              {/* Available Sizes Section */}
              <div className="space-y-2.5 border rounded-2xl p-4 bg-slate-50/70">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                      Available Sizes for Designing
                    </label>
                    <span className="text-[10px] text-slate-400">
                      Users & employees can only choose from these sizes in 3D designer
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-2xs">
                    {styleForm.sizes?.length || 0} of 7 Selected
                  </span>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setStyleForm((prev) => ({
                        ...prev,
                        sizes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
                      }))
                    }
                    className="px-2.5 py-1 text-[11px] font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setStyleForm((prev) => ({
                        ...prev,
                        sizes: ["S", "M", "L", "XL", "XXL"],
                      }))
                    }
                    className="px-2.5 py-1 text-[11px] font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition cursor-pointer"
                  >
                    Standard (S-XXL)
                  </button>
                </div>

                {/* Sizes grid toggle buttons */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
                  {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((sz) => {
                    const isSelected = (styleForm.sizes || []).includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => {
                          setStyleForm((prev) => {
                            const current = prev.sizes || [];
                            if (current.includes(sz)) {
                              if (current.length === 1) return prev; // Keep at least one size
                              return {
                                ...prev,
                                sizes: current.filter((s) => s !== sz),
                              };
                            } else {
                              return {
                                ...prev,
                                sizes: [...current, sz],
                              };
                            }
                          });
                        }}
                        className={`py-2 px-2 rounded-xl border text-xs font-black transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                            : "border-slate-200 bg-white hover:bg-slate-100 text-slate-700 opacity-60"
                        }`}
                      >
                        <span className="text-xs font-extrabold">{sz}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Additional Custom Sizes (if any) */}
                {(styleForm.sizes || []).some(
                  (s) => !["XS", "S", "M", "L", "XL", "XXL", "3XL"].includes(s)
                ) && (
                  <div className="pt-2 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] font-bold text-slate-400">Custom Sizes:</span>
                    {(styleForm.sizes || [])
                      .filter((s) => !["XS", "S", "M", "L", "XL", "XXL", "3XL"].includes(s))
                      .map((customSz, cIdx) => (
                        <span
                          key={cIdx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white rounded-xl text-xs font-black"
                        >
                          {customSz}
                          <button
                            type="button"
                            onClick={() => {
                              setStyleForm((prev) => ({
                                ...prev,
                                sizes: prev.sizes.filter((s) => s !== customSz),
                              }));
                            }}
                            className="hover:text-rose-200 cursor-pointer"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}

                {/* Add Custom Size Input */}
                <div className="flex items-center gap-2 pt-1.5">
                  <input
                    type="text"
                    placeholder="Add custom size (e.g. 4XL, Youth M)"
                    value={newCustomSize}
                    onChange={(e) => setNewCustomSize(e.target.value)}
                    className="flex-1 px-3 py-1.5 border rounded-xl text-xs bg-white focus:outline-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = newCustomSize.trim().toUpperCase();
                      if (!trimmed) return;
                      setStyleForm((prev) => {
                        const current = prev.sizes || [];
                        if (current.includes(trimmed)) return prev;
                        return {
                          ...prev,
                          sizes: [...current, trimmed],
                        };
                      });
                      setNewCustomSize("");
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Size
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowStyleModal(false);
                    setEditingStyle(null);
                  }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stylesLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {stylesLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingStyle ? "Update Style" : "Save T-Shirt Style"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Order Reason Modal */}
      {cancellingOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-3xl max-w-md w-full border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Cancel Order #{cancellingOrder.orderNumber}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Customer: {cancellingOrder.customerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setCancellingOrder(null);
                  setCancelReasonInput("");
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Reason for Cancellation
                </label>
                <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                  Please provide a clear reason for cancelling this order. This message will be displayed directly to the customer on their order details page.
                </p>

                {/* Quick reason suggestions */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[
                    "Fabric or color out of stock",
                    "Print artwork resolution too low",
                    "Your Design cannot approve",
                    "Delivery address unreachable",
                    "Payment verification issue",
                  ].map((quickReason) => (
                    <button
                      key={quickReason}
                      type="button"
                      onClick={() => setCancelReasonInput(quickReason)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${cancelReasonInput === quickReason
                        ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                      {quickReason}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={3}
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="e.g. Due to fabric inventory shortage for XL Navy Blue, we cannot fulfill this order..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none transition resize-none"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setCancellingOrder(null);
                    setCancelReasonInput("");
                  }}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                >
                  Keep Order
                </button>
                <button
                  type="button"
                  disabled={assignLoading[cancellingOrder.orderId]}
                  onClick={handleConfirmCancelOrder}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {assignLoading[cancellingOrder.orderId] ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Ban className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </div>
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
    </div>
  );
}
