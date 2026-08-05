const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const PricingRules = require("../models/PricingRules");
const CustomizedDesign = require("../models/CustomizedDesign");
const TShirtStyle = require("../models/TShirtStyle");
const UserActivity = require("../models/UserActivity");
const { createNotification } = require("../utils/notificationHelper");

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

// @desc    Track user activity event (view, search, cart add, purchase)
// @route   POST /api/auth/activity
exports.trackUserActivity = async (req, res) => {
  try {
    const { action, productId, category, searchTerm, sessionId } = req.body;
    let userId = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Token invalid or expired, continue as guest
      }
    }

    if (!action) {
      return res.status(400).json({ message: "Action is required" });
    }

    await UserActivity.create({
      userId: userId || undefined,
      sessionId: sessionId || undefined,
      action,
      productId: productId || undefined,
      category: category || undefined,
      searchTerm: searchTerm ? searchTerm.trim().toLowerCase() : undefined
    });

    res.status(201).json({ success: true });
  } catch (error) {
    console.error("Track user activity error:", error);
    res.status(500).json({ message: "Server error tracking activity" });
  }
};

// @desc    Get recommended products (popular & frequently ordered based on activity)
// @route   GET /api/auth/recommendations
exports.getRecommendations = async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true, status: "Active" }).populate("createdBy", "name");
    const orders = await Order.find();
    const allActivities = await UserActivity.find().sort({ createdAt: -1 }).limit(5000);

    // Identify user / session from Auth header or Query parameters
    let currentUserId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id ? decoded.id.toString() : null;
      } catch (err) {
        // Guest user
      }
    }
    const currentSessionId = req.query.sessionId || req.body.sessionId || null;

    // --- 1. GLOBAL POPULARITY SCORING (For all users) ---
    const globalOrderCounts = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.productId) {
          const prodId = item.productId.toString();
          globalOrderCounts[prodId] = (globalOrderCounts[prodId] || 0) + item.quantity;
        }
      });
    });

    const globalCartCounts = {};
    const globalViewCounts = {};

    allActivities.forEach(act => {
      if (act.productId) {
        const pId = act.productId.toString();
        if (act.action === "ADD_TO_CART") {
          globalCartCounts[pId] = (globalCartCounts[pId] || 0) + 1;
        } else if (act.action === "VIEW_PRODUCT") {
          globalViewCounts[pId] = (globalViewCounts[pId] || 0) + 1;
        }
      }
    });

    const popularScored = products.map(p => {
      const pId = p._id.toString();
      const purchases = globalOrderCounts[pId] || 0;
      const cartAdds = globalCartCounts[pId] || 0;
      const views = globalViewCounts[pId] || 0;
      const discountBonus = (p.discount || 0) * 0.5;

      const globalScore = (purchases * 10) + (cartAdds * 5) + (views * 2) + discountBonus;
      return {
        product: p,
        globalScore
      };
    });

    popularScored.sort((a, b) => b.globalScore - a.globalScore);
    const popularProducts = popularScored.slice(0, 4).map(item => item.product);

    // --- 2. PERSONALIZED RECOMMENDATIONS (Logged-In User Activity + Collaborative Filtering) ---
    let frequentlyOrdered = [];
    let hasUserActivity = false;

    if (currentUserId) {
      const userPurchasedMap = {};
      orders.forEach(order => {
        if (order.customer && order.customer.toString() === currentUserId) {
          order.items.forEach(item => {
            if (item.productId) {
              const pId = item.productId.toString();
              userPurchasedMap[pId] = (userPurchasedMap[pId] || 0) + item.quantity;
            }
          });
        }
      });

      const userCartMap = {};
      const userViewMap = {};
      const userSearchedTerms = [];
      const userCategoryCounts = {};
      let totalUserActivityCount = 0;

      allActivities.forEach(act => {
        const isTargetUser = act.userId && act.userId.toString() === currentUserId;

        if (isTargetUser) {
          totalUserActivityCount++;
          if (act.productId) {
            const pId = act.productId.toString();
            if (act.action === "ADD_TO_CART") {
              userCartMap[pId] = (userCartMap[pId] || 0) + 1;
            } else if (act.action === "VIEW_PRODUCT") {
              userViewMap[pId] = (userViewMap[pId] || 0) + 1;
            }
          }

          if (act.category) {
            const cat = act.category;
            userCategoryCounts[cat] = (userCategoryCounts[cat] || 0) + 1;
          }

          if (act.action === "SEARCH_PRODUCT" && act.searchTerm) {
            userSearchedTerms.push(act.searchTerm.toLowerCase());
          }
        }
      });

      const totalPurchases = Object.keys(userPurchasedMap).length;
      if (totalUserActivityCount > 0 || totalPurchases > 0) {
        hasUserActivity = true;
      }

      if (hasUserActivity) {
        // --- COLLABORATIVE FILTERING (Similar Users' Behavior) ---
        const userInteractionSets = {};
        allActivities.forEach(act => {
          if (act.userId && act.productId) {
            const uId = act.userId.toString();
            if (!userInteractionSets[uId]) {
              userInteractionSets[uId] = new Set();
            }
            userInteractionSets[uId].add(act.productId.toString());
          }
        });

        const targetUserSet = userInteractionSets[currentUserId] || new Set();
        const similarUserProductsMap = {};

        if (targetUserSet.size > 0) {
          Object.keys(userInteractionSets).forEach(otherUserId => {
            if (otherUserId !== currentUserId) {
              const otherSet = userInteractionSets[otherUserId];
              let intersectionSize = 0;
              targetUserSet.forEach(pId => {
                if (otherSet.has(pId)) intersectionSize++;
              });

              const unionSize = new Set([...targetUserSet, ...otherSet]).size;
              const similarity = unionSize > 0 ? intersectionSize / unionSize : 0;

              if (similarity > 0) {
                otherSet.forEach(pId => {
                  if (!targetUserSet.has(pId)) {
                    similarUserProductsMap[pId] = (similarUserProductsMap[pId] || 0) + (similarity * 10);
                  }
                });
              }
            }
          });
        }

        // --- SCORE PRODUCTS FOR PERSONALIZED TAB ---
        const personalizedScored = [];

        products.forEach(p => {
          const pId = p._id.toString();
          const pTitle = (p.title || "").toLowerCase();
          const pCategory = p.category || "";

          let score = 0;
          let primaryReason = "";

          // 1. Previous Purchases (Weight: 15)
          const userPurchases = userPurchasedMap[pId] || 0;
          if (userPurchases > 0) {
            score += userPurchases * 15;
            if (!primaryReason) primaryReason = "Previous Purchase";
          }

          // 2. Added to Cart (Weight: 10)
          const userCartAdds = userCartMap[pId] || 0;
          if (userCartAdds > 0) {
            score += userCartAdds * 10;
            if (!primaryReason) primaryReason = "Items added to your cart";
          }

          // 3. Viewed Products (Weight: 6)
          const userViews = userViewMap[pId] || 0;
          if (userViews > 0) {
            score += userViews * 6;
            if (!primaryReason) primaryReason = "Product you've viewed";
          }

          // 4. Searched Products (Weight: 8)
          let searchMatched = false;
          userSearchedTerms.forEach(term => {
            if (term && (pTitle.includes(term) || pCategory.toLowerCase().includes(term))) {
              searchMatched = true;
            }
          });
          if (searchMatched) {
            score += 8;
            if (!primaryReason) primaryReason = "Matches your searches";
          }

          // 5. Frequently Browsed Categories (Weight: 4 per interaction)
          const catCount = userCategoryCounts[pCategory] || 0;
          if (catCount > 0) {
            score += catCount * 4;
            if (!primaryReason) primaryReason = `Frequently browsed: ${pCategory}`;
          }

          // 6. Collaborative Filtering (Similar users' behavior)
          const collabScore = similarUserProductsMap[pId] || 0;
          if (collabScore > 0) {
            score += collabScore;
            if (!primaryReason) primaryReason = "Recommended based on similar users";
          }

          if (score > 0) {
            const pObj = p.toObject();
            pObj.recommendationReason = primaryReason;
            personalizedScored.push({
              product: pObj,
              personalScore: score
            });
          }
        });

        personalizedScored.sort((a, b) => b.personalScore - a.personalScore);
        frequentlyOrdered = personalizedScored.slice(0, 4).map(item => item.product);
      }
    }

    res.json({
      popular: popularProducts,
      frequentlyOrdered: frequentlyOrdered,
      isLoggedIn: !!currentUserId,
      hasUserActivity: hasUserActivity
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
      paymentStatus: "Pending",
      orderStatus: "Pending Payment",
      timeline: [
        { status: "Pending Payment", note: "Order placed by customer. Awaiting online payment confirmation." }
      ]
    });

    // Generate notifications
    await createNotification({
      recipientRole: "Admin",
      title: "New Order Placed",
      message: `Order #${order._id} for Rs. ${totalCost} has been placed.`,
      type: "Order Update"
    });

    await createNotification({
      recipientRole: "Manager",
      title: "New Order Placed",
      message: `Order #${order._id} for Rs. ${totalCost} has been placed.`,
      type: "Order Update"
    });

    await createNotification({
      recipientId: decoded.id,
      title: "Order Placed Successfully",
      message: `Your order #${order._id} for Rs. ${totalCost} has been received and is being processed.`,
      type: "Payment Success"
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
    const styles = await TShirtStyle.find().sort({ createdAt: -1 });
    res.json(styles);
  } catch (error) {
    console.error("Get public tshirt styles error:", error);
    res.status(500).json({ message: "Server error while fetching tshirt styles" });
  }
};
