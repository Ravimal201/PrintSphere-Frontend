const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const PricingRules = require("../models/PricingRules");
const CustomizedDesign = require("../models/CustomizedDesign");
const TShirtStyle = require("../models/TShirtStyle");
const UserActivity = require("../models/UserActivity");
const Review = require("../models/Review");
const { createNotification } = require("../utils/notificationHelper");
const { resolveColorName, formatGsm } = require("../utils/colorHelper");

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
        role: user.role,
        phone: user.phone,
        address: user.address,
        savedPaymentMethod: user.savedPaymentMethod
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

// @desc    Get all active store products with reviews and ratings
// @route   GET /api/auth/products
exports.getStoreProducts = async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true, status: "Active" })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });

    // Aggregate review stats to ensure real-time accuracy for every product
    const allReviews = await Review.find().sort({ createdAt: -1 });
    const productStats = {};
    allReviews.forEach((r) => {
      if (r.productId) {
        const pId = r.productId.toString();
        if (!productStats[pId]) {
          productStats[pId] = { total: 0, count: 0, reviews: [] };
        }
        productStats[pId].total += Number(r.rating) || 0;
        productStats[pId].count += 1;
        productStats[pId].reviews.push({
          userName: r.userName || "Verified Buyer",
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt
        });
      }
    });

    const productsWithRatings = products.map((p) => {
      const pObj = p.toObject();
      const stats = productStats[p._id.toString()];
      if (stats && stats.count > 0) {
        pObj.averageRating = parseFloat((stats.total / stats.count).toFixed(1));
        pObj.ratingsCount = stats.count;
        pObj.reviews = stats.reviews;
      } else {
        pObj.averageRating = p.averageRating || 0;
        pObj.ratingsCount = p.ratingsCount || 0;
        pObj.reviews = [];
      }
      return pObj;
    });

    res.json(productsWithRatings);
  } catch (error) {
    console.error("Fetch store products error:", error);
    res.status(500).json({ message: "Server error while fetching store products" });
  }
};

// @desc    Get reviews for a specific product
// @route   GET /api/auth/products/:productId/reviews
exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("Fetch product reviews error:", error);
    res.status(500).json({ message: "Server error while fetching reviews" });
  }
};

// @desc    Get all customer reviews for home page testimonials
// @route   GET /api/auth/reviews
exports.getAllCustomerReviews = async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("productId", "title images category")
      .populate("designId", "tShirtType fabricColor thumbnailUrl")
      .sort({ createdAt: -1 })
      .limit(30);

    const formatted = reviews.map((r) => {
      const productName = r.productId?.title || r.designId?.tShirtType || "Customized T-Shirt";
      const userInitials = (r.userName || "Customer")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return {
        _id: r._id,
        quote: r.comment && r.comment.trim() ? r.comment : "Amazing print quality and fabric! Delivered on time.",
        name: r.userName || "Verified Buyer",
        role: productName,
        rating: r.rating || 5,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(r.userName || "Customer")}&backgroundColor=6366f1,4f46e5,7c3aed&textColor=ffffff`,
        initials: userInitials,
        productImage: r.productId?.images?.[0] || r.designId?.thumbnailUrl || null,
        createdAt: r.createdAt
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Fetch all reviews error:", error);
    res.status(500).json({ message: "Server error while fetching customer reviews" });
  }
};

// @desc    Get real platform statistics for Home Page Dashboard Cards
// @route   GET /api/auth/stats
exports.getPlatformStats = async (req, res) => {
  try {
    const [
      completedOrdersCount,
      totalOrdersCount,
      designsCount,
      productsCount,
      reviews
    ] = await Promise.all([
      Order.countDocuments({ orderStatus: { $in: ["Completed", "Shipped", "Collected", "Delivered"] } }),
      Order.countDocuments(),
      CustomizedDesign.countDocuments(),
      Product.countDocuments({ isApproved: true, status: "Active" }),
      Review.find()
    ]);

    const reviewCount = reviews.length;
    const avgRating = reviewCount > 0
      ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / reviewCount).toFixed(1)
      : "0.0";

    res.json({
      ordersCompleted: completedOrdersCount,
      totalOrders: totalOrdersCount,
      uniqueDesigns: designsCount,
      premiumProducts: productsCount,
      customerRating: reviewCount > 0 ? `${avgRating}/5` : "0.0/5",
      averageRating: parseFloat(avgRating),
      reviewCount: reviewCount,
      ratingSubtitle: reviewCount === 0 
        ? "No reviews yet" 
        : reviewCount === 1 
        ? "Based on 1 review" 
        : `Based on ${reviewCount} reviews`
    });
  } catch (error) {
    console.error("Fetch platform stats error:", error);
    res.status(500).json({ message: "Server error while fetching platform stats" });
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
        const isTargetUser = (currentUserId && act.userId && act.userId.toString() === currentUserId) ||
                             (currentSessionId && act.sessionId && act.sessionId === currentSessionId);

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

      // Collect all product IDs that the user directly interacted with
      const userInteractedProductIds = new Set([
        ...Object.keys(userPurchasedMap),
        ...Object.keys(userCartMap),
        ...Object.keys(userViewMap),
      ]);

      if (userInteractedProductIds.size > 0) {
        hasUserActivity = true;

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
        // Only score products that the user has directly interacted with
        const personalizedScored = [];

        products.forEach(p => {
          const pId = p._id.toString();
          if (!userInteractedProductIds.has(pId)) return;

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

          // 4. Searched Products boost (Weight: 8)
          let searchMatched = false;
          userSearchedTerms.forEach(term => {
            if (term && (pTitle.includes(term) || pCategory.toLowerCase().includes(term))) {
              searchMatched = true;
            }
          });
          if (searchMatched) {
            score += 8;
          }

          // 5. Category affinity boost (Weight: 2)
          const catCount = userCategoryCounts[pCategory] || 0;
          if (catCount > 0) {
            score += catCount * 2;
          }

          // 6. Collaborative Filtering boost
          const collabScore = similarUserProductsMap[pId] || 0;
          if (collabScore > 0) {
            score += collabScore;
          }

          if (score > 0) {
            const pObj = p.toObject();
            pObj.recommendationReason = primaryReason || "Activity related product";
            personalizedScored.push({
              product: pObj,
              personalScore: score
            });
          }
        });

        personalizedScored.sort((a, b) => b.personalScore - a.personalScore);
        // Returns 1 item after 1st distinct product activity, 2 after 2nd, 3 after 3rd, 4 after 4th, and top 4 when exceeding 4
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

    const normalizedItems = (items || []).map((item) => {
      const size = item.size || item.selectedSize || "M";
      const color = resolveColorName(item.color || item.selectedColor || "White");
      const gsm = formatGsm(item.gsm || item.material || "GSM 180");
      const tShirtStyle = item.tShirtStyle || item.tShirtType || (item.designId?.tShirtType) || "Crew Neck";
      const quantity = typeof item.quantity !== "undefined" && !isNaN(Number(item.quantity)) && Number(item.quantity) > 0 
        ? Number(item.quantity) 
        : 1;
      const price = typeof item.price !== "undefined" && !isNaN(Number(item.price)) 
        ? Number(item.price) 
        : (item.basePrice || 0);
      const itemType = item.itemType || (item.designId ? "Customized" : "Ready-made");

      return {
        ...item,
        itemType,
        quantity,
        size,
        selectedSize: size,
        gsm,
        color,
        selectedColor: color,
        tShirtStyle,
        material: item.material || gsm,
        price
      };
    });

    const primaryItem = normalizedItems[0] || {};
    const orderSize = req.body.size || primaryItem.size || "M";
    const orderGsm = formatGsm(req.body.gsm || primaryItem.gsm || "GSM 180");
    const orderColor = resolveColorName(req.body.color || primaryItem.color || "White");
    const orderQuantity = typeof req.body.quantity !== "undefined" && !isNaN(Number(req.body.quantity))
      ? Number(req.body.quantity)
      : (normalizedItems.reduce((sum, it) => sum + (it.quantity || 1), 0) || 1);
    const orderTShirtStyle = req.body.tShirtStyle || req.body.tShirtType || primaryItem.tShirtStyle || "Crew Neck";

    const order = await Order.create({
      customerId: decoded.id,
      size: orderSize,
      gsm: orderGsm,
      color: orderColor,
      quantity: orderQuantity,
      tShirtStyle: orderTShirtStyle,
      items: normalizedItems,
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

// @desc    Delete customer saved design
// @route   DELETE /api/auth/designs/:id
exports.deleteCustomerDesign = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const designId = req.params.id;

    // Find the design first to make sure it exists and belongs to the user
    const design = await CustomizedDesign.findOne({ _id: designId, userId: decoded.id });
    if (!design) {
      return res.status(404).json({ message: "Design not found or unauthorized" });
    }

    // Delete design
    await CustomizedDesign.deleteOne({ _id: designId });

    // Pull from user's savedDesigns array
    await User.findByIdAndUpdate(decoded.id, {
      $pull: { savedDesigns: designId }
    });

    res.json({ message: "Design deleted successfully" });
  } catch (error) {
    console.error("Delete customer design error:", error);
    res.status(500).json({ message: "Server error while deleting design" });
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

// @desc    Get logged in user profile
// @route   GET /api/auth/profile
exports.getUserProfile = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const user = await User.findById(decoded.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

// @desc    Update customer profile details
// @route   PUT /api/auth/profile OR /api/auth/update-profile
exports.updateUserProfile = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const { name, phone, address, syncOrders } = req.body;

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name !== undefined) {
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      user.name = name;
    }
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) {
      user.address = {
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        zipCode: address.zipCode || "",
        country: address.country || "Sri Lanka"
      };
    }

    await user.save();

    // Optionally sync default shipping address to user's orders
    if (syncOrders || syncOrders === undefined) {
      const newAddr = {
        street: user.address?.street || "",
        city: user.address?.city || "",
        state: user.address?.state || "",
        zipCode: user.address?.zipCode || "",
        country: user.address?.country || "Sri Lanka"
      };
      await Order.updateMany(
        { customerId: decoded.id },
        { $set: { shippingAddress: newAddr } }
      );
    }

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        savedPaymentMethod: user.savedPaymentMethod
      }
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};

// @desc    Update delivery address for a specific order
// @route   PUT /api/auth/orders/:orderId/address
exports.updateOrderAddress = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const { orderId } = req.params;
    const { street, city, state, zipCode, country } = req.body;

    const order = await Order.findOne({ _id: orderId, customerId: decoded.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    order.shippingAddress = {
      street: street || "",
      city: city || "",
      state: state || "",
      zipCode: zipCode || "",
      country: country || "Sri Lanka"
    };

    await order.save();

    res.json({ message: "Order delivery address updated successfully", order });
  } catch (error) {
    console.error("Update order address error:", error);
    res.status(500).json({ message: "Server error while updating order address" });
  }
};

// @desc    Update user saved payment method
// @route   PUT /api/auth/payment-method
exports.updateUserPaymentMethod = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const { methodType, cardholderName, cardNumber, expiryDate, brand } = req.body;

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cardLast4 = cardNumber ? cardNumber.replace(/\s/g, "").slice(-4) : user.savedPaymentMethod?.cardLast4 || "4242";

    user.savedPaymentMethod = {
      methodType: methodType || "card",
      cardholderName: cardholderName || user.name,
      cardLast4,
      expiryDate: expiryDate || "12/28",
      brand: brand || "VISA"
    };

    await user.save();

    res.json({
      message: "Payment method updated successfully",
      savedPaymentMethod: user.savedPaymentMethod,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        savedPaymentMethod: user.savedPaymentMethod
      }
    });
  } catch (error) {
    console.error("Update user payment method error:", error);
    res.status(500).json({ message: "Server error while saving payment method" });
  }
};

// @desc    Cancel a pending order
// @route   PUT /api/auth/orders/:orderId/cancel
exports.cancelOrder = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const { orderId } = req.params;

    const order = await Order.findOne({ _id: orderId, customerId: decoded.id });
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.orderStatus !== "Pending Payment") {
      return res.status(400).json({ message: "Only orders pending payment can be cancelled." });
    }

    order.orderStatus = "Cancelled";
    order.timeline.push({
      status: "Cancelled",
      note: "Order cancelled by customer during checkout."
    });

    await order.save();

    // Notify admins / managers
    try {
      await createNotification({
        recipientRole: "Admin",
        title: "Order Cancelled",
        message: `Order #${order._id} has been cancelled by customer.`,
        type: "Order Update"
      });

      await createNotification({
        recipientRole: "Manager",
        title: "Order Cancelled",
        message: `Order #${order._id} has been cancelled by customer.`,
        type: "Order Update"
      });
    } catch (notifErr) {
      console.error("Failed to generate cancellation notifications:", notifErr);
    }

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error while cancelling order" });
  }
};

// @desc    Mark an order as collected by customer
// @route   PUT /api/auth/orders/:orderId/collect
exports.markOrderCollected = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const { orderId } = req.params;
    const order = await Order.findOne({ _id: orderId, customerId: decoded.id })
      .populate("assignedEmployee", "name")
      .populate("items.productId")
      .populate("items.designId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Allow marking collected if Shipped or Completed
    order.orderStatus = "Collected";
    order.isCollected = true;
    order.collectedAt = new Date();

    order.timeline.push({
      status: "Collected",
      note: "Order confirmed collected and received by customer.",
      timestamp: new Date()
    });

    await order.save();

    // Create notifications for staff
    try {
      const notifMsg = `Customer has successfully collected Order #${order._id.toString().slice(-8).toUpperCase()}.`;

      await createNotification({
        recipientRole: "Admin",
        title: "Order Collected",
        message: notifMsg,
        type: "Order Update"
      });

      await createNotification({
        recipientRole: "Manager",
        title: "Order Collected",
        message: notifMsg,
        type: "Order Update"
      });

      if (order.assignedEmployee) {
        await createNotification({
          recipientId: order.assignedEmployee._id || order.assignedEmployee,
          title: "Order Collected",
          message: notifMsg,
          type: "Order Update"
        });
      }
    } catch (notifErr) {
      console.error("Failed to generate collection notifications:", notifErr);
    }

    res.json({ message: "Order marked as collected successfully", order });
  } catch (error) {
    console.error("Mark order collected error:", error);
    res.status(500).json({ message: "Server error while updating order status" });
  }
};

// @desc    Submit rating and review comment for product / order
// @route   POST /api/auth/orders/:orderId/review
exports.submitOrderReview = async (req, res) => {
  try {
    const decoded = verifyUserToken(req);
    if (!decoded) {
      return res.status(401).json({ message: "Authorization denied. Please log in." });
    }

    const { orderId } = req.params;
    const { rating, comment } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: "Please provide a valid rating between 1 and 5 stars." });
    }

    const order = await Order.findOne({ _id: orderId, customerId: decoded.id })
      .populate("items.productId")
      .populate("items.designId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const user = await User.findById(decoded.id);
    const userName = user ? user.name : "Customer";

    const reviewObj = {
      rating: numRating,
      comment: (comment || "").trim(),
      createdAt: new Date()
    };

    // Update order review
    order.review = reviewObj;

    // Update item-level reviews
    if (order.items && order.items.length > 0) {
      order.items.forEach(item => {
        item.review = reviewObj;
      });
    }

    await order.save();

    // Store review document(s) in Review collection and update product average rating
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        const prodId = item.productId?._id || item.productId;
        const desId = item.designId?._id || item.designId;

        // Upsert review record
        await Review.findOneAndUpdate(
          { orderId: order._id, userId: decoded.id, ...(prodId ? { productId: prodId } : { designId: desId }) },
          {
            orderId: order._id,
            productId: prodId || undefined,
            designId: desId || undefined,
            userId: decoded.id,
            userName,
            rating: numRating,
            comment: (comment || "").trim()
          },
          { upsert: true, new: true }
        );

        // Recalculate average rating for store product if applicable
        if (prodId) {
          try {
            const productReviews = await Review.find({ productId: prodId });
            if (productReviews.length > 0) {
              const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
              await Product.findByIdAndUpdate(prodId, {
                averageRating: parseFloat(avg.toFixed(1)),
                ratingsCount: productReviews.length
              });
            }
          } catch (pErr) {
            console.error("Error updating product average rating:", pErr);
          }
        }
      }
    } else {
      await Review.findOneAndUpdate(
        { orderId: order._id, userId: decoded.id },
        {
          orderId: order._id,
          userId: decoded.id,
          userName,
          rating: numRating,
          comment: (comment || "").trim()
        },
        { upsert: true, new: true }
      );
    }

    // Send notifications to Admin/Manager about new review
    try {
      await createNotification({
        recipientRole: "Admin",
        title: `New Product Review (${numRating}★)`,
        message: `${userName} rated Order #${order._id.toString().slice(-8).toUpperCase()} with ${numRating} stars: "${(comment || "").slice(0, 80)}"`,
        type: "Order Update"
      });

      await createNotification({
        recipientRole: "Manager",
        title: `New Product Review (${numRating}★)`,
        message: `${userName} rated Order #${order._id.toString().slice(-8).toUpperCase()} with ${numRating} stars: "${(comment || "").slice(0, 80)}"`,
        type: "Order Update"
      });
    } catch (notifErr) {
      console.error("Failed to generate review notifications:", notifErr);
    }

    res.json({ message: "Thank you for your rating and feedback!", order });
  } catch (error) {
    console.error("Submit order review error:", error);
    res.status(500).json({ message: "Server error while submitting review" });
  }
};


