const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const JWT_SECRET = process.env.JWT_SECRET || "printsphere_jwt_secret_key_99";

// Helper to verify if the request comes from an authorized Employee
const verifyEmployee = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === "Employee" || decoded.role === "Admin";
  } catch (err) {
    return false;
  }
};

// @desc    Get all orders assigned to the logged-in employee
// @route   GET /api/employee/orders
exports.getAssignedOrders = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization denied" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "Employee" && decoded.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Employee role required." });
    }

    const orders = await Order.find({ assignedEmployee: decoded.id })
      .populate("assignedEmployee", "name")
      .populate("items.productId")
      .populate("items.designId")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Fetch assigned orders error:", error);
    res.status(500).json({ message: "Server error while fetching assigned orders" });
  }
};

// @desc    Update status of an assigned order
// @route   PUT /api/employee/orders/:id/status
exports.updateAssignedOrderStatus = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization denied" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "Employee" && decoded.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Employee role required." });
    }

    const { status, note } = req.body;

    const order = await Order.findOne({ _id: req.params.id, assignedEmployee: decoded.id });
    if (!order) {
      return res.status(404).json({ message: "Assigned order not found" });
    }

    if (status) {
      order.orderStatus = status;
      order.timeline.push({ 
        status, 
        note: note || `Status updated to ${status} by Employee`,
        updatedBy: decoded.id
      });
    }

    await order.save();
    
    // Return populated order
    const updated = await Order.findById(order._id)
      .populate("assignedEmployee", "name")
      .populate("items.productId")
      .populate("items.designId");

    res.json({ message: "Order status updated successfully", order: updated });
  } catch (error) {
    console.error("Update assigned order status error:", error);
    res.status(500).json({ message: "Server error while updating order" });
  }
};

// @desc    Submit a new T-shirt design concept for manager approval
// @route   POST /api/employee/products
exports.submitProductConcept = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization denied" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "Employee" && decoded.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Employee role required." });
    }

    const { title, description, category, basePrice, sizes, colors, images } = req.body;

    if (!title || !description || !category || basePrice === undefined) {
      return res.status(400).json({ message: "Please provide all required product fields" });
    }

    const product = await Product.create({
      title,
      description,
      category,
      basePrice,
      sizes: sizes || ["S", "M", "L"],
      colors: colors || ["White"],
      images: images && images.length > 0 ? images : ["/images/dumyImage.png"],
      status: "Draft",
      isApproved: false,
      createdBy: decoded.id
    });

    res.status(201).json({ message: "Design concept submitted for manager approval", product });
  } catch (error) {
    console.error("Submit product concept error:", error);
    res.status(500).json({ message: "Server error while submitting product concept" });
  }
};

// @desc    Get all designs submitted by the logged-in employee
// @route   GET /api/employee/products
exports.getMyProducts = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authorization denied" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    if (decoded.role !== "Employee" && decoded.role !== "Admin") {
      return res.status(403).json({ message: "Access denied. Employee role required." });
    }

    const products = await Product.find({ createdBy: decoded.id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("Fetch employee designs error:", error);
    res.status(500).json({ message: "Server error while fetching designs" });
  }
};
