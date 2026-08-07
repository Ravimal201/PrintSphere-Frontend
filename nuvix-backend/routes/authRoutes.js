const express = require("express");
const router = express.Router();
const { 
  registerCustomer, 
  loginUser, 
  changePassword, 
  getStoreProducts, 
  getRecommendations, 
  trackUserActivity,
  getActivePricingRules,
  createOrder,
  getCustomerOrders,
  saveCustomerDesign,
  getCustomerDesigns,
  getTShirtStylesPublic,
  getUserProfile,
  updateUserProfile,
  updateOrderAddress
} = require("../controllers/authController");

router.post("/register", registerCustomer);
router.post("/login", loginUser);
router.put("/change-password", changePassword);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.get("/products", getStoreProducts);
router.get("/recommendations", getRecommendations);
router.post("/activity", trackUserActivity);
router.get("/pricing-rules", getActivePricingRules);
router.get("/tshirt-styles", getTShirtStylesPublic);

// Orders and Designs for customers
router.post("/orders", createOrder);
router.get("/orders", getCustomerOrders);
router.put("/orders/:orderId/address", updateOrderAddress);
router.post("/designs", saveCustomerDesign);
router.get("/designs", getCustomerDesigns);

module.exports = router;

