const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const PricingRules = require("../models/PricingRules");
const CustomizedDesign = require("../models/CustomizedDesign");
const TShirtStyle = require("../models/TShirtStyle");

// JWT Secret Key fallback
const JWT_SECRET = process.env.JWT_SECRET || "printsphere_jwt_secret_key_99";

// @desc    Register a new customer
// @route   POST /api/auth/register
exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please enter all required fields" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create Customer account
    const user = await User.create({
      name,
      email,
      passwordHash,
      phone,
      address,
      role: "Customer"
    });

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d"
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// @desc    Login user (Customer, Employee, Manager, Admin)
// @route   POST /api/auth/login
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d"
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// @desc    Change logged in user's password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }
    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Please provide current and new passwords" });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect current password" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error during password change" });
  }
};

// @desc    Get all active store products
// @route   GET /api/auth/products
exports.getStoreProducts = async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true, status: "Active" })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Fetch store products error:", error);
    res.status(500).json({ message: "Server error while fetching store products" });
  }
};

// @desc    Get recommended products (popular & frequently ordered)
// @route   GET /api/auth/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true, status: "Active" }).populate("createdBy", "name");
    const orders = await Order.find();

    const orderCounts = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId) {
          const prodId = item.productId.toString();
          orderCounts[prodId] = (orderCounts[prodId] || 0) + item.quantity;
        }
      });
    });

    const frequentlyOrdered = [...products].sort((a, b) => {
      const countA = orderCounts[a._id.toString()] || 0;
      const countB = orderCounts[b._id.toString()] || 0;
      return countB - countA;
    });

    const popular = [...products].sort((a, b) => {
      const scoreA = (orderCounts[a._id.toString()] || 0) * 1.5 + (a.discount || 0);
      const scoreB = (orderCounts[b._id.toString()] || 0) * 1.5 + (b.discount || 0);
      return scoreB - scoreA;
    });

    res.json({
      popular: popular.slice(0, 4),
      frequentlyOrdered: frequentlyOrdered.slice(0, 4)
    });
  } catch (error) {
    console.error("Fetch recommendations error:", error);
    res.status(500).json({ message: "Server error while fetching recommendations" });
  }
};

// @desc    Get active pricing rules for storefront calculations
// @route   GET /api/auth/pricing-rules
exports.getActivePricingRules = async (req, res) => {
  try {
    let rules = await PricingRules.findOne({ isActive: true });
    if (!rules) {
      rules = await PricingRules.create({
        baseRates: { crewNeck: 12.00, vNeck: 14.00, polo: 18.00 },
        materialPremiums: { cotton: 0.00, polyester: 1.50, organicCotton: 3.00 },
        costPerSqIn: 0.02,
        complexityFeePerLayer: 1.00,
        volumeDiscount: { thresholdQty: 5, discountPercentage: 10 }
      });
    }
    res.json(rules);
  } catch (error) {
    console.error("Get active pricing rules error:", error);
    res.status(500).json({ message: "Server error while fetching pricing rules" });
  }
};

// Helper to verify customer token
const verifyUserToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.split(" ")[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
};

// @desc    Submit checkout order
// @route   POST /api/auth/orders
exports.createOrder = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const { items, subtotal, printCost, complexityFee, totalCost, shippingAddress } = req.body;

    const order = await Order.create({
      customerId: decoded.id,
      items,
      subtotal,
      printCost: printCost || 0,
      complexityFee: complexityFee || 0,
      totalCost,
      shippingAddress,
      paymentStatus: "Paid",
      orderStatus: "Processing", // default to processing after checkout
      timeline: [
        { status: "Pending Payment", note: "Order placed by customer" },
        { status: "Processing", note: "Payment verified, order sent to printing queue" }
      ]
    });

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({ message: "Server error while placing order" });
  }
};

// @desc    Get customer orders
// @route   GET /api/auth/orders
exports.getCustomerOrders = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const orders = await Order.find({ customerId: decoded.id })
      .populate("items.productId")
      .populate("items.designId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get customer orders error:", error);
    res.status(500).json({ message: "Server error while fetching orders" });
  }
};

// @desc    Save customer custom design draft
// @route   POST /api/auth/designs
exports.saveCustomerDesign = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const { tShirtType, fabricColor, material, size, layers, estimatedCost, thumbnailUrl } = req.body;

    const design = await CustomizedDesign.create({
      userId: decoded.id,
      tShirtType,
      fabricColor,
      material,
      size,
      layers: layers || [],
      estimatedCost,
      thumbnailUrl
    });

    await User.findByIdAndUpdate(decoded.id, {
      $push: { savedDesigns: design._id }
    });

    res.status(201).json({ message: "Design saved successfully", design });
  } catch (error) {
    console.error("Save customer design error:", error);
    res.status(500).json({ message: "Server error while saving design" });
  }
};

// @desc    Get customer saved designs
// @route   GET /api/auth/designs
exports.getCustomerDesigns = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const designs = await CustomizedDesign.find({ userId: decoded.id })
      .sort({ createdAt: -1 });

    res.json(designs);
  } catch (error) {
    console.error("Get customer designs error:", error);
    res.status(500).json({ message: "Server error while fetching designs" });
  }
};

// @desc    Get all active T-shirt styles (Public)
// @route   GET /api/auth/tshirt-styles
exports.getTShirtStylesPublic = async (req, res) => {
  try {
    const count = await TShirtStyle.countDocuments();
    if (count === 0) {
      await TShirtStyle.insertMany([
        {
          name: "Male Normal T-Shirt",
          path: "/images/models/male normal t-shirt1.glb",
          type: "Crew Neck",
          gsms: ["180GSM", "220 GSM", "280GSM"],
          colors: [
            { name: "White", value: "#ffffff" },
            { name: "Black", value: "#111827" },
            { name: "Charcoal", value: "#4b5563" },
            { name: "Navy Blue", value: "#1e3a8a" },
            { name: "Red", value: "#dc2626" },
            { name: "Gold", value: "#fbbf24" },
            { name: "Green", value: "#16a34a" }
          ]
        },
        {
          name: "Oversized T-Shirt",
          path: "/images/models/oversized t-sdirt1.glb",
          type: "Crew Neck",
          gsms: ["220 GSM", "280GSM", "320GSM"],
          colors: [
            { name: "White", value: "#ffffff" },
            { name: "Black", value: "#111827" },
            { name: "Beige", value: "#f5f5dc" },
            { name: "Light Grey", value: "#e5e7eb" },
            { name: "Pink", value: "#f472b6" }
          ]
        },
        {
          name: "Hoodie",
          path: "/images/models/t_shirt_hoodie.glb",
          type: "Polo",
          gsms: ["280GSM", "320GSM"],
          colors: [
            { name: "Black", value: "#111827" },
            { name: "Navy Blue", value: "#1e3a8a" },
            { name: "Violet", value: "#6d28d9" },
            { name: "Brown", value: "#78350f" },
            { name: "Red", value: "#dc2626" }
          ]
        }
      ]);
    }
    const styles = await TShirtStyle.find().sort({ createdAt: -1 });
    res.json(styles);
  } catch (error) {
    console.error("Get public tshirt styles error:", error);
    res.status(500).json({ message: "Server error while fetching tshirt styles" });
  }
};
