const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const PricingRules = require("../models/PricingRules");

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
