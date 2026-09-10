const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Order = require("../models/Order");
const CustomizedDesign = require("../models/CustomizedDesign");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

const JWT_SECRET = process.env.JWT_SECRET || "printsphere_jwt_secret_key_99";

// Helper to verify if the request comes from a authorized System Admin
const verifyAdmin = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === "Admin";
  } catch (err) {
    return false;
  }
};

// @desc    Get all active staff (Managers and Employees)
// @route   GET /api/admin/staff
exports.getStaffList = async (req, res) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const staff = await User.find({ role: { $in: ["Manager", "Employee"] } })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json(staff);
  } catch (error) {
    console.error("Fetch staff list error:", error);
    res.status(500).json({ message: "Server error while fetching staff" });
  }
};

// @desc    Create a new Manager or Employee account
// @route   POST /api/admin/create-staff
exports.createStaffAccount = async (req, res) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { name, email, password, role, phone, address } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please enter all required fields" });
    }

    if (role !== "Manager" && role !== "Employee") {
      return res.status(400).json({ message: "Role must be either Manager or Employee" });
    }

    // Check if email already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "An account already exists with this email" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save staff member
    const newStaff = await User.create({
      name,
      email,
      passwordHash,
      role,
      phone,
      address
    });

    res.status(201).json({
      message: `${role} account created successfully`,
      staff: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role
      }
    });
  } catch (error) {
    console.error("Create staff account error:", error);
    res.status(500).json({ message: "Server error while creating staff account" });
  }
};


// @desc    Delete a staff account
// @route   DELETE /api/admin/delete-staff/:id
exports.deleteStaffAccount = async (req, res) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const deletedUser = await User.findOneAndDelete({
      _id: req.params.id,
      role: { $in: ["Manager", "Employee"] }
    });

    if (!deletedUser) {
      return res.status(404).json({ message: "Staff account not found or cannot be deleted" });
    }

    res.json({ message: `Account for ${deletedUser.name} deleted successfully` });
  } catch (error) {
    console.error("Delete staff account error:", error);
    res.status(500).json({ message: "Server error while deleting account" });
  }
};

// @desc    Get dashboard analytics reports
// @route   GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    // 1. Fetch orders with populated product/design references
    const allOrders = await Order.find()
      .populate("items.productId")
      .populate("items.designId")
      .sort({ createdAt: -1 });

    const totalOrdersCount = await Order.countDocuments();
    const customDesignsCount = await CustomizedDesign.countDocuments();

    // 2. Compute Gross Revenue (Only consider paid or active/completed fulfillment orders)
    const validRevenueOrders = allOrders.filter(o => 
      o.paymentStatus === "Paid" || 
      ["Processing", "Printing", "Completed", "Shipped", "Delivered", "Collected"].includes(o.orderStatus)
    );

    const grossRevenue = validRevenueOrders.reduce((sum, order) => sum + (Number(order.totalCost) || 0), 0);

    // 3. Popular Fabric Colors Breakdown
    const colorMap = {};
    validRevenueOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          let rawColor = item.selectedColor || item.color || order.color || "White";
          if (rawColor.startsWith("#")) {
            const lc = rawColor.toLowerCase();
            if (lc === "#ffffff" || lc === "#fff") rawColor = "White";
            else if (lc === "#000000" || lc === "#000" || lc === "#111827" || lc === "#1e293b") rawColor = "Black";
            else if (lc === "#1e3a8a" || lc === "#172554" || lc === "#1e40af") rawColor = "Navy Blue";
            else if (lc === "#dc2626" || lc === "#ef4444" || lc === "#b91c1c") rawColor = "Red";
            else if (lc === "#e5e7eb" || lc === "#9ca3af" || lc === "#64748b") rawColor = "Grey";
          }
          const colorName = rawColor.charAt(0).toUpperCase() + rawColor.slice(1);
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price || item.unitPrice || 0);
          const itemRev = price > 0 ? price * qty : ((Number(order.totalCost) || 0) / order.items.length);

          if (!colorMap[colorName]) {
            colorMap[colorName] = { color: colorName, count: 0, revenue: 0 };
          }
          colorMap[colorName].count += qty;
          colorMap[colorName].revenue += itemRev;
        });
      } else {
        let rawColor = order.color || "White";
        const colorName = rawColor.charAt(0).toUpperCase() + rawColor.slice(1);
        const qty = Number(order.quantity) || 1;
        const rev = Number(order.totalCost) || 0;

        if (!colorMap[colorName]) {
          colorMap[colorName] = { color: colorName, count: 0, revenue: 0 };
        }
        colorMap[colorName].count += qty;
        colorMap[colorName].revenue += rev;
      }
    });

    const popularColors = Object.values(colorMap).sort((a, b) => b.count - a.count);
    const defaultColors = ["White", "Black", "Navy Blue", "Red"];
    defaultColors.forEach((defColor) => {
      if (!popularColors.some(c => c.color.toLowerCase() === defColor.toLowerCase())) {
        popularColors.push({ color: defColor, count: 0, revenue: 0 });
      }
    });

    // 4. Best-Selling Products & Custom Designs
    const productSalesMap = {};
    validRevenueOrders.forEach(order => {
      if (order.items && order.items.length > 0) {
        order.items.forEach(item => {
          let name = "Customized T-Shirt";
          let key = "custom";
          if (item.productId) {
            if (typeof item.productId === "object" && (item.productId.title || item.productId.name)) {
              name = item.productId.title || item.productId.name;
              key = item.productId._id.toString();
            } else {
              key = item.productId.toString();
            }
          } else if (item.designId) {
            if (typeof item.designId === "object" && (item.designId.tShirtType || item.designId.title)) {
              name = item.designId.title || `Custom ${item.designId.tShirtType}`;
              key = item.designId._id.toString();
            } else {
              key = item.designId.toString();
            }
          } else if (item.tShirtStyle) {
            name = `${item.tShirtStyle} Custom Shirt`;
            key = item.tShirtStyle;
          } else if (item.itemType) {
            name = `${item.itemType} T-Shirt`;
            key = item.itemType;
          }

          const qty = Number(item.quantity) || 1;
          const price = Number(item.price || item.unitPrice || 0);
          const itemRev = price > 0 ? price * qty : ((Number(order.totalCost) || 0) / order.items.length);

          if (!productSalesMap[key]) {
            productSalesMap[key] = { name, sales: 0, revenue: 0 };
          }
          productSalesMap[key].sales += qty;
          productSalesMap[key].revenue += itemRev;
        });
      } else {
        const name = `${order.tShirtStyle || "Plain"} Custom Shirt`;
        const key = order.tShirtStyle || "custom";
        const qty = Number(order.quantity) || 1;
        const rev = Number(order.totalCost) || 0;
        if (!productSalesMap[key]) {
          productSalesMap[key] = { name, sales: 0, revenue: 0 };
        }
        productSalesMap[key].sales += qty;
        productSalesMap[key].revenue += rev;
      }
    });

    const bestSellers = Object.values(productSalesMap)
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
      .map((item, idx) => ({
        rank: idx + 1,
        name: item.name,
        sales: item.sales,
        revenue: `Rs. ${item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      }));

    // 5. Monthly Revenue Trends (Past 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trends = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      trends.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth(),
        yearNum: d.getFullYear(),
        total: 0
      });
    }

    validRevenueOrders.forEach(order => {
      const orderDate = new Date(order.createdAt || Date.now());
      const m = orderDate.getMonth();
      const y = orderDate.getFullYear();
      const match = trends.find(t => t.monthNum === m && t.yearNum === y);
      if (match) {
        match.total += Number(order.totalCost) || 0;
      }
    });

    // 6. Comprehensive Inventory (T-Shirts, Ink, Packaging, Consumables)
    const allInventoryDocs = await Inventory.find().sort({ itemType: 1, color: 1 });

    const formatInvItem = (item) => {
      let category = "tshirt";
      let name = "";
      const threshold = item.minThreshold || 10;
      let status = "Good";
      if (item.quantity <= threshold) {
        status = "Critical";
      } else if (item.quantity <= threshold * 2) {
        status = "Warning";
      }

      if (item.itemType === "Plain T-Shirt") {
        category = "tshirt";
        name = `${item.tShirtType || "Plain T-Shirt"} (${item.color || "White"}, Size ${item.size || "M"}${item.gsm ? `, ${item.gsm}` : ""})`;
      } else if (item.itemType === "Printing Ink") {
        category = "ink";
        name = `Printing Ink - ${item.color || "Color"}`;
      } else if (["Transfer Paper", "Custom Consumable"].includes(item.itemType)) {
        category = "ink";
        name = `${item.itemType}${item.color && item.color !== "White" ? ` (${item.color})` : ""}`;
      } else {
        category = "packaging";
        name = `${item.itemType}${item.color && item.color !== "White" ? ` (${item.color})` : ""}`;
      }

      const maxQty = Math.max(item.quantity * 1.4, threshold * 3, 100);

      return {
        _id: item._id,
        itemType: item.itemType,
        tShirtType: item.tShirtType,
        category,
        name,
        qty: item.quantity,
        quantity: item.quantity,
        max: Math.round(maxQty),
        minThreshold: threshold,
        status,
        color: item.color,
        size: item.size,
        gsm: item.gsm,
        material: item.material,
        lastRestocked: item.lastRestocked
      };
    };

    const formattedAllInventory = allInventoryDocs.map(formatInvItem);
    const tShirtInventory = formattedAllInventory.filter(i => i.category === "tshirt");
    const inkInventory = formattedAllInventory.filter(i => i.category === "ink");
    const packagingInventory = formattedAllInventory.filter(i => i.category === "packaging");

    // 7. Operational Statistics
    const activeOrdersCount = allOrders.filter(o => ["Processing", "Printing", "Shipped"].includes(o.orderStatus)).length;
    const completedOrdersCount = allOrders.filter(o => ["Completed", "Delivered", "Collected"].includes(o.orderStatus)).length;
    const avgOrderValue = validRevenueOrders.length > 0 ? (grossRevenue / validRevenueOrders.length) : 0;

    res.json({
      grossRevenue,
      totalOrders: totalOrdersCount,
      customDesigns: customDesignsCount,
      popularColors: popularColors.slice(0, 4),
      bestSellers,
      monthlyTrends: trends,
      inventory: formattedAllInventory,
      tShirtInventory,
      inkInventory,
      packagingInventory,
      operationalStats: {
        activeOrders: activeOrdersCount,
        completedOrders: completedOrdersCount,
        avgOrderValue: Math.round(avgOrderValue)
      }
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ message: "Server error while generating analytics", error: error.message });
  }
};

// @desc    Update staff user password
// @route   PUT /api/admin/update-staff-password
exports.updateStaffPassword = async (req, res) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { userId, newPassword } = req.body;
    if (!userId || !newPassword) {
      return res.status(400).json({ message: "Please provide staff user ID and new password" });
    }

    const staff = await User.findOne({
      _id: userId,
      role: { $in: ["Manager", "Employee"] }
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff user not found" });
    }

    const salt = await bcrypt.genSalt(10);
    staff.passwordHash = await bcrypt.hash(newPassword, salt);
    await staff.save();

    res.json({ message: "Staff password updated successfully" });
  } catch (error) {
    console.error("Update staff password error:", error);
    res.status(500).json({ message: "Server error while updating password" });
  }
};

