import { useState, useEffect, useRef } from "react";
import Scene from "../three/Scene";
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { resolveColorName, formatGsm } from "../utils/colorHelper";
import {
  Layers,
  Type,
  Upload,
  Sparkles,
  RotateCcw,
  Trash2,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Save,
  ShoppingBag,
  Sliders,
  X,
  Copy,
  FolderHeart,
  Palette,
  ZoomIn,
  Move,
  RotateCw,
  Scale,
  Maximize2,
  AlertCircle,
  CheckCircle,
  LogIn,
  LogOut,
  FlipHorizontal,
  FlipVertical,
  Undo2,
  Redo2
} from "lucide-react";

const shirtColors = [
  { name: "White", value: "#ffffff" },
  { name: "Black", value: "#111827" },
  { name: "Charcoal", value: "#4b5563" },
  { name: "Navy Blue", value: "#1e3a8a" },
  { name: "Red", value: "#dc2626" },
  { name: "Gold", value: "#fbbf24" },
  { name: "Green", value: "#16a34a" },
  { name: "Violet", value: "#6d28d9" },
  { name: "Pink", value: "#f472b6" },
  { name: "Beige", value: "#f5f5dc" },
  { name: "Light Grey", value: "#e5e7eb" },
  { name: "Light Blue", value: "#93c5fd" },
  { name: "Brown", value: "#78350f" }
];

const fontFamilies = [
  "Outfit",
  "Inter",
  "Roboto",
  "Playfair Display",
  "Cinzel",
  "Pacifico",
  "Montserrat"
];

const presetLogos = [
  { name: "PrintSphere Brand", url: "/logos/Logo.png" },
  { name: "Logo 1", url: "/logos/logo1.jpeg" },
  { name: "Logo 2", url: "/logos/logo2.jpeg" },
  { name: "Logo 3", url: "/logos/logo3.jpeg" }
];

const tShirtModels = [
  {
    name: "Men's T-Shirt",
    path: "/images/models/male normal t-shirt1.glb",
    type: "Crew Neck",
    gsmPrices: [
      { gsm: "GSM 180", price: 1200.00 },
      { gsm: "GSM 220", price: 1500.00 },
      { gsm: "GSM 280", price: 1800.00 },
      { gsm: "GSM 320", price: 2000.00 }
    ]
  },
  {
    name: "Women's T-Shirt",
    path: "/images/models/female normal t-shirt.glb",
    type: "V-Neck",
    gsmPrices: [
      { gsm: "GSM 180", price: 1400.00 },
      { gsm: "GSM 220", price: 1700.00 },
      { gsm: "GSM 280", price: 1900.00 },
      { gsm: "GSM 320", price: 2200.00 }
    ]
  },
  {
    name: "Long Sleeve Shirt",
    path: "/images/models/long_sleeve_t-_shirt.glb",
    type: "Crew Neck",
    gsmPrices: [
      { gsm: "GSM 180", price: 1800.00 },
      { gsm: "GSM 220", price: 2100.00 }
    ]
  },
  {
    name: "Oversized T-Shirt",
    path: "/images/models/oversized t-sdirt1.glb",
    type: "Crew Neck",
    gsmPrices: [
      { gsm: "GSM 180", price: 1500.00 },
      { gsm: "GSM 220", price: 1800.00 }
    ]
  },
  {
    name: "Hoodie",
    path: "/images/models/t_shirt_hoodie.glb",
    type: "Polo",
    gsmPrices: [
      { gsm: "GSM 180", price: 2500.00 },
      { gsm: "GSM 220", price: 2800.00 }
    ]
  }
];

export default function DesignerPage() {
  const [activeMenu, setActiveMenu] = useState("3d-designer");

  const [isEmployee, setIsEmployee] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitForm, setSubmitForm] = useState({
    title: "",
    description: "",
    category: "",
    basePrice: 1200
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  const [availableStyles, setAvailableStyles] = useState(tShirtModels);
  const [showCartRedirectModal, setShowCartRedirectModal] = useState(false);
  const [addedItemDetails, setAddedItemDetails] = useState({ name: "", size: "" });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        if (user.role === "Employee") {
          setIsEmployee(true);
        } else if (user.role === "Manager" || user.role === "Admin") {
          setIsManager(true);
        }
      } catch (err) {
        console.error("Parse user error:", err);
      }
    }

    const loadAndFetch = async () => {
      let stylesList = tShirtModels;
      try {
        const [stylesRes, pricingRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/auth/tshirt-styles`),
          axios.get(`${API_BASE_URL}/auth/pricing-rules`)
        ]);
        if (stylesRes.data) {
          setAvailableStyles(stylesRes.data);
          stylesList = stylesRes.data;
        }
        if (pricingRes.data) {
          setPricingRules({
            baseCrewNeck: pricingRes.data.baseRates?.crewNeck ?? 12.00,
            baseVNeck: pricingRes.data.baseRates?.vNeck ?? 14.00,
            basePolo: pricingRes.data.baseRates?.polo ?? 18.00,
            premiumPolyester: pricingRes.data.materialPremiums?.polyester ?? 1.50,
            premiumOrganic: pricingRes.data.materialPremiums?.organicCotton ?? 3.00,
            costPerSqIn: pricingRes.data.costPerSqIn ?? 0.02,
            complexityFeePerLayer: pricingRes.data.complexityFeePerLayer ?? 1.00,
            volumeDiscountThreshold: pricingRes.data.volumeDiscount?.thresholdQty ?? 5,
            volumeDiscountPercentage: pricingRes.data.volumeDiscount?.discountPercentage ?? 10
          });
        }
      } catch (err) {
        console.error("Failed to fetch customizer config:", err);
      }

      // Pre-load custom design draft if flagged by My Designs page
      const designToLoad = localStorage.getItem("load_custom_design");
      if (designToLoad) {
        try {
          const design = JSON.parse(designToLoad);
          if (design.layers && Array.isArray(design.layers)) {
            const normalizedLayers = design.layers.map((l) => ({
              ...l,
              visible: l.visible !== undefined ? Boolean(l.visible) : true,
              locked: l.locked !== undefined ? Boolean(l.locked) : false,
              flipX: Boolean(l.flipX),
              flipY: Boolean(l.flipY),
              position: Array.isArray(l.position) ? l.position : [0, 0, 0],
              rotation: Array.isArray(l.rotation) ? l.rotation : [0, 0, 0],
              scale: Array.isArray(l.scale) ? l.scale : [0.3, 0.3, 0.25]
            }));
            setLayers(normalizedLayers);
          }
          if (design.fabricColor) setShirtColor(design.fabricColor);
          if (design.tShirtType) {
            const model = stylesList.find(m => m.name === design.tShirtType) ||
              stylesList.find(m => m.name.toLowerCase().includes(design.tShirtType.toLowerCase()));
            if (model) {
              setSelectedModel(model);
              setShirtType(model.type);
            }
          }
          if (design.size) setSelectedSize(design.size);
          localStorage.removeItem("load_custom_design");
        } catch (err) {
          console.error("Error loading design:", err);
        }
      } else {
        const defaultModel = stylesList && stylesList.length > 0 ? stylesList[0] : null;
        if (defaultModel) {
          setSelectedModel(defaultModel);
          setShirtType(defaultModel.type);
          if (defaultModel.colors && defaultModel.colors.length > 0) {
            setShirtColor(defaultModel.colors[0].value);
          }
          const defaultGSMs = defaultModel.gsmPrices && defaultModel.gsmPrices.length > 0
            ? defaultModel.gsmPrices.map(gp => gp.gsm)
            : (defaultModel.gsms || []);
          if (defaultGSMs.length > 0) {
            setShirtMaterial(defaultGSMs[0]);
          }
        } else {
          setSelectedModel(null);
          setShirtType("Crew Neck");
          setShirtColor("#ffffff");
        }
      }
    };

    loadAndFetch();
  }, []);

  const generateDesignThumbnail = (layerList) => {
    const visibleLayers = (layerList || []).filter(l => l.visible !== false);
    const imgLayer = visibleLayers.find(l => (l.type === "image" || l.type === "logo") && l.url && l.url !== "/images/dumyImage.png");
    if (imgLayer) return imgLayer.url;

    const textLayer = visibleLayers.find(l => l.type === "text" && l.text);
    if (textLayer) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, 512, 256);
          const fontStyle = [
            textLayer.italic ? "italic" : "",
            textLayer.bold ? "bold" : "",
            "44px",
            `"${textLayer.fontFamily || "Inter"}", sans-serif`
          ].filter(Boolean).join(" ");
          ctx.font = fontStyle;
          ctx.fillStyle = textLayer.color || "#1e293b";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(textLayer.text, 256, 128);
          return canvas.toDataURL("image/png");
        }
      } catch (err) {
        console.error("Error creating text thumbnail:", err);
      }
    }
    return "/images/dumyImage.png";
  };

  const handleSubmitDesignConcept = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setSubmitLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      setSubmitError("No token, authorization denied");
      setSubmitLoading(false);
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    const thumb = generateDesignThumbnail(layers);

    const payload = {
      title: submitForm.title,
      description: submitForm.description,
      category: submitForm.category,
      basePrice: submitForm.basePrice,
      sizes: [selectedSize],
      colors: [shirtColor],
      images: [thumb],
      modelPath: selectedModel?.path || "/images/models/male normal t-shirt1.glb",
      defaultColor: shirtColor,
      layers: layers
    };

    if (isManager) {
      payload.status = "Active";
      payload.isApproved = true;
    }

    try {
      const endpoint = isManager
        ? `${API_BASE_URL}/manager/products`
        : `${API_BASE_URL}/employee/products`;

      await axios.post(endpoint, payload, { headers });

      if (isManager) {
        setSubmitSuccess("Design published directly to catalog successfully!");
        setTimeout(() => {
          window.location.href = "/manager";
        }, 1500);
      } else {
        setSubmitSuccess("Design concept sent to manager successfully!");
        setTimeout(() => {
          window.location.href = "/employee";
        }, 1500);
      }
    } catch (err) {
      console.error("Submit design concept error:", err);
      setSubmitError(err.response?.data?.message || "Failed to submit design concept");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveCustomerDesign = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please log in to save your design to your account.");
      return;
    }
    const headers = { Authorization: `Bearer ${token}` };
    const thumbnailUrl = generateDesignThumbnail(layers);

    const payload = {
      tShirtType: selectedModel?.name || "Crew Neck T-Shirt",
      fabricColor: shirtColor,
      material: shirtMaterial,
      size: selectedSize,
      layers: layers,
      estimatedCost: unitPrice,
      thumbnailUrl: thumbnailUrl
    };

    try {
      await axios.post(`${API_BASE_URL}/auth/designs`, payload, { headers });
      alert("Design saved successfully to your account!");
    } catch (err) {
      console.error("Save customer design error:", err);
      alert(err.response?.data?.message || "Failed to save design. Please try again.");
    }
  };

  const [leftTab, setLeftTab] = useState("edit");
  const [rightTab, setRightTab] = useState("layers");
  const [shirtColor, setShirtColor] = useState("#ffffff");
  const [selectedModel, setSelectedModel] = useState(tShirtModels[0]);
  const [selectedSize, setSelectedSize] = useState("M");
  const [shirtType, setShirtType] = useState("Crew Neck");
  const [shirtMaterial, setShirtMaterial] = useState("GSM 180");
  const [activeView, setActiveView] = useState("front");
  const [modelRotation, setModelRotation] = useState(0); // in radians
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [showManagerSettings, setShowManagerSettings] = useState(false);
  const [pricingRules, setPricingRules] = useState({
    baseCrewNeck: 12.00,
    baseVNeck: 14.00,
    basePolo: 18.00,
    premiumPolyester: 1.50,
    premiumOrganic: 3.00,
    costPerSqIn: 0.02,
    complexityFeePerLayer: 1.00,
    volumeDiscountThreshold: 5,
    volumeDiscountPercentage: 10
  });

  const [layers, setLayers] = useState([]);
  const [userImages, setUserImages] = useState([]);

  const saveUserImagesToStorage = (imagesList, user = currentUser) => {
    const userId = user?.id || user?._id || "guest";
    const storageKey = `printsphere_user_images_${userId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(imagesList));
    } catch (err) {
      console.error("Error saving user images to localStorage:", err);
    }
  };

  useEffect(() => {
    const userId = currentUser?.id || currentUser?._id || "guest";
    const storageKey = `printsphere_user_images_${userId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setUserImages(JSON.parse(saved));
      } catch (err) {
        console.error("Error parsing saved user images:", err);
      }
    } else {
      setUserImages([]);
    }
  }, [currentUser]);


  // --- Undo / Redo History State ---
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingRedoingRef = useRef(false);
  const debounceTimerRef = useRef(null);
  const isInitializedRef = useRef(false);

  const historyRef = useRef(history);
  historyRef.current = history;
  const historyIndexRef = useRef(historyIndex);
  historyIndexRef.current = historyIndex;

  const saveSnapshot = (instant = false) => {
    if (isUndoingRedoingRef.current) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const commit = () => {
      if (isUndoingRedoingRef.current) return;
      const snap = {
        layers: JSON.parse(JSON.stringify(layers)),
        shirtColor,
        selectedModelPath: selectedModel?.path || null,
        shirtMaterial,
        selectedSize
      };

      const currIdx = historyIndexRef.current;
      const currList = historyRef.current;
      const currentSnap = currList[currIdx];

      if (currentSnap && JSON.stringify(currentSnap) === JSON.stringify(snap)) {
        return;
      }

      const nextList = currList.slice(0, currIdx + 1);
      nextList.push(snap);
      if (nextList.length > 50) nextList.shift();

      const nextIdx = nextList.length - 1;
      setHistory(nextList);
      setHistoryIndex(nextIdx);
    };

    if (instant) {
      commit();
    } else {
      debounceTimerRef.current = setTimeout(commit, 300);
    }
  };

  useEffect(() => {
    if (!isInitializedRef.current) {
      if (selectedModel) {
        isInitializedRef.current = true;
        saveSnapshot(true);
      }
      return;
    }
    saveSnapshot(false);
  }, [layers, shirtColor, selectedModel?.path, shirtMaterial, selectedSize]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleUndo = () => {
    if (!canUndo) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const targetIdx = historyIndex - 1;
    const targetSnap = history[targetIdx];
    if (!targetSnap) return;

    isUndoingRedoingRef.current = true;

    setLayers(targetSnap.layers);
    setShirtColor(targetSnap.shirtColor);
    if (targetSnap.selectedModelPath) {
      const model = availableStyles.find(m => m.path === targetSnap.selectedModelPath);
      if (model) {
        setSelectedModel(model);
        setShirtType(model.type);
      }
    }
    setShirtMaterial(targetSnap.shirtMaterial);
    setSelectedSize(targetSnap.selectedSize);

    setHistoryIndex(targetIdx);

    setTimeout(() => {
      isUndoingRedoingRef.current = false;
    }, 100);
  };

  const handleRedo = () => {
    if (!canRedo) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    const targetIdx = historyIndex + 1;
    const targetSnap = history[targetIdx];
    if (!targetSnap) return;

    isUndoingRedoingRef.current = true;

    setLayers(targetSnap.layers);
    setShirtColor(targetSnap.shirtColor);
    if (targetSnap.selectedModelPath) {
      const model = availableStyles.find(m => m.path === targetSnap.selectedModelPath);
      if (model) {
        setSelectedModel(model);
        setShirtType(model.type);
      }
    }
    setShirtMaterial(targetSnap.shirtMaterial);
    setSelectedSize(targetSnap.selectedSize);

    setHistoryIndex(targetIdx);

    setTimeout(() => {
      isUndoingRedoingRef.current = false;
    }, 100);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || document.activeElement?.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history]);
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const selectLayer = (id) => {
    setSelectedLayerId(id);
    setRightTab("properties");
  };

  const activeLayer = layers.find((l) => l.id === selectedLayerId);

  const getInitialPositionAndRotation = () => {
    const theta = -modelRotation;
    const x = 0.16 * Math.sin(theta);
    const z = 0.16 * Math.cos(theta);
    return {
      position: [x, 0, z],
      rotation: [0, theta, 0]
    };
  };

  const addTextLayer = () => {
    const id = `text-${Date.now()}`;
    const { position, rotation } = getInitialPositionAndRotation();
    const newLayer = {
      id,
      type: "text",
      name: "New Text",
      text: "Edit Me",
      fontFamily: "Inter",
      color: "#2563eb",
      bold: false,
      italic: false,
      visible: true,
      locked: false,
      position,
      rotation,
      scale: [0.3, 0.1, 0.25]
    };
    setLayers([...layers, newLayer]);
    selectLayer(id);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      if (!dataUrl) return;

      const imageName = file.name.substring(0, 15);
      const newImportedImg = {
        id: `user-img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: imageName,
        url: dataUrl,
        timestamp: Date.now()
      };

      setUserImages((prev) => {
        const filtered = prev.filter((img) => img.url !== dataUrl);
        const updated = [newImportedImg, ...filtered];
        saveUserImagesToStorage(updated);
        return updated;
      });

      const img = new Image();
      img.onload = () => {
        const aspect = (img.width && img.height) ? (img.width / img.height) : 1;
        const scaleX = 0.3;
        const scaleY = 0.3 / (aspect || 1);

        const id = `img-${Date.now()}`;
        const { position, rotation } = getInitialPositionAndRotation();
        const newLayer = {
          id,
          type: "image",
          name: imageName,
          url: dataUrl,
          visible: true,
          locked: false,
          position,
          rotation,
          scale: [scaleX, scaleY, 0.25],
          aspectRatio: aspect
        };
        setLayers((prev) => [...prev, newLayer]);
        selectLayer(id);
      };
      img.onerror = (err) => {
        console.error("Error loading uploaded image dimensions:", err);
        const id = `img-${Date.now()}`;
        const { position, rotation } = getInitialPositionAndRotation();
        const newLayer = {
          id,
          type: "image",
          name: imageName,
          url: dataUrl,
          visible: true,
          locked: false,
          position,
          rotation,
          scale: [0.3, 0.3, 0.25],
          aspectRatio: 1
        };
        setLayers((prev) => [...prev, newLayer]);
        selectLayer(id);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset input so same image can be re-uploaded if desired
  };

  const handleRemoveUserImage = (imageId) => {
    setUserImages((prev) => {
      const updated = prev.filter((img) => img.id !== imageId);
      saveUserImagesToStorage(updated);
      return updated;
    });
  };

  const handleClearAllUserImages = () => {
    if (window.confirm("Are you sure you want to clear all uploaded images from your library?")) {
      setUserImages([]);
      const userId = currentUser?.id || currentUser?._id || "guest";
      const storageKey = `printsphere_user_images_${userId}`;
      localStorage.removeItem(storageKey);
    }
  };

  const addPresetImage = (url, name) => {
    const img = new Image();
    img.onload = () => {
      const aspect = (img.width && img.height) ? (img.width / img.height) : 1;
      const scaleX = 0.3;
      const scaleY = 0.3 / (aspect || 1);

      const id = `img-${Date.now()}`;
      const { position, rotation } = getInitialPositionAndRotation();
      const newLayer = {
        id,
        type: "image",
        name,
        url,
        visible: true,
        locked: false,
        position,
        rotation,
        scale: [scaleX, scaleY, 0.25],
        aspectRatio: aspect
      };
      setLayers((prev) => [...prev, newLayer]);
      selectLayer(id);
    };
    img.onerror = (err) => {
      console.error("Error loading preset image dimensions:", url, err);
      const id = `img-${Date.now()}`;
      const { position, rotation } = getInitialPositionAndRotation();
      const newLayer = {
        id,
        type: "image",
        name,
        url,
        visible: true,
        locked: false,
        position,
        rotation,
        scale: [0.3, 0.3, 0.25],
        aspectRatio: 1
      };
      setLayers((prev) => [...prev, newLayer]);
      selectLayer(id);
    };
    img.src = url;
  };

  const updateActiveViewFromAngle = (rad) => {
    let angle = rad % (2 * Math.PI);
    if (angle > Math.PI) angle -= 2 * Math.PI;
    if (angle < -Math.PI) angle += 2 * Math.PI;

    const diffFront = Math.abs(angle);
    const diffBack = Math.min(Math.abs(angle - Math.PI), Math.abs(angle + Math.PI));
    const diffLeft = Math.abs(angle - Math.PI / 2);
    const diffRight = Math.abs(angle + Math.PI / 2);

    const minDiff = Math.min(diffFront, diffBack, diffLeft, diffRight);
    if (minDiff === diffFront) setActiveView("front");
    else if (minDiff === diffBack) setActiveView("back");
    else if (minDiff === diffLeft) setActiveView("left");
    else if (minDiff === diffRight) setActiveView("right");
  };

  const deleteLayer = (id) => {
    setLayers(prev => prev.filter((l) => l.id !== id));
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
      setRightTab("layers");
    }
  };

  const updateActiveLayer = (field, value) => {
    if (!selectedLayerId) return;
    setLayers(prev =>
      prev.map((l) => {
        if (l.id === selectedLayerId) {
          return { ...l, [field]: value };
        }
        return l;
      })
    );
  };

  const updateActiveLayerPosition = (axis, value) => {
    if (!selectedLayerId) return;
    setLayers(prev =>
      prev.map((l) => {
        if (l.id === selectedLayerId) {
          const newPos = [...l.position];
          newPos[axis] = value;
          return { ...l, position: newPos };
        }
        return l;
      })
    );
  };

  const toggleLayerVisibility = (id) => {
    setLayers(prev =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  };

  const toggleLayerLock = (id) => {
    setLayers(prev =>
      prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l))
    );
  };

  const duplicateLayer = (layer) => {
    const id = `${layer.type}-${Date.now()}`;
    const duplicated = {
      ...layer,
      id,
      name: `${layer.name} (Copy)`,
      position: [layer.position[0] + 0.05, layer.position[1] - 0.05, layer.position[2]]
    };
    setLayers(prev => [...prev, duplicated]);
    selectLayer(id);
  };

  const getLayerPrintArea = (layer) => {
    if (!layer.visible) return 0;
    const widthInches = layer.scale[0] * 25;
    const heightInches = layer.scale[1] * 25;
    return widthInches * heightInches;
  };

  const totalPrintArea = layers.reduce((acc, curr) => acc + getLayerPrintArea(curr), 0);
  const printableAreaLimit = 12 * 16;
  const coveragePercentage = Math.min(100, (totalPrintArea / printableAreaLimit) * 100);

  const visibleLayersCount = layers.filter((l) => l.visible).length;
  let designComplexity = "Low";
  if (visibleLayersCount >= 4) {
    designComplexity = "High";
  } else if (visibleLayersCount >= 2) {
    designComplexity = "Medium";
  }

  const getGSMDetails = (gsmName) => {
    if (!gsmName) return { premium: 0.00, label: "Base" };
    const cleanGsm = formatGsm(gsmName);
    if (cleanGsm.includes("180")) return { premium: 0.00, label: "Base" };
    if (cleanGsm.includes("220")) return { premium: 3.00, label: "+Rs. 3.00" };
    if (cleanGsm.includes("280")) return { premium: 6.00, label: "+Rs. 6.00" };
    if (cleanGsm.includes("320")) return { premium: 10.00, label: "+Rs. 10.00" };
    return { premium: 0.00, label: "Base" };
  };

  const getBasePrice = () => {
    if (selectedModel?.gsmPrices && selectedModel.gsmPrices.length > 0) {
      const match = selectedModel.gsmPrices.find(
        (gp) => gp.gsm.replace(/\s+/g, "").toUpperCase() === shirtMaterial.replace(/\s+/g, "").toUpperCase()
      );
      if (match) return match.price;
      return selectedModel.gsmPrices[0].price;
    }

    let price = selectedModel?.price || 1200.00;
    const gsmDetails = getGSMDetails(shirtMaterial);
    price += gsmDetails.premium;
    return price;
  };

  const getPrintAreaCost = () => {
    return totalPrintArea * pricingRules.costPerSqIn;
  };

  const getComplexityCost = () => {
    return 0;
  };

  const getGsmPriceLabel = (gsmName) => {
    if (selectedModel?.gsmPrices && selectedModel.gsmPrices.length > 0) {
      const match = selectedModel.gsmPrices.find(
        (gp) => gp.gsm.replace(/\s+/g, "").toUpperCase() === gsmName.replace(/\s+/g, "").toUpperCase()
      );
      if (match) return `Rs. ${match.price.toFixed(2)}`;
    }
    const details = getGSMDetails(gsmName);
    const basePrice = selectedModel?.price || 1200.00;
    return `Rs. ${(basePrice + details.premium).toFixed(2)}`;
  };

  const unitPrice = getBasePrice() + getPrintAreaCost();

  const discountMultiplier = quantity >= pricingRules.volumeDiscountThreshold
    ? (100 - pricingRules.volumeDiscountPercentage) / 100
    : 1;

  const totalCost = unitPrice * quantity * discountMultiplier;

  return (
    <div className="h-screen w-full flex bg-[#f8fafc] font-sans overflow-hidden text-slate-800">

      <aside className="w-64 bg-slate-900 flex flex-col justify-between shrink-0 select-none text-slate-400">
        <div>
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
              P
            </div>
            <div>
              <h1 className="font-extrabold text-white text-lg tracking-wide leading-none">PrintSphere</h1>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">3D Customizer</span>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: Sparkles, path: "/customer-home" },
              { id: "store", label: "Store", icon: ShoppingBag, path: "/store" },
              { id: "3d-designer", label: "3D Designer", icon: Layers, path: "/designer" },
              { id: "my-orders", label: "My Orders", icon: FolderHeart, path: "/my-orders" },
              { id: "my-designs", label: "My Designs", icon: Palette, path: "/my-designs" }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = item.id === "3d-designer";
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.path) {
                      window.location.href = item.path;
                    }
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive
                      ? "bg-indigo-600 text-white shadow-[0_4px_14px_rgba(99,102,241,0.25)]"
                      : "hover:bg-slate-800 hover:text-slate-200"
                    }`}
                >
                  <Icon className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3">
          {currentUser ? (
            <div className="space-y-3">
              <div
                onClick={() => window.location.href = "/account"}
                className="flex items-center gap-3 px-2 py-1.5 cursor-pointer rounded-xl hover:bg-slate-800/40 transition group select-none"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"
                  alt="Avatar"
                  className="h-10 w-10 rounded-full ring-2 ring-indigo-500/20 object-cover group-hover:ring-indigo-500 transition duration-200"
                />
                <div className="leading-tight">
                  <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition duration-200">{currentUser.name}</p>
                  <span className="text-xs text-slate-500">{currentUser.role || "Customer"}</span>
                </div>
              </div>
              <div className="px-1.5">
                <button
                  onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("printsphere_cart");
                    window.location.href = "/login";
                  }}
                  className="w-full py-2 px-4 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/20 hover:border-transparent rounded-xl font-bold text-xs shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="px-1.5 pb-1">
              <button
                onClick={() => window.location.href = "/login?redirect=/designer"}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <LogIn className="h-4 w-4" />
                Login / Sign Up
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        <header className="h-16 border-b bg-white flex items-center justify-between px-8 select-none shrink-0 z-10">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="hover:text-indigo-600 cursor-pointer transition">Store</span>
            <span>/</span>
            <span className="text-slate-600 font-medium">3D Customizer</span>
          </div>

          <div className="flex items-center gap-6">

            <div className="flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-full text-indigo-700 font-bold text-xs">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span>Cart ({quantity})</span>
            </div>
            <button
              onClick={() => {
                if (isEmployee || isManager) {
                  setSubmitError("");
                  setSubmitSuccess("");
                  setSubmitForm({
                    title: "",
                    description: "",
                    category: selectedModel?.name || "",
                    basePrice: Math.round(unitPrice)
                  });
                  setShowSubmitModal(true);
                } else {
                  handleSaveCustomerDesign();
                }
              }}
              className="flex items-center gap-1.5 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-[0_4px_12px_rgba(99,102,241,0.25)] transition"
            >
              <Save className="h-4 w-4" />
              {isManager ? "Publish to Store" : isEmployee ? "Submit to Manager" : "Save Design"}
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">

          <aside className="w-80 border-r bg-white flex flex-col select-none shrink-0 overflow-y-auto">
            <div className="flex border-b text-center shrink-0">
              <button
                onClick={() => setLeftTab("edit")}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${leftTab === "edit"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
              >
                T-Shirt Style
              </button>
              <button
                onClick={() => setLeftTab("add")}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${leftTab === "add"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
              >
                Add Elements
              </button>
            </div>

            {leftTab === "add" && (
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Design Tools</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={addTextLayer}
                      className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/20 transition group"
                    >
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100/50 transition">
                        <Type className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="text-xs font-bold">Add Text</span>
                    </button>
                    <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/20 cursor-pointer transition group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-indigo-100/50 transition">
                        <Upload className="h-5 w-5 text-indigo-600" />
                      </div>
                      <span className="text-xs font-bold">Upload Image</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      My Uploaded Images ({userImages.length})
                    </h3>
                    {userImages.length > 0 && (
                      <button
                        onClick={handleClearAllUserImages}
                        className="text-[10px] text-rose-500 hover:text-rose-700 font-semibold transition cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  {userImages.length === 0 ? (
                    <div className="p-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                      <Upload className="h-5 w-5 text-slate-300 mx-auto mb-1" />
                      <p className="text-xs text-slate-400 font-medium">No uploaded images yet</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Use "Upload Image" above to import graphics into your library for easy reuse.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {userImages.map((img) => (
                        <div
                          key={img.id}
                          className="relative group p-2 border border-slate-200 rounded-xl hover:border-indigo-500 bg-white transition flex flex-col items-center gap-1.5 shadow-xs"
                        >
                          <button
                            onClick={() => addPresetImage(img.url, img.name)}
                            className="w-full flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
                            title="Click to add to T-shirt canvas"
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              className="h-14 w-full object-contain bg-slate-50 rounded-lg p-1 border border-slate-100"
                            />
                            <span className="text-[10px] font-bold text-center text-slate-700 line-clamp-1 w-full px-1">
                              {img.name}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveUserImage(img.id);
                            }}
                            className="absolute top-1 right-1 h-6 w-6 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white flex items-center justify-center transition opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                            title="Remove image from library"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Presets & Logos</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {presetLogos.map((logo) => (
                      <button
                        key={logo.name}
                        onClick={() => addPresetImage(logo.url, logo.name)}
                        className="p-2 border rounded-xl hover:border-indigo-500 hover:bg-slate-50 transition flex flex-col items-center gap-2 cursor-pointer"
                      >
                        <img src={logo.url} alt={logo.name} className="h-12 w-12 object-contain bg-slate-50 rounded p-1" />
                        <span className="text-[10px] font-bold text-center text-slate-500 line-clamp-1">{logo.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fabric Color</h3>
                  <div className="flex flex-wrap gap-2.5">
                    {(selectedModel?.colors && selectedModel.colors.length > 0 ? selectedModel.colors : shirtColors).map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setShirtColor(color.value)}
                        className={`h-7 w-7 rounded-full border-2 transition-transform ${shirtColor === color.value
                            ? "scale-125 border-indigo-600 shadow-lg"
                            : "border-slate-200 hover:scale-110"
                          }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {leftTab === "edit" && (
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">T-Shirt Style (3D Model)</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {availableStyles.map((model) => {
                      const isSelected = selectedModel?.path === model.path;
                      return (
                        <button
                          key={model.name}
                          onClick={() => {
                            setSelectedModel(model);
                            setShirtType(model.type);
                            if (model.colors && model.colors.length > 0) {
                              setShirtColor(model.colors[0].value);
                            }
                            const modelGSMs = model.gsmPrices && model.gsmPrices.length > 0
                              ? model.gsmPrices.map(gp => gp.gsm)
                              : (model.gsms || []);
                            if (modelGSMs.length > 0) {
                              setShirtMaterial(modelGSMs[0]);
                            }
                          }}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-left transition duration-200 ${isSelected
                              ? "border-indigo-600 bg-indigo-50/20 ring-1 ring-indigo-600 font-bold"
                              : "border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                            }`}
                        >
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl mb-2 transition ${isSelected ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-400"
                            }`}>
                            👕
                          </div>
                          <div className="flex flex-col items-center w-full">
                            <span className="text-[11px] font-bold text-slate-800 text-center leading-tight truncate w-full">{model.name}</span>
                            <span className="text-[9px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">{model.type}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Fabric GSM (Weight & Price)</h3>
                  {(selectedModel?.gsmPrices && selectedModel.gsmPrices.length > 0
                    ? selectedModel.gsmPrices.map(gp => gp.gsm)
                    : (selectedModel?.gsms || ["180GSM", "220 GSM", "280GSM", "320GSM"])
                  ).map((gsm) => {
                    const priceLabel = getGsmPriceLabel(gsm);
                    return (
                      <button
                        key={gsm}
                        onClick={() => setShirtMaterial(gsm)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-semibold transition ${shirtMaterial === gsm
                            ? "border-indigo-600 bg-indigo-50/20 text-indigo-700 font-bold"
                            : "border-slate-100 hover:bg-slate-50"
                          }`}
                      >
                        <span>{gsm}</span>
                        <span className="text-xs text-indigo-650 font-bold">{priceLabel}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Select Size</h3>
                  <div className="flex gap-2">
                    {["S", "M", "L", "XL", "XXL"].map((size) => {
                      const isSelected = selectedSize === size;
                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`flex-1 py-2 rounded-xl border text-xs font-extrabold transition ${isSelected
                              ? "border-indigo-600 bg-indigo-50/20 text-indigo-700"
                              : "border-slate-100 hover:bg-slate-50 text-slate-600"
                            }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}
          </aside>

          <main className="flex-1 flex flex-col justify-between p-8 relative overflow-hidden bg-gradient-to-tr from-slate-100 via-slate-50/30 to-indigo-50/20">

            <div className="absolute top-8 left-8 flex items-center gap-2 bg-white/80 backdrop-blur border p-1 rounded-xl shadow-sm z-10 select-none">
              {["front", "back", "left", "right"].map((view) => (
                <button
                  key={view}
                  onClick={() => {
                    setActiveView(view);
                    if (view === "front") setModelRotation(0);
                    else if (view === "back") setModelRotation(Math.PI);
                    else if (view === "left") setModelRotation(Math.PI / 2);
                    else if (view === "right") setModelRotation(-Math.PI / 2);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition ${activeView === view
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                    }`}
                >
                  {view}
                </button>
              ))}
            </div>

            {/* Canvas Quick Undo / Redo Controls */}
            <div className="absolute top-8 right-8 flex items-center gap-1 bg-white/80 backdrop-blur border p-1 rounded-xl shadow-sm z-10 select-none">
              <button
                onClick={handleUndo}
                disabled={!canUndo}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="h-4 w-4" />
              </button>
              <button
                onClick={handleRedo}
                disabled={!canRedo}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer disabled:cursor-not-allowed"
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 flex items-center justify-center min-h-0 relative">
              <Scene
                modelPath={selectedModel?.path || "/images/models/male normal t-shirt1.glb"}
                shirtColor={shirtColor}
                activeSide={activeView}
                zoomLevel={zoomLevel}
                layers={layers}
                selectedLayerId={selectedLayerId}
                onSelectLayer={selectLayer}
                onUpdateLayers={setLayers}
                onDeleteLayer={deleteLayer}
                modelRotation={modelRotation}
              />
            </div>

            <div className="flex flex-col gap-3 max-w-sm mx-auto w-full bg-white border p-4 rounded-2xl shadow-sm select-none z-10">
              {/* View Zoom Control */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span className="flex items-center gap-1">
                  <ZoomIn className="h-3.5 w-3.5" /> View Zoom
                </span>
                <span>{Math.round(zoomLevel * 100)}%</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.15))}
                  className="p-1 rounded-lg border hover:bg-slate-50 text-slate-600 font-bold"
                >
                  -
                </button>
                <input
                  type="range"
                  min="0.5"
                  max="2.5"
                  step="0.05"
                  value={zoomLevel}
                  onChange={(e) => setZoomLevel(Number(e.target.value))}
                  className="flex-1 accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                />
                <button
                  onClick={() => setZoomLevel(Math.min(2.5, zoomLevel + 0.15))}
                  className="p-1 rounded-lg border hover:bg-slate-50 text-slate-600 font-bold"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    setZoomLevel(0.85);
                    setActiveView("front");
                    setModelRotation(0);
                  }}
                  className="p-1 rounded-lg border hover:bg-slate-50 text-slate-500"
                  title="Reset View"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Model Rotation Control Panel */}
              <div className="border-t pt-2 mt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1.5">
                  <span className="flex items-center gap-1">
                    <RotateCw className="h-3.5 w-3.5" /> Model Rotation
                  </span>
                  <span>{Math.round((modelRotation * 180) / Math.PI)}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const newRot = modelRotation - (15 * Math.PI) / 180;
                      setModelRotation(newRot);
                      updateActiveViewFromAngle(newRot);
                    }}
                    className="p-1 rounded-lg border hover:bg-slate-50 text-slate-600 font-bold"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min="-180"
                    max="180"
                    step="5"
                    value={Math.round((modelRotation * 180) / Math.PI)}
                    onChange={(e) => {
                      const deg = Number(e.target.value);
                      const rad = (deg * Math.PI) / 180;
                      setModelRotation(rad);
                      updateActiveViewFromAngle(rad);
                    }}
                    className="flex-1 accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                  <button
                    onClick={() => {
                      const newRot = modelRotation + (15 * Math.PI) / 180;
                      setModelRotation(newRot);
                      updateActiveViewFromAngle(newRot);
                    }}
                    className="p-1 rounded-lg border hover:bg-slate-50 text-slate-600 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </main>

          <aside className="w-80 border-l bg-white flex flex-col select-none shrink-0 overflow-y-auto">
            <div className="flex border-b text-center shrink-0">
              <button
                onClick={() => setRightTab("layers")}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${rightTab === "layers"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
              >
                Layers
              </button>
              <button
                onClick={() => setRightTab("properties")}
                className={`flex-1 py-3 text-sm font-bold transition-all border-b-2 ${rightTab === "properties"
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                disabled={!selectedLayerId}
              >
                Properties
              </button>
            </div>

            {rightTab === "layers" && (
              <div className="p-5 flex-1 overflow-y-auto space-y-4">
                <div className="space-y-2">
                  {layers.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                      <p className="text-xs text-slate-400 font-medium">No design elements added yet.</p>
                      <p className="text-[10px] text-slate-300 mt-1">Use the tools panel on the left to add text or images.</p>
                    </div>
                  ) : (
                    layers.map((layer) => {
                      const isSelected = selectedLayerId === layer.id;
                      return (
                        <div
                          key={layer.id}
                          onClick={() => selectLayer(layer.id)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${isSelected
                              ? "border-indigo-500 bg-indigo-50/10 shadow-sm"
                              : "border-slate-100 hover:bg-slate-50"
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {layer.type === "text" ? (
                              <Type className="h-4 w-4 text-indigo-500 shrink-0" />
                            ) : (
                              <Upload className="h-4 w-4 text-teal-500 shrink-0" />
                            )}
                            <div className="leading-tight min-w-0">
                              <p className={`text-xs font-bold truncate ${isSelected ? "text-indigo-600" : ""}`}>
                                {layer.name}
                              </p>
                              <span className="text-[10px] text-slate-400 capitalize">{layer.type} Layer</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => toggleLayerVisibility(layer.id)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            >
                              {layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-rose-500" />}
                            </button>
                            <button
                              onClick={() => toggleLayerLock(layer.id)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                            >
                              {layer.locked ? <Lock className="h-3.5 w-3.5 text-amber-500" /> : <Unlock className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => duplicateLayer(layer)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                              title="Duplicate"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteLayer(layer.id)}
                              className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {rightTab === "properties" && activeLayer && (
              <div className="p-5 flex-1 overflow-y-auto space-y-5">
                <div className="flex items-center justify-between border-b pb-3 shrink-0">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Editing Layer</span>
                  <button onClick={() => setRightTab("layers")} className="p-1 rounded-lg hover:bg-slate-50">
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                </div>

                {activeLayer.type === "text" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Text Content</label>
                      <input
                        type="text"
                        value={activeLayer.text}
                        onChange={(e) => {
                          updateActiveLayer("text", e.target.value);
                          updateActiveLayer("name", e.target.value.substring(0, 15));
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500">Font Family</label>
                      <select
                        value={activeLayer.fontFamily}
                        onChange={(e) => updateActiveLayer("fontFamily", e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                      >
                        {fontFamilies.map((font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 block">Text Style & Color</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateActiveLayer("bold", !activeLayer.bold)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-bold ${activeLayer.bold ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "hover:bg-slate-50"
                            }`}
                        >
                          B
                        </button>
                        <button
                          onClick={() => updateActiveLayer("italic", !activeLayer.italic)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-bold italic ${activeLayer.italic ? "bg-indigo-50 text-indigo-600 border-indigo-200" : "hover:bg-slate-50"
                            }`}
                        >
                          I
                        </button>
                        <input
                          type="color"
                          value={activeLayer.color}
                          onChange={(e) => updateActiveLayer("color", e.target.value)}
                          className="w-12 h-9 border rounded-lg cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-3 border-t">
                  <label className="text-xs font-bold text-slate-500 block">Flip Operations</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateActiveLayer("flipX", !activeLayer.flipX)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
                        activeLayer.flipX
                          ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm font-extrabold"
                          : "hover:bg-slate-50 border-slate-200 text-slate-600 bg-white"
                      }`}
                    >
                      <FlipHorizontal className="h-4 w-4" />
                      Flip Horizontal
                    </button>
                    <button
                      onClick={() => updateActiveLayer("flipY", !activeLayer.flipY)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition duration-200 cursor-pointer ${
                        activeLayer.flipY
                          ? "bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm font-extrabold"
                          : "hover:bg-slate-50 border-slate-200 text-slate-600 bg-white"
                      }`}
                    >
                      <FlipVertical className="h-4 w-4" />
                      Flip Vertical
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-3 border-t">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">3D Decal Transforms</span>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" /> Decal Size</span>
                      <span>{Math.round(activeLayer.scale[0] * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.2"
                      step="0.02"
                      value={activeLayer.scale[0]}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        const aspect = activeLayer.aspectRatio || (activeLayer.scale[0] / activeLayer.scale[1]) || 1;
                        updateActiveLayer("scale", [val, val / aspect, activeLayer.scale[2]]);
                      }}
                      className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><Move className="h-3.5 w-3.5" /> Move Horizontal (X)</span>
                      <span>{activeLayer.position[0].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-0.6"
                      max="0.6"
                      step="0.01"
                      value={activeLayer.position[0]}
                      onChange={(e) => updateActiveLayerPosition(0, Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                      <span className="flex items-center gap-1"><Move className="h-3.5 w-3.5" /> Move Vertical (Y)</span>
                      <span>{activeLayer.position[1].toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-0.6"
                      max="0.6"
                      step="0.01"
                      value={activeLayer.position[1]}
                      onChange={(e) => updateActiveLayerPosition(1, Number(e.target.value))}
                      className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5">
                    {(() => {
                      const rad = activeLayer.rotation?.[2] || 0;
                      const rawDeg = Math.round((rad * 180) / Math.PI);
                      const currentDeg = ((((rawDeg + 180) % 360) + 360) % 360) - 180;
                      return (
                        <>
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                            <span className="flex items-center gap-1"><RotateCw className="h-3.5 w-3.5" /> Rotation</span>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="-180"
                                max="180"
                                value={currentDeg}
                                onChange={(e) => {
                                  let deg = Number(e.target.value);
                                  if (isNaN(deg)) deg = 0;
                                  if (deg < -180) deg = -180;
                                  if (deg > 180) deg = 180;
                                  const newRad = deg * (Math.PI / 180);
                                  updateActiveLayer("rotation", [activeLayer.rotation[0], activeLayer.rotation[1], newRad]);
                                }}
                                className="w-16 px-1.5 py-0.5 text-center text-xs font-bold border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-hidden bg-white text-slate-800"
                              />
                              <span>°</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            step="1"
                            value={currentDeg}
                            onChange={(e) => {
                              const deg = Number(e.target.value);
                              const newRad = deg * (Math.PI / 180);
                              updateActiveLayer("rotation", [activeLayer.rotation[0], activeLayer.rotation[1], newRad]);
                            }}
                            className="w-full accent-indigo-600 h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                          />
                          <div className="grid grid-cols-4 gap-1 pt-1">
                            {[-90, 0, 90, 180].map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => {
                                  const presetRad = preset * (Math.PI / 180);
                                  updateActiveLayer("rotation", [
                                    activeLayer.rotation[0],
                                    activeLayer.rotation[1],
                                    presetRad
                                  ]);
                                }}
                                className={`py-1 text-[10px] font-semibold rounded-md border transition-colors ${
                                  currentDeg === preset
                                    ? "bg-indigo-50 border-indigo-300 text-indigo-700 font-bold"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {preset > 0 ? `+${preset}°` : `${preset}°`}
                              </button>
                            ))}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 border-t bg-slate-50/50 space-y-4 shrink-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>Print Area (Estimated)</span>
                  <span>{totalPrintArea.toFixed(2)} in²</span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                    <span>Print Coverage</span>
                    <span>{coveragePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-300"
                      style={{ width: `${coveragePercentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500 pt-1">
                  <span>Design Complexity</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${designComplexity === "High"
                      ? "bg-rose-50 text-rose-600 ring-1 ring-rose-100"
                      : designComplexity === "Medium"
                        ? "bg-amber-50 text-amber-600 ring-1 ring-amber-100"
                        : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                    }`}>
                    {designComplexity}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t bg-white space-y-4 shrink-0">
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Base Price ({selectedModel?.name || shirtType})</span>
                  <span>Rs. {getBasePrice().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <span>Print Area ({totalPrintArea.toFixed(1)} in²)</span>
                  <span>Rs. {getPrintAreaCost().toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pt-1">
                  <span>Quantity</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-6 w-6 rounded border flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-700 w-4 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-6 w-6 rounded border flex items-center justify-center font-bold text-slate-600 hover:bg-slate-50"
                    >
                      +
                    </button>
                  </div>
                </div>

                {quantity >= pricingRules.volumeDiscountThreshold && (
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-600">
                    <span>Volume Discount ({pricingRules.volumeDiscountPercentage}%)</span>
                    <span>-Rs. {(unitPrice * quantity * (pricingRules.volumeDiscountPercentage / 100)).toFixed(2)}</span>
                  </div>
                )}

                <div className="border-t pt-3 flex items-baseline justify-between select-none">
                  <span className="text-sm font-extrabold text-slate-900">Total Price</span>
                  <div className="text-right">
                    <p className="text-xl font-black text-slate-900 leading-none">Rs. {totalCost.toFixed(2)}</p>
                    <span className="text-[10px] text-slate-400 font-medium">Rs. {unitPrice.toFixed(2)} each</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  const designId = `custom-${Date.now()}`;
                  const cartKey = `${designId}-${selectedSize}-${shirtColor}`;

                  const savedCart = localStorage.getItem("printsphere_cart");
                  let currentCart = [];
                  if (savedCart) {
                    try {
                      currentCart = JSON.parse(savedCart);
                    } catch (e) {
                      console.error(e);
                    }
                  }

                  const allModelColors = [
                    ...(selectedModel?.colors || []),
                    ...shirtColors
                  ];
                  const matchedColorObj = allModelColors.find(c => c.value && c.value.toLowerCase() === shirtColor.toLowerCase());
                  const resolvedColorNameStr = matchedColorObj ? matchedColorObj.name : resolveColorName(shirtColor);

                  const cartItem = {
                    cartKey,
                    designId: designId,
                    productId: null,
                    title: `${selectedModel?.name || shirtType} (Custom Design)`,
                    basePrice: unitPrice,
                    discount: 0,
                    category: "Customized",
                    size: selectedSize,
                    color: resolvedColorNameStr,
                    material: formatGsm(shirtMaterial),
                    gsm: formatGsm(shirtMaterial),
                    tShirtType: shirtType,
                    tShirtStyle: shirtType || selectedModel?.name || "Crew Neck",
                    quantity: quantity,
                    image: "/images/dumyImage.png",
                    isCustom: true,
                    layers: layers
                  };

                  localStorage.setItem("printsphere_cart", JSON.stringify([...currentCart, cartItem]));
                  setAddedItemDetails({
                    name: selectedModel?.name || shirtType,
                    size: selectedSize
                  });
                  setShowCartRedirectModal(true);
                }}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-[0_4px_14px_rgba(99,102,241,0.3)] transition-all flex flex-col items-center justify-center leading-tight"
              >
                <span className="text-[11px] uppercase tracking-widest text-indigo-100 font-black">Continue to Checkout</span>
                <span className="text-sm mt-0.5">Total: Rs. {totalCost.toFixed(2)}</span>
              </button>
            </div>
          </aside>

        </div>

      </div>

      {showManagerSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border">
            <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-300">Manager Admin Console</h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure automated cost formulas</p>
              </div>
              <button onClick={() => setShowManagerSettings(false)} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Cost Per Sq In (Rs)</label>
                <input
                  type="number"
                  step="0.005"
                  value={pricingRules.costPerSqIn}
                  onChange={(e) => setPricingRules({ ...pricingRules, costPerSqIn: Number(e.target.value) })}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>

              <div className="border-t pt-4 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Discount Threshold</label>
                  <input
                    type="number"
                    value={pricingRules.volumeDiscountThreshold}
                    onChange={(e) => setPricingRules({ ...pricingRules, volumeDiscountThreshold: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Volume Discount Percentage (%)</label>
                  <input
                    type="number"
                    value={pricingRules.volumeDiscountPercentage}
                    onChange={(e) => setPricingRules({ ...pricingRules, volumeDiscountPercentage: Number(e.target.value) })}
                    className="w-full p-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-2 border-t">
              <button
                onClick={() => setPricingRules({
                  ...pricingRules,
                  costPerSqIn: 0.02,
                  volumeDiscountThreshold: 5,
                  volumeDiscountPercentage: 10
                })}
                className="px-4 py-2 border rounded-xl text-xs font-semibold hover:bg-white transition"
              >
                Reset Default
              </button>
              <button
                onClick={() => setShowManagerSettings(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                Save & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Design Concept Modal for Employees/Managers */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm border shadow-2xl overflow-hidden select-none text-slate-800">
            <div className="bg-slate-950 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  {isManager ? "Publish Design to Store" : "Submit Design Concept"}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isManager ? "Add this pre-designed item directly to the catalog" : "Publish your design for Manager approval"}
                </p>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDesignConcept} className="p-5 space-y-4">
              {submitError && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              {submitSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{submitSuccess}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Design Title</label>
                <input
                  type="text"
                  required
                  value={submitForm.title}
                  onChange={(e) => setSubmitForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Vintage Sunset Polo"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Description</label>
                <textarea
                  required
                  value={submitForm.description}
                  onChange={(e) => setSubmitForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe details, graphic assets..."
                  className="w-full px-3 py-2 border rounded-xl text-sm h-16"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category</label>
                <select
                  required
                  value={submitForm.category}
                  onChange={(e) => setSubmitForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="" disabled>Select Category</option>
                  {availableStyles.map((style) => (
                    <option key={style.name} value={style.name}>
                      {style.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Proposed Price (Rs.)</label>
                <input
                  type="number"
                  step="1"
                  required
                  value={submitForm.basePrice}
                  onChange={(e) => setSubmitForm(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition"
                >
                  {submitLoading ? (isManager ? "Publishing..." : "Submitting...") : (isManager ? "Publish to Store" : "Submit to Manager")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Cart Redirect */}
      {showCartRedirectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-slate-100 p-6 flex flex-col items-center text-center">
            <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100">
              <CheckCircle className="h-9 w-9" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-950 mb-1">Added to Cart!</h3>
            <p className="text-sm text-slate-500 mb-6">
              <strong className="text-slate-800 font-semibold">{addedItemDetails.name} ({addedItemDetails.size})</strong> has been successfully added to your cart.
            </p>
            
            <p className="text-xs text-slate-500 mb-6 bg-slate-50 px-4 py-2.5 rounded-xl border border-slate-100 font-medium">
              Would you like to redirect to checkout now?
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => {
                  setShowCartRedirectModal(false);
                }}
                className="flex-1 py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  window.location.href = "/store";
                }}
                className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] focus:outline-none"
              >
                Go to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}