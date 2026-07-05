const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Inventory = require("../models/Inventory");
const PricingRules = require("../models/PricingRules");
const CustomizedDesign = require("../models/CustomizedDesign");
const TShirtStyle = require("../models/TShirtStyle");
const { createNotification } = require("../utils/notificationHelper");

const JWT_SECRET = process.env.JWT_SECRET || "printsphere_jwt_secret_key_99";

// Helper to verify if the request comes from an authorized Manager
const verifyManager = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === "Manager" || decoded.role === "Admin";
  } catch (err) {
    return false;
  }
};

// ================= PRICING RULES =================

// @desc    Get active pricing rules
// @route   GET /api/manager/pricing-rules
exports.getPricingRules = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    let rules = await PricingRules.findOne({ isActive: true });
    if (!rules) {
      // Seed default rules if none exist
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
    console.error("Get pricing rules error:", error);
    res.status(500).json({ message: "Server error while fetching pricing rules" });
  }
};

// @desc    Update active pricing rules
// @route   PUT /api/manager/pricing-rules
exports.updatePricingRules = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const { baseRates, materialPremiums, costPerSqIn, complexityFeePerLayer, volumeDiscount } = req.body;

    const rules = await PricingRules.findOneAndUpdate(
      { isActive: true },
      { baseRates, materialPremiums, costPerSqIn, complexityFeePerLayer, volumeDiscount },
      { new: true, upsert: true }
    );

    res.json({ message: "Pricing rules updated successfully", rules });
  } catch (error) {
    console.error("Update pricing rules error:", error);
    res.status(500).json({ message: "Server error while updating pricing rules" });
  }
};

// ================= INVENTORY =================

// @desc    Get inventory items and stock trends
// @route   GET /api/manager/inventory
exports.getInventory = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    // Auto-seed default inventory if empty
    const count = await Inventory.countDocuments();
    if (count === 0) {
      await Inventory.insertMany([
        { itemType: "Plain T-Shirt", tShirtType: "Crew Neck", color: "White", size: "M", material: "Cotton", quantity: 120, minThreshold: 15 },
        { itemType: "Plain T-Shirt", tShirtType: "V-Neck", color: "Navy Blue", size: "L", material: "Cotton", quantity: 8, minThreshold: 15 },
        { itemType: "Plain T-Shirt", tShirtType: "Polo", color: "Black", size: "XL", material: "Organic Cotton", quantity: 45, minThreshold: 10 },
        { itemType: "Printing Ink", color: "Cyan", quantity: 3, minThreshold: 5 },
        { itemType: "Transfer Paper", quantity: 150, minThreshold: 50 }
      ]);
    }

    const inventory = await Inventory.find().sort({ itemType: 1 });
    res.json(inventory);
  } catch (error) {
    console.error("Fetch inventory error:", error);
    res.status(500).json({ message: "Server error while fetching inventory" });
  }
};

// @desc    Update stock quantities
// @route   PUT /api/manager/inventory/:id
exports.updateStock = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const { quantity } = req.body;
    const updated = await Inventory.findByIdAndUpdate(
      req.params.id,
      { quantity, lastRestocked: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Check if item went below threshold and create alert notifications
    if (updated.quantity <= updated.minThreshold) {
      const itemDesc = updated.tShirtType 
        ? `${updated.tShirtType} T-Shirt (${updated.color}, Size ${updated.size})` 
        : updated.itemType;
      const alertMsg = `${itemDesc} has fallen below minimum threshold! Current stock: ${updated.quantity} (Threshold: ${updated.minThreshold}).`;
      
      await createNotification({
        recipientRole: "Admin",
        title: "Low Stock Alert",
        message: alertMsg,
        type: "Low Stock"
      });

      await createNotification({
        recipientRole: "Manager",
        title: "Low Stock Alert",
        message: alertMsg,
        type: "Low Stock"
      });
    }

    res.json({ message: "Stock updated successfully", item: updated });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({ message: "Server error while updating stock" });
  }
};

// ================= STORE PRODUCTS & APPROVALS =================

// @desc    Get all store products (including drafts needing approval)
// @route   GET /api/manager/products
exports.getProducts = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    // Auto-seed default store products if empty
    const count = await Product.countDocuments();
    if (count === 0) {
      await Product.insertMany([
        { title: "Retro Mountain Adventure", description: "Vibrant retro mountains printed on soft crew neck cotton T-shirt.", category: "Nature Collection", basePrice: 21.05, sizes: ["S", "M", "L"], colors: ["White"], images: ["/images/dumyImage.png"], status: "Active", isApproved: true },
        { title: "Minimalist Pine Silhouette", description: "Monochrome forest trees custom layout.", category: "Nature Collection", basePrice: 19.50, sizes: ["M", "L", "XL"], colors: ["Black"], images: ["/images/dumyImage.png"], status: "Draft", isApproved: false } // Employee Draft
      ]);
    }

    const products = await Product.find().populate("createdBy", "name").sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ message: "Server error while fetching catalog products" });
  }
};

// @desc    Approve/Publish product created by employee
// @route   PUT /api/manager/products/:id/approve
exports.approveProduct = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const { action } = req.body; // "approve" or "reject"
    
    let updateData = { isApproved: action === "approve" };
    if (action === "approve") {
      updateData.status = "Active";
    } else {
      updateData.status = "Archived";
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ 
      message: action === "approve" ? "Product approved & published to store!" : "Product rejected and archived.",
      product: updated 
    });
  } catch (error) {
    console.error("Approve product error:", error);
    res.status(500).json({ message: "Server error while approving product" });
  }
};

// ================= CUSTOMER ORDERS =================

// @desc    Get all customer orders
// @route   GET /api/manager/orders
exports.getOrders = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    // Auto-seed dummy orders if empty
    const count = await Order.countDocuments();
    if (count === 0) {
      await Order.create({
        guestEmail: "customer1@example.com",
        items: [
          { itemType: "Customized", quantity: 2, size: "M", color: "White", material: "Cotton", unitPrice: 21.05 }
        ],
        subtotal: 38.00,
        printCost: 7.05,
        complexityFee: 2.00,
        discount: 0,
        totalCost: 42.10,
        paymentStatus: "Paid",
        orderStatus: "Processing",
        shippingAddress: { street: "12 Gully Rd", city: "Colombo", country: "Sri Lanka" },
        timeline: [
          { status: "Pending Payment", note: "Order placed by customer" },
          { status: "Processing", note: "Manager approved order. Sent to printing queue." }
        ]
      });
    }

    const orders = await Order.find()
      .populate("assignedEmployee", "name")
      .populate("items.productId")
      .populate("items.designId")
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Fetch orders error:", error);
    res.status(500).json({ message: "Server error while fetching customer orders" });
  }
};

// @desc    Approve/Reject or update order workflow status
// @route   PUT /api/manager/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const { status, note, assignedEmployeeId } = req.body;

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const prevEmployee = order.assignedEmployee;

    if (status) {
      order.orderStatus = status;
      order.timeline.push({ status, note: note || `Status updated to ${status}` });
    }

    if (assignedEmployeeId) {
      order.assignedEmployee = assignedEmployeeId;
    }

    await order.save();

    // Trigger notification if assigned employee changed/assigned
    if (assignedEmployeeId && (!prevEmployee || prevEmployee.toString() !== assignedEmployeeId.toString())) {
      await createNotification({
        recipientId: assignedEmployeeId,
        title: "New Print Task Assigned",
        message: `You have been assigned to print Order #${order._id}.`,
        type: "New Print Task"
      });
    }

    // Trigger notification if status was updated
    if (status) {
      const msg = `Order #${order._id} status has been updated to "${status}" by manager.`;
      if (order.customerId) {
        await createNotification({
          recipientId: order.customerId,
          title: `Order Update: ${status}`,
          message: `Your order #${order._id} has progressed to: ${status}.`,
          type: "Order Update"
        });
      }
      await createNotification({
        recipientRole: "Admin",
        title: `Order #${order._id} Status: ${status}`,
        message: msg,
        type: "Order Update"
      });
      await createNotification({
        recipientRole: "Manager",
        title: `Order #${order._id} Status: ${status}`,
        message: msg,
        type: "Order Update"
      });
    }

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ message: "Server error while updating order" });
  }
};

// @desc    Get all employees
// @route   GET /api/manager/employees
exports.getEmployees = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }
    const employees = await User.find({ role: "Employee" }).select("-passwordHash").sort({ name: 1 });
    res.json(employees);
  } catch (error) {
    console.error("Fetch employees error:", error);
    res.status(500).json({ message: "Server error while fetching employees" });
  }
};

// @desc    Create a product
// @route   POST /api/manager/products
exports.createProduct = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const { title, description, category, basePrice, sizes, colors, images, status, discount, modelPath, defaultColor, layers } = req.body;

    if (!title || !description || !category || basePrice === undefined) {
      return res.status(400).json({ message: "Please provide all required product fields" });
    }

    const token = req.headers.authorization.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const product = await Product.create({
      title,
      description,
      category,
      basePrice,
      sizes: sizes || ["S", "M", "L"],
      colors: colors || ["White"],
      images: images && images.length > 0 ? images : ["/images/dumyImage.png"],
      status: status || "Active",
      isApproved: true,
      createdBy: decoded.id,
      discount: discount || 0,
      modelPath: modelPath || "/images/models/male normal t-shirt1.glb",
      defaultColor: defaultColor || "#ffffff",
      layers: layers || []
    });

    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({ message: "Server error while creating product" });
  }
};

// @desc    Update a product
// @route   PUT /api/manager/products/:id
exports.updateProduct = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const { title, description, category, basePrice, sizes, colors, images, status, isApproved, discount, modelPath, defaultColor, layers } = req.body;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        category,
        basePrice,
        sizes,
        colors,
        images,
        status,
        isApproved,
        discount,
        modelPath,
        defaultColor,
        layers
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product updated successfully", product: updated });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ message: "Server error while updating product" });
  }
};

// @desc    Delete a product
// @route   DELETE /api/manager/products/:id
exports.deleteProduct = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Server error while deleting product" });
  }
};

// ================= T-SHIRT STYLES =================

// @desc    Get all T-shirt styles, auto-seeding defaults if empty
// @route   GET /api/manager/tshirt-styles
exports.getTShirtStyles = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

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
    console.error("Get tshirt styles error:", error);
    res.status(500).json({ message: "Server error while fetching tshirt styles" });
  }
};

// @desc    Create a new T-shirt style
// @route   POST /api/manager/tshirt-styles
exports.createTShirtStyle = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const { name, path, type, price, gsms, gsmPrices, colors } = req.body;
    if (!name || !path) {
      return res.status(400).json({ message: "Please provide style name and model path" });
    }

    const style = await TShirtStyle.create({
      name,
      path,
      type: type || "Crew Neck",
      price: Number(price) || 0,
      gsms: gsmPrices ? gsmPrices.map(gp => gp.gsm) : (gsms || ["180GSM"]),
      gsmPrices: gsmPrices || [],
      colors: colors || [{ name: "White", value: "#ffffff" }]
    });

    res.status(201).json({ message: "T-Shirt style created successfully", style });
  } catch (error) {
    console.error("Create tshirt style error:", error);
    res.status(500).json({ message: "Server error while creating tshirt style" });
  }
};

// @desc    Update an existing T-shirt style
// @route   PUT /api/manager/tshirt-styles/:id
exports.updateTShirtStyle = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const { name, path, type, price, gsms, gsmPrices, colors } = req.body;
    const updated = await TShirtStyle.findByIdAndUpdate(
      req.params.id,
      {
        name,
        path,
        type: type || "Crew Neck",
        price: Number(price) || 0,
        gsms: gsmPrices ? gsmPrices.map(gp => gp.gsm) : (gsms || ["180GSM"]),
        gsmPrices: gsmPrices || [],
        colors
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "T-Shirt style not found" });
    }

    res.json({ message: "T-Shirt style updated successfully", style: updated });
  } catch (error) {
    console.error("Update tshirt style error:", error);
    res.status(500).json({ message: "Server error while updating tshirt style" });
  }
};

// @desc    Delete a T-shirt style
// @route   DELETE /api/manager/tshirt-styles/:id
exports.deleteTShirtStyle = async (req, res) => {
  try {
    if (!verifyManager(req)) {
      return res.status(403).json({ message: "Access denied. Manager role required." });
    }

    const deleted = await TShirtStyle.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "T-Shirt style not found" });
    }

    res.json({ message: "T-Shirt style deleted successfully" });
  } catch (error) {
    console.error("Delete tshirt style error:", error);
    res.status(500).json({ message: "Server error while deleting tshirt style" });
  }
};
