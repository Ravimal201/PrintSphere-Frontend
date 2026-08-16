const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");
const CustomizedDesign = require("../models/CustomizedDesign");
const { createNotification } = require("../utils/notificationHelper");
const { formatGsm } = require("../utils/colorHelper");


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
      .populate("customerId", "name email phone")
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

const Inventory = require("../models/Inventory");

const PACKAGING_REQUIREMENTS = [
  { key: "sticker", label: "Sticker", keywords: ["sticker", "stickers", "packaging sticker", "label"] },
  { key: "packaging", label: "Packaging", keywords: ["packaging", "package", "packaging bag", "packaging box", "poly mailer", "bag"] },
  { key: "tape", label: "Tape", keywords: ["tape", "tapes", "packaging tape", "sealing tape"] },
  { key: "transferPaper", label: "Transfer Paper", keywords: ["transfer paper", "transferpaper", "sublimation paper", "heat transfer paper"] }
];

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

    if (status === "Cancelled") {
      return res.status(403).json({ message: "Employees cannot cancel orders. Only managers are authorized to cancel orders." });
    }

    const order = await Order.findOne({ _id: req.params.id, assignedEmployee: decoded.id });
    if (!order) {
      return res.status(404).json({ message: "Assigned order not found" });
    }

    if (order.orderStatus === "Cancelled") {
      return res.status(400).json({ message: "This order was cancelled by the manager and cannot be updated." });
    }

    // When status changes to "Completed", verify and deduct packaging consumables (1 unit each of sticker, packaging, tape, transfer paper per item quantity)
    if (status === "Completed" && !order.packagingDeducted) {
      const totalGarmentQty = (order.items && order.items.length > 0)
        ? order.items.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0)
        : (Number(order.quantity) || 1);

      const allInventory = await Inventory.find();
      const missingMaterials = [];
      const itemsToDeduct = [];

      for (const pkg of PACKAGING_REQUIREMENTS) {
        let invDoc = allInventory.find(inv => {
          const itType = (inv.itemType || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "").trim();
          const tType = (inv.tShirtType || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "").trim();
          return pkg.keywords.some(kw => {
            const cleanKw = kw.toString().toLowerCase().replace(/[^a-z0-9]/g, "").trim();
            return itType === cleanKw || itType.includes(cleanKw) || tType.includes(cleanKw);
          });
        });

        if (!invDoc) {
          // Auto create initial stock if missing
          invDoc = await Inventory.create({
            itemType: pkg.label,
            quantity: 100,
            minThreshold: 20
          });
          allInventory.push(invDoc);
        }

        const availableQty = invDoc ? invDoc.quantity : 0;
        if (availableQty < totalGarmentQty) {
          missingMaterials.push({
            name: pkg.label,
            required: totalGarmentQty,
            available: availableQty
          });
        } else {
          itemsToDeduct.push({
            invDoc,
            deductQty: totalGarmentQty,
            name: pkg.label
          });
        }
      }

      if (missingMaterials.length > 0) {
        const shortageDetails = missingMaterials
          .map(m => `• ${m.name}: requires ${m.required} units, only ${m.available} available in inventory`)
          .join("\n");

        return res.status(400).json({
          message: "not enouugh materials for packge",
          details: shortageDetails,
          missingMaterials: missingMaterials
        });
      }

      // Deduct packaging materials from inventory
      for (const deduction of itemsToDeduct) {
        const updatedInv = await Inventory.findByIdAndUpdate(
          deduction.invDoc._id,
          {
            $inc: { quantity: -deduction.deductQty },
            lastRestocked: new Date()
          },
          { new: true }
        );

        console.log(`Packaging material reduced for Completed order: ${deduction.name} reduced ${deduction.deductQty}, remaining ${updatedInv.quantity}`);

        if (updatedInv && updatedInv.quantity <= updatedInv.minThreshold) {
          const alertMsg = `Packaging consumable "${deduction.name}" is low in stock! Remaining: ${updatedInv.quantity} (Threshold: ${updatedInv.minThreshold}).`;
          await createNotification({
            recipientRole: "Manager",
            title: "Low Packaging Stock Alert",
            message: alertMsg,
            type: "Low Stock"
          });
          await createNotification({
            recipientRole: "Admin",
            title: "Low Packaging Stock Alert",
            message: alertMsg,
            type: "Low Stock"
          });
        }
      }

      order.packagingDeducted = true;
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

    // Trigger notifications for status updates (production progress)
    if (status) {
      const msg = `Order #${order._id} status has been updated to "${status}" by printing operator.`;
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

    const { title, description, category, basePrice, sizes, gsms, colors, images, modelPath, defaultColor, layers } = req.body;

    if (!title || !description || !category || basePrice === undefined) {
      return res.status(400).json({ message: "Please provide all required product fields" });
    }

    const product = await Product.create({
      title,
      description,
      category,
      basePrice,
      sizes: sizes || ["S", "M", "L"],
      gsms: (gsms || ["GSM 180", "GSM 200", "GSM 220", "GSM 240"]).map(formatGsm),
      gsm: formatGsm(gsms?.[0] || "GSM 180"),
      colors: colors || ["White"],
      images: images && images.length > 0 ? images : ["/images/dumyImage.png"],
      status: "Draft",
      isApproved: false,
      createdBy: decoded.id,
      modelPath: modelPath || "/images/models/male normal t-shirt1.glb",
      defaultColor: defaultColor || "#ffffff",
      layers: layers || []
    });

    res.status(201).json({ message: "Design concept submitted for manager approval", product });
  } catch (error) {
    console.error("Submit product concept error:", error);
    try {
      require("fs").appendFileSync(
        require("path").join(__dirname, "..", "error_log.txt"),
        `[${new Date().toISOString()}] Submit Product Concept Error:\n${error.stack || error}\nPayload:\n${JSON.stringify(req.body, null, 2)}\n\n`
      );
    } catch (fsErr) {
      console.error("Failed to write to error_log.txt:", fsErr);
    }
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
