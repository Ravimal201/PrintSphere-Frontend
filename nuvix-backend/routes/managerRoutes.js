const express = require("express");
const router = express.Router();
const {
  getPricingRules,
  updatePricingRules,
  getInventory,
  updateStock,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  approveProduct,
  getOrders,
  updateOrderStatus,
  getEmployees
} = require("../controllers/managerController");

router.get("/pricing-rules", getPricingRules);
router.put("/pricing-rules", updatePricingRules);

router.get("/inventory", getInventory);
router.put("/inventory/:id", updateStock);

router.get("/products", getProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
router.put("/products/:id/approve", approveProduct);

router.get("/orders", getOrders);
router.put("/orders/:id/status", updateOrderStatus);

router.get("/employees", getEmployees);

module.exports = router;
