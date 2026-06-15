const express = require("express");
const router = express.Router();
const {
  getAssignedOrders,
  updateAssignedOrderStatus,
  submitProductConcept,
  getMyProducts
} = require("../controllers/employeeController");

router.get("/orders", getAssignedOrders);
router.put("/orders/:id/status", updateAssignedOrderStatus);
router.get("/products", getMyProducts);
router.post("/products", submitProductConcept);

module.exports = router;
