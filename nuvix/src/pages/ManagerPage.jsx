import { useState, useEffect } from "react";
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
} from "lucide-react";
import axios from "axios";
import Scene from "../three/Scene";
import TShirt2D from "../components/TShirt2D";
import TShirt3DModal from "../components/TShirt3DModal";

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
    type: "Crew Neck",
    gsmPrices: [
      { gsm: "180GSM", price: 1200 },
      { gsm: "220GSM", price: 1500 },
    ],
    colors: [
      { name: "White", value: "#ffffff" },
      { name: "Black", value: "#111827" },
    ],
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
    gsms: ["180GSM", "200GSM", "220GSM", "240GSM"],
    colors: ["#ffffff"],
    images: [],
    modelPath: "/images/models/male normal t-shirt1.glb",
    defaultColor: "#ffffff",
    status: "Active",
  });
  const [productError, setProductError] = useState("");
  const [productSuccess, setProductSuccess] = useState("");
  const [productActionLoading, setProductActionLoading] = useState(false);

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
    material: "180GSM",
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
    const headers = { Authorization: `Bearer ${token}` };

    try {
      // Fetch concurrently
      const [
        ordersRes,
        productsRes,
        inventoryRes,
        pricingRes,
        employeesRes,
        stylesRes,
      ] = await Promise.all([
        axios.get(`${API_BASE_URL}/manager/orders`, { headers }),
        axios.get(`${API_BASE_URL}/manager/products`, { headers }),
        axios.get(`${API_BASE_URL}/manager/inventory`, { headers }),
        axios.get(`${API_BASE_URL}/manager/pricing-rules`, { headers }),
        axios.get(`${API_BASE_URL}/manager/employees`, { headers }),
        axios.get(`${API_BASE_URL}/manager/tshirt-styles`, { headers }),
      ]);

      setOrders(ordersRes.data);
      setProducts(productsRes.data);
      setInventory(inventoryRes.data);
      setPricingRules(pricingRes.data);
      setEmployees(employeesRes.data);
      setStyles(stylesRes.data);

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

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // ================= ORDERS OPERATIONS =================

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order? This action will mark the order as Cancelled.")) {
      return;
    }
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      setAssignLoading((prev) => ({ ...prev, [orderId]: true }));
      const response = await axios.put(
        `${API_BASE_URL}/manager/orders/${orderId}/status`,
        { status: "Cancelled", note: "Order cancelled by manager." },
        { headers },
      );

      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? response.data.order : o)),
      );
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
      setEditingEmployeeOrderId(null);
    } catch (err) {
      console.error("Assign employee error:", err);
      alert("Failed to assign employee");
    } finally {
      setAssignLoading((prev) => ({ ...prev, [orderId]: false }));
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
        { headers },
      );
      alert(res.data.message);
      // reload products
      const productsRes = await axios.get(`${API_BASE_URL}/manager/products`, {
        headers,
      });
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
          { headers },
        );
        setProductSuccess("Product updated successfully!");
      } else {
        // Create Product
        await axios.post(`${API_BASE_URL}/manager/products`, productForm, {
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
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      await axios.delete(`${API_BASE_URL}/manager/products/${id}`, { headers });
      setProducts((prev) => prev.filter((p) => p._id !== id));
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
          resolvedGsms = matchedStyle.gsmPrices.map((gp) => gp.gsm);
        } else if (matchedStyle.gsms && matchedStyle.gsms.length > 0) {
          resolvedGsms = matchedStyle.gsms;
        }
      }
    }
    if (resolvedGsms.length === 0) {
      resolvedGsms = ["180GSM", "200GSM", "220GSM", "240GSM"];
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
        initialGsms = firstStyle.gsmPrices.map((gp) => gp.gsm);
      } else if (firstStyle.gsms && firstStyle.gsms.length > 0) {
        initialGsms = firstStyle.gsms;
      }
    }
    if (initialGsms.length === 0) {
      initialGsms = ["180GSM", "200GSM", "220GSM", "240GSM"];
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
      type: styleForm.type || "Crew Neck",
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
        type: "Crew Neck",
        gsmPrices: [
          { gsm: "180GSM", price: 1200 },
          { gsm: "220GSM", price: 1500 },
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
    if (!confirm("Are you sure you want to delete this style?")) return;
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
      alert("Failed to delete style.");
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
      const chosenGsm = inventoryForm.material || selectedStyleObj?.gsmPrices?.[0]?.gsm || selectedStyleObj?.gsms?.[0] || "180GSM";

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
        material: "180GSM",
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
    if (!confirm("Are you sure you want to delete this inventory item?")) return;
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await axios.delete(`${API_BASE_URL}/manager/inventory/${id}`, { headers });
      const invRes = await axios.get(`${API_BASE_URL}/manager/inventory`, { headers });
      setInventory(invRes.data);
    } catch (err) {
      console.error("Delete inventory item error:", err);
      alert(err.response?.data?.message || "Failed to delete inventory item.");
    }
  };

  // Helper selectors / values
  const pendingDrafts = products.filter(
    (p) => !p.isApproved && p.status === "Draft",
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
    if (selectedSubmissionProduct.modelPath) {
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
    <div className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 flex flex-col justify-between shrink-0 select-none text-slate-400">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              M
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide leading-none">
                PrintSphere
              </h1>
              <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">
                Manager Desk
              </span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "overview"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <BarChart3 className="h-4.5 w-4.5" />
              Dashboard Overview
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "orders"
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
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "products"
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
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "pricing"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Sparkles className="h-4.5 w-4.5" />
              Pricing Rules
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "inventory"
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
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                activeTab === "styles"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              <Layers className="h-4.5 w-4.5" />
              T-Shirt Styles
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
              Settings & Security
            </button>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => {
                  setActiveTab("store-preview");
                  setShowStorePreview(true);
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition ${
                  activeTab === "store-preview"
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <Award className="h-4.5 w-4.5" />
                Store Preview
              </button>
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3 px-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Logged as Manager
            </span>
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 py-2">
                {[
                  "Pending Payment",
                  "Processing",
                  "Printing",
                  "Completed",
                  "Shipped",
                  "Cancelled",
                ].map((status, index) => {
                  const count = orders.filter(
                    (o) => o.orderStatus === status,
                  ).length;
                  return (
                    <div
                      key={status}
                      className="border border-slate-100 rounded-2xl p-4 text-center bg-slate-50/50"
                    >
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                        {status}
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
                <h3 className="text-sm font-bold text-slate-950 mb-4 flex items-center gap-2">
                  <Award className="h-4.5 w-4.5 text-purple-500" />
                  Designs Awaiting Approval ({pendingDrafts.length})
                </h3>
                {pendingDrafts.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-slate-500 font-semibold">
                      All employee submissions approved & active.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {pendingDrafts.map((draft) => (
                      <div
                        key={draft._id}
                        className="flex items-center justify-between border rounded-2xl p-4 hover:bg-slate-50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <TShirt2D
                            color={draft.colors?.[0]}
                            designUrl={draft.images?.[0]}
                            className="h-16 w-16 bg-slate-50 border rounded-xl shrink-0"
                          />
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {draft.title}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {draft.category} — Rs.{" "}
                              {draft.basePrice.toFixed(2)}
                            </p>
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
                            onClick={() =>
                              handleApproveProductDraft(draft._id, "approve")
                            }
                            className="p-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
                            title="Approve & Publish"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleApproveProductDraft(draft._id, "reject")
                            }
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-indigo-600" />
                  Customer Orders & Production Pipeline
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Assign staff to orders, monitor production pipeline status, or manage order cancellations.
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl text-xs font-bold">
                {orders.length} Total Orders
              </span>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-sm text-slate-500 font-semibold">
                  No customer orders found in the database.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => {
                  const pipelineStages = ["Processing", "Printing", "Completed", "Shipped"];
                  const currentStageIdx = pipelineStages.indexOf(order.orderStatus);
                  const isCancelled = order.orderStatus === "Cancelled";
                  const isPendingPayment = order.orderStatus === "Pending Payment";
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
                            Placed: {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Content Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                        {/* Items */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                              Order Items
                            </h4>
                            <div className="space-y-3">
                              {order.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  className="bg-white p-3 border rounded-xl shadow-xs text-xs"
                                >
                                  <p className="font-bold text-slate-900">
                                    {item.tShirtStyle || (item.itemType ? `${item.itemType} T-shirt` : "T-Shirt")} (x{item.quantity})
                                  </p>
                                  <p className="text-slate-500 text-[10px] mt-0.5">
                                    Style: {item.tShirtStyle || "Crew Neck"} | Size: {item.selectedSize || item.size} | Color: {item.selectedColor || item.color} | GSM: {item.gsm || item.material || "180GSM"}
                                  </p>

                                  {item.itemType === "Customized" &&
                                    item.designId && (
                                      <div className="mt-2 pt-2 border-t space-y-2">
                                        {item.designId.thumbnailUrl && (
                                          <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg">
                                            <img
                                              src={item.designId.thumbnailUrl}
                                              alt="Preview"
                                              className="h-10 w-10 object-contain bg-white rounded border"
                                              onError={(e) =>
                                                (e.target.src =
                                                  "/images/dumyImage.png")
                                              }
                                            />
                                            <div>
                                              <p className="text-[10px] font-bold text-slate-900">
                                                Custom design thumbnail
                                              </p>
                                              <a
                                                href={item.designId.thumbnailUrl}
                                                download
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[9px] text-indigo-600 hover:underline flex items-center gap-0.5 mt-0.5"
                                              >
                                                <Download className="h-2.5 w-2.5" />{" "}
                                                Download composite
                                              </a>
                                              <button
                                                onClick={() => {
                                                  setSelected3DDesign(
                                                    item.designId,
                                                  );
                                                  setIs3DModalOpen(true);
                                                }}
                                                className="text-[9px] text-indigo-650 hover:underline flex items-center gap-0.5 mt-1 cursor-pointer font-bold"
                                              >
                                                <Sparkles className="h-2.5 w-2.5 text-indigo-600 animate-pulse" />{" "}
                                                View in 3D Format
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Logo layers */}
                                        {(() => {
                                          const imgLayers = (
                                            item.designId.layers || []
                                          ).filter(
                                            (l) =>
                                              l.type === "image" ||
                                              l.type === "logo",
                                          );
                                          if (imgLayers.length > 0) {
                                            return (
                                              <div className="space-y-1 mt-2">
                                                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">
                                                  Logo/Decal Assets:
                                                </p>
                                                {imgLayers.map((layer, lIdx) => (
                                                  <div
                                                    key={lIdx}
                                                    className="flex justify-between items-center bg-slate-50 p-1.5 rounded-lg text-[10px]"
                                                  >
                                                    <span className="truncate max-w-[120px] font-semibold">
                                                      {layer.name ||
                                                        `Asset ${lIdx + 1}`}
                                                    </span>
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
                          <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                            Shipping Destination
                          </h4>
                          {order.shippingAddress ? (
                            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 border rounded-xl">
                              {order.shippingAddress.street},{" "}
                              {order.shippingAddress.city},{" "}
                              {order.shippingAddress.country}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-400 bg-white p-3 border rounded-xl">
                              Address not specified
                            </p>
                          )}
                        </div>

                        {/* Employee Assignment */}
                        <div>
                          <h4 className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-2">
                            Assigned Employee
                          </h4>
                          {order.assignedEmployee && editingEmployeeOrderId !== order._id ? (
                            <div className="bg-white border rounded-xl p-3.5 space-y-2.5 shadow-xs">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {order.assignedEmployee.name ? order.assignedEmployee.name.charAt(0).toUpperCase() : "E"}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-slate-900 truncate">
                                      {order.assignedEmployee.name}
                                    </p>
                                    <p className="text-[10px] text-indigo-600 font-semibold">
                                      Assigned Operator
                                    </p>
                                  </div>
                                </div>

                                {!isCancelled && order.orderStatus !== "Shipped" && (
                                  <button
                                    onClick={() => {
                                      setEditingEmployeeOrderId(order._id);
                                      setSelectedEmployeeForOrder((prev) => ({
                                        ...prev,
                                        [order._id]: order.assignedEmployee?._id || "",
                                      }));
                                    }}
                                    className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-lg transition flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                                    title="Edit / Change assigned employee"
                                  >
                                    <Edit2 className="h-3 w-3 text-indigo-600" />
                                    <span>Edit</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="bg-white border rounded-xl p-3 space-y-2 shadow-xs">
                              {editingEmployeeOrderId === order._id ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase font-bold text-indigo-700">
                                      Change Employee
                                    </span>
                                    <button
                                      onClick={() => setEditingEmployeeOrderId(null)}
                                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                                      title="Cancel"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <select
                                      value={selectedEmployeeForOrder[order._id] || order.assignedEmployee?._id || ""}
                                      onChange={(e) =>
                                        setSelectedEmployeeForOrder((prev) => ({
                                          ...prev,
                                          [order._id]: e.target.value,
                                        }))
                                      }
                                      className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white font-medium focus:outline-none focus:border-indigo-500"
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
                                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                                      title="Save change"
                                    >
                                      {assignLoading[order._id] ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <Check className="h-3.5 w-3.5" />
                                      )}
                                      <span>Save</span>
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <select
                                    disabled={assignLoading[order._id] || isCancelled}
                                    onChange={(e) => handleAssignEmployee(order._id, e.target.value)}
                                    defaultValue=""
                                    className="w-full text-xs border border-slate-200 rounded-xl px-2.5 py-2 bg-slate-50/50 font-bold text-slate-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="" disabled>
                                      -- Assign an employee --
                                    </option>
                                    {employees.map((emp) => (
                                      <option key={emp._id} value={emp._id}>
                                        {emp.name}
                                      </option>
                                    ))}
                                  </select>
                                  <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3 shrink-0" />
                                    No employee assigned yet
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Production Pipeline Status Viewer & Order Actions */}
                      <div className="pt-4 border-t border-dashed flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        {/* Status / Pipeline Display (Read-Only) */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">
                              Production Status:
                            </span>
                            {latestTimeline?.note && (
                              <span className="text-[11px] text-slate-500 italic truncate max-w-md">
                                ({latestTimeline.note})
                              </span>
                            )}
                          </div>

                          {isCancelled ? (
                            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                              <Ban className="h-4 w-4 text-rose-500 shrink-0" />
                              <span>Order has been Cancelled</span>
                            </div>
                          ) : isPendingPayment ? (
                            <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold">
                              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                              <span>Awaiting Customer Payment Before Processing</span>
                            </div>
                          ) : (
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
                        </div>

                        {/* Order Management Actions (Cancel Order) */}
                        <div className="shrink-0 flex items-center gap-2">
                          {!isCancelled && order.orderStatus !== "Shipped" ? (
                            <button
                              disabled={assignLoading[order._id]}
                              onClick={() => handleCancelOrder(order._id)}
                              className="px-3.5 py-2 bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                              title="Cancel this customer order"
                            >
                              {assignLoading[order._id] ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Ban className="h-3.5 w-3.5" />
                              )}
                              <span>Cancel Order</span>
                            </button>
                          ) : isCancelled ? (
                            <span className="text-xs font-bold text-rose-500 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100 flex items-center gap-1.5">
                              <Ban className="h-3.5 w-3.5" /> Order Cancelled
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1.5">
                              <CheckCircle className="h-3.5 w-3.5" /> Order Fulfilled & Shipped
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                  <p className="text-sm text-slate-500 font-semibold">
                    No catalog products loaded.
                  </p>
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
                        <th className="pb-3">GSMs</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr
                          key={p._id}
                          className="border-b last:border-b-0 hover:bg-slate-50/50 transition"
                        >
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
                          <td className="py-4 text-xs text-slate-600">
                            {p.category}
                          </td>
                          <td className="py-4 text-xs font-bold text-slate-900">
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
                            {(p.sizes || []).join(", ")}
                          </td>
                          <td className="py-4 text-xs font-medium text-slate-700">
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
                              return "180GSM";
                            })()}
                          </td>
                          <td className="py-4 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                p.status === "Active"
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
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

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center justify-between">
                        <span>Category</span>
                        <span className="text-[9px] text-indigo-600 font-normal">Select or type custom</span>
                      </label>
                      <div className="flex gap-2">
                        {products && products.length > 0 && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                setProductForm((prev) => ({ ...prev, category: e.target.value }));
                              }
                            }}
                            value={products.map((p) => p.category).includes(productForm.category) ? productForm.category : ""}
                            className="px-3 py-2 border rounded-xl text-xs font-semibold bg-white max-w-[140px]"
                          >
                            <option value="">-- Existing --</option>
                            {[...new Set(products.map((p) => p.category).filter(Boolean))].map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        )}
                        <input
                          type="text"
                          required
                          value={productForm.category}
                          onChange={(e) =>
                            setProductForm((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                          placeholder="Category name..."
                          className="w-full px-3 py-2 border rounded-xl text-sm"
                        />
                      </div>
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
                                styleGsms = matchedStyle.gsmPrices.map((gp) => gp.gsm);
                              } else if (matchedStyle.gsms && matchedStyle.gsms.length > 0) {
                                styleGsms = matchedStyle.gsms;
                              }
                            }
                            if (styleGsms.length === 0) {
                              styleGsms = ["180GSM", "200GSM", "220GSM", "240GSM"];
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
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${
                                isSelected
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
                              availableGsms = matchedStyle.gsmPrices.map((gp) => gp.gsm);
                            } else if (matchedStyle.gsms && matchedStyle.gsms.length > 0) {
                              availableGsms = matchedStyle.gsms;
                            }
                          }
                          if (availableGsms.length === 0) {
                            availableGsms = ["180GSM", "200GSM", "220GSM", "240GSM", "280GSM", "320GSM"];
                          }

                          return availableGsms.map((gsm) => {
                            const isSelected = (productForm.gsms || []).includes(gsm);
                            return (
                              <label
                                key={gsm}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${
                                  isSelected
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
                      {/* Add Custom GSM if desired */}
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          id="customGsmInput"
                          placeholder="Add custom GSM (e.g. 190GSM)"
                          className="px-2.5 py-1 text-xs border rounded-lg max-w-[200px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = e.target.value.trim().toUpperCase();
                              if (val) {
                                const formatted = val.endsWith("GSM") ? val : `${val}GSM`;
                                if (!(productForm.gsms || []).includes(formatted)) {
                                  setProductForm((prev) => ({
                                    ...prev,
                                    gsms: [...(prev.gsms || []), formatted],
                                  }));
                                }
                                e.target.value = "";
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById("customGsmInput");
                            if (input && input.value.trim()) {
                              const val = input.value.trim().toUpperCase();
                              const formatted = val.endsWith("GSM") ? val : `${val}GSM`;
                              if (!(productForm.gsms || []).includes(formatted)) {
                                setProductForm((prev) => ({
                                  ...prev,
                                  gsms: [...(prev.gsms || []), formatted],
                                }));
                              }
                              input.value = "";
                            }
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg border border-indigo-200 cursor-pointer"
                        >
                          + Add GSM
                        </button>
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
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer select-none ${
                                  isSelected
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
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Printing parameters
                </h4>
                <div>
                  <label className="text-[10px] text-slate-500 font-bold uppercase">
                    Printing Cost per Sq. Inch (Rs.)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    className="w-full px-3 py-2 border rounded-xl text-sm mt-1 max-w-xs"
                    value={pricingForm.costPerSqIn}
                    onChange={(e) =>
                      setPricingForm((prev) => ({
                        ...prev,
                        costPerSqIn: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Volume Discount */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Volume Discounts & threshold
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase">
                      Quantity Threshold
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border rounded-xl text-sm mt-1"
                      value={pricingForm.volumeDiscount.thresholdQty}
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
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-bold uppercase">
                      Discount percentage (%)
                    </label>
                    <input
                      type="number"
                      max="100"
                      className="w-full px-3 py-2 border rounded-xl text-sm mt-1"
                      value={pricingForm.volumeDiscount.discountPercentage}
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
                  const firstGsm = defaultStyle?.gsmPrices?.[0]?.gsm || defaultStyle?.gsms?.[0] || "180GSM";
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
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md ring-2 ring-slate-900/10"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60"
                    }`}
                  >
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
                                  {item.material || "180GSM"}
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
                    type: "Crew Neck",
                    gsmPrices: [
                      { gsm: "180GSM", price: 1200 },
                      { gsm: "220GSM", price: 1500 },
                    ],
                    colors: [
                      { name: "White", value: "#ffffff" },
                      { name: "Black", value: "#111827" },
                    ],
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
                <p className="text-sm text-slate-500 font-semibold">
                  No T-Shirt styles configured.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {styles.map((style) => (
                  <div
                    key={style._id}
                    className="border rounded-2xl p-5 hover:shadow-md transition bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b pb-3 mb-3">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-base">
                            {style.name || style.type || "Crew Neck"}
                          </h4>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono break-all mb-3.5">
                        Model Path:{" "}
                        <span className="text-slate-600 font-semibold">
                          {style.path}
                        </span>
                      </p>
                      <div className="mb-3.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1.5">
                          Weights & Pricing
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {(style.gsmPrices && style.gsmPrices.length > 0
                            ? style.gsmPrices
                            : (style.gsms || []).map((g) => ({
                                gsm: g,
                                price: style.price || 1200,
                              }))
                          ).map((gp, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center text-[11px] font-semibold text-slate-700 bg-white border px-2.5 py-1.5 rounded-xl shadow-2xs"
                            >
                              <span>{gp.gsm}</span>
                              <span className="text-indigo-650 font-bold">
                                Rs. {(gp.price || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mb-3.5">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase mb-1">
                          Colors ({style.colors?.length || 0})
                        </span>
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
                            type: style.type || "Crew Neck",
                            gsmPrices:
                              style.gsmPrices && style.gsmPrices.length > 0
                                ? style.gsmPrices
                                : (style.gsms || []).map((g) => ({
                                    gsm: g,
                                    price: style.price || 1200,
                                  })),
                            colors: style.colors || [],
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
                    className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border transition shadow-xs ${
                      submissionSide === side
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
                  onSelectLayer={() => {}}
                  onUpdateLayers={() => {}}
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
              <div className="mt-8 pt-4 border-t flex flex-col gap-2">
                <button
                  onClick={() => {
                    handleApproveProductDraft(
                      selectedSubmissionProduct._id,
                      "approve",
                    );
                    setSelectedSubmissionProduct(null);
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Approve & Publish to Store</span>
                </button>
                <button
                  onClick={() => {
                    handleApproveProductDraft(
                      selectedSubmissionProduct._id,
                      "reject",
                    );
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
                {editingStyle
                  ? `Edit Style: ${editingStyle.name}`
                  : "Add New T-Shirt Style"}
              </h3>
              <button
                onClick={() => {
                  setShowStyleModal(false);
                  setEditingStyle(null);
                }}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveStyle}
              className="p-6 space-y-4 overflow-y-auto flex-1"
            >
              {stylesError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-xs font-semibold">
                  {stylesError}
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
                  T-Shirt Type
                </label>
                <input
                  type="text"
                  required
                  value={styleForm.name}
                  onChange={(e) =>
                    setStyleForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                      type: e.target.value,
                    }))
                  }
                  placeholder="e.g. Crew Neck, V-Neck, Polo, Oversized, Hoodie"
                  className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs focus:outline-indigo-500 font-semibold"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 self-center">Quick Select:</span>
                  {["Crew Neck", "V-Neck", "Polo", "Oversized", "Hoodie", "Long Sleeve", "Tank Top"].map((tType) => (
                    <button
                      key={tType}
                      type="button"
                      onClick={() =>
                        setStyleForm((prev) => ({
                          ...prev,
                          name: tType,
                          type: tType,
                        }))
                      }
                      className={`px-2.5 py-1 border rounded-lg text-[9px] font-bold transition cursor-pointer ${
                        styleForm.name === tType
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border-slate-200 text-slate-600"
                      }`}
                    >
                      {tType}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider">
                    3D GLTF Model File Path
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={styleForm.path}
                  onChange={(e) =>
                    setStyleForm((prev) => ({ ...prev, path: e.target.value }))
                  }
                  placeholder="e.g. /images/models/male normal t-shirt1.glb"
                  className="mt-1.5 w-full px-3.5 py-2.5 border rounded-xl text-xs font-semibold focus:outline-indigo-500 font-mono"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-[9px] font-bold text-slate-400 self-center">Presets:</span>
                  {[
                    { label: "Male Normal", path: "/images/models/male normal t-shirt1.glb", defaultType: "Crew Neck" },
                    { label: "Female Normal", path: "/images/models/female normal t-shirt.glb", defaultType: "Crew Neck" },
                    { label: "Long Sleeve", path: "/images/models/long_sleeve_t-_shirt.glb", defaultType: "Long Sleeve" },
                    { label: "Oversized", path: "/images/models/oversized t-sdirt1.glb", defaultType: "Oversized" },
                    { label: "Hoodie", path: "/images/models/t_shirt_hoodie.glb", defaultType: "Hoodie" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setStyleForm((prev) => ({
                          ...prev,
                          path: preset.path,
                          type: prev.type || preset.defaultType,
                        }))
                      }
                      className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border rounded-lg text-[9px] font-bold transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider block mb-2">
                  Configure GSM Weights & Prices
                </label>

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
                      if (!newGsmName.trim())
                        return alert("Please type a GSM name.");
                      if (!newGsmPrice) return alert("Please type a price.");
                      setStyleForm((prev) => ({
                        ...prev,
                        gsmPrices: [
                          ...prev.gsmPrices.filter(
                            (gp) =>
                              gp.gsm.toLowerCase() !==
                              newGsmName.trim().toLowerCase(),
                          ),
                          {
                            gsm: newGsmName.trim(),
                            price: Number(newGsmPrice),
                          },
                        ],
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
                    <p className="text-[10px] text-slate-400 font-semibold p-2">
                      No GSM prices added yet.
                    </p>
                  ) : (
                    styleForm.gsmPrices.map((gp, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between bg-white border rounded-xl px-3 py-1.5 text-xs shadow-2xs"
                      >
                        <span className="font-semibold text-slate-700">
                          {gp.gsm}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-slate-900">
                            Rs. {gp.price.toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setStyleForm((prev) => ({
                                ...prev,
                                gsmPrices: prev.gsmPrices.filter(
                                  (_, idx) => idx !== i,
                                ),
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
                <label className="text-[10px] font-black uppercase text-slate-450 tracking-wider block mb-2">
                  Configure Allowed Brand Colors
                </label>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Color name (e.g. Royal Blue)"
                    value={newColor.name}
                    onChange={(e) =>
                      setNewColor((prev) => ({ ...prev, name: e.target.value }))
                    }
                    className="flex-1 px-3 py-2 border rounded-xl text-xs font-semibold"
                  />
                  <input
                    type="color"
                    value={newColor.value}
                    onChange={(e) =>
                      setNewColor((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    className="h-8 w-12 p-0.5 border rounded-xl cursor-pointer bg-white shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newColor.name.trim())
                        return alert("Please type a color name.");
                      setStyleForm((prev) => ({
                        ...prev,
                        colors: [
                          ...prev.colors,
                          { name: newColor.name.trim(), value: newColor.value },
                        ],
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
                    <p className="text-[10px] text-slate-400 font-semibold p-2">
                      No colors added yet.
                    </p>
                  ) : (
                    styleForm.colors.map((color, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-1.5 bg-white border rounded-full px-2.5 py-1 text-xs shadow-2xs"
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full border border-slate-200"
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="font-semibold text-slate-700">
                          {color.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setStyleForm((prev) => ({
                              ...prev,
                              colors: prev.colors.filter((_, idx) => idx !== i),
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
                  onClick={() => {
                    setShowStyleModal(false);
                    setEditingStyle(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stylesLoading}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {stylesLoading && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {editingStyle ? "Save Changes" : "Create Style"}
                </button>
              </div>
            </form>
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
                        const firstGsm = matchStyle?.gsmPrices?.[0]?.gsm || matchStyle?.gsms?.[0] || "180GSM";
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
                          ? curStyle.gsmPrices.map((gp) => gp.gsm)
                          : (curStyle?.gsms && curStyle.gsms.length > 0 ? curStyle.gsms : ["180GSM", "200GSM", "220GSM", "240GSM"]);

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
