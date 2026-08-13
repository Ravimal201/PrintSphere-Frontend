const express = require("express");
const router = express.Router();
const {
  getPricingRules,
  updatePricingRules,
  getInventory,
  updateStock,
  addInventoryItem,
  deleteInventoryItem,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  approveProduct,
  getOrders,
  updateOrderStatus,
  getEmployees,
  getTShirtStyles,
  createTShirtStyle,
  updateTShirtStyle,
  deleteTShirtStyle
} = require("../controllers/managerController");

router.get("/pricing-rules", getPricingRules);
router.put("/pricing-rules", updatePricingRules);

router.get("/inventory", getInventory);
router.post("/inventory", addInventoryItem);
router.put("/inventory/:id", updateStock);
router.delete("/inventory/:id", deleteInventoryItem);

router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.put("/products/:id/approve", approveProduct);

router.get("/orders", getOrders);
router.put("/orders/:id/status", updateOrderStatus);

router.get("/employees", getEmployees);

router.get("/tshirt-styles", getTShirtStyles);
router.post("/tshirt-styles", createTShirtStyle);
router.put("/tshirt-styles/:id", updateTShirtStyle);
router.delete("/tshirt-styles/:id", deleteTShirtStyle);

module.exports = router;
