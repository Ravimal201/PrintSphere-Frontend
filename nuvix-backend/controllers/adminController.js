const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

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

    // 1. Gross Revenue
    const paidOrders = await Order.find({ paymentStatus: "Paid" });
    const grossRevenue = paidOrders.reduce((sum, order) => sum + order.totalCost, 0);

    // 2. Total Orders
    const totalOrdersCount = await Order.countDocuments();

    // 3. Custom Designs
    const customDesignsCount = await CustomizedDesign.countDocuments();

    // 4. Popular Fabric Colors
    const popularColors = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.selectedColor",
          count: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: [ { $ifNull: ["$items.price", 0] }, { $ifNull: ["$items.quantity", 0] } ] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 4 } // Top 4 colors to fit UI
    ]);

    const formattedColors = popularColors.map(c => ({
      color: c._id,
      count: c.count,
      revenue: c.revenue
    }));

    // Fill in defaults if not enough colors
    const defaultColors = ["White", "Black", "Navy Blue", "Red"];
    defaultColors.forEach((color) => {
      if (!formattedColors.some(c => c.color.toLowerCase() === color.toLowerCase())) {
        formattedColors.push({ color, count: 0, revenue: 0 });
      }
    });

    // 5. Best-Selling Products
    const bestSellers = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: {
            productId: "$items.productId",
            designId: "$items.designId"
          },
          salesCount: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: [ { $ifNull: ["$items.price", 0] }, { $ifNull: ["$items.quantity", 0] } ] } }
        }
      },
      { $sort: { salesCount: -1 } },
      { $limit: 4 }
    ]);

    const populatedBestSellers = [];
    for (let i = 0; i < bestSellers.length; i++) {
      const item = bestSellers[i];
      let name = "Customized Design";
      if (item._id.productId) {
        const Product = require("../models/Product");
        const prod = await Product.findById(item._id.productId);
        if (prod) name = prod.name;
      } else if (item._id.designId) {
        const d = await CustomizedDesign.findById(item._id.designId);
        if (d) name = d.title || "Custom T-Shirt Design";
      }
      populatedBestSellers.push({
        rank: i + 1,
        name,
        sales: item.salesCount,
        revenue: `Rs. ${item.revenue.toLocaleString()}`
      });
    }

    // 6. Monthly Sales Trends (Past 6 months)
    const monthlyData = await Order.aggregate([
      { $match: { paymentStatus: "Paid" } },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          total: { $sum: "$totalCost" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 6 }
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const trends = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      trends.push({
        month: monthNames[d.getMonth()],
        year: d.getFullYear(),
        monthNum: d.getMonth() + 1,
        total: 0
      });
    }

    for (const m of monthlyData) {
      const match = trends.find(t => t.monthNum === m._id.month && t.year === m._id.year);
      if (match) {
        match.total = m.total;
      }
    }

    const formattedTrends = trends.map(t => ({
      month: t.month,
      year: t.year,
      total: t.total
    }));

    res.json({
      grossRevenue,
      totalOrders: totalOrdersCount,
      customDesigns: customDesignsCount,
      popularColors: formattedColors.slice(0, 4),
      bestSellers: populatedBestSellers,
      monthlyTrends: formattedTrends
    });
  } catch (error) {
    console.error("Get analytics error:", error);
    res.status(500).json({ message: "Server error while generating analytics" });
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

