const express = require("express");
const router = express.Router();
const { 
  registerCustomer, 
  loginUser, 
  changePassword, 
  getStoreProducts, 
  getRecommendations, 
  getActivePricingRules,
  createOrder,
  getCustomerOrders,
  saveCustomerDesign,
  getCustomerDesigns
} = require("../controllers/authController");

router.post("/register", registerCustomer);
router.post("/login", loginUser);
router.put("/change-password", changePassword);
router.get("/products", getStoreProducts);
router.get("/recommendations", getRecommendations);
router.get("/pricing-rules", getActivePricingRules);

// Orders and Designs for customers
router.post("/orders", createOrder);
router.get("/orders", getCustomerOrders);
router.post("/designs", saveCustomerDesign);
router.get("/designs", getCustomerDesigns);

module.exports = router;
