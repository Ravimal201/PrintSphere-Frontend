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
  deleteCustomerDesign,
  getTShirtStylesPublic,
  getUserProfile,
  updateUserProfile,
  updateOrderAddress,
  updateUserPaymentMethod
} = require("../controllers/authController");

router.post("/register", registerCustomer);
router.post("/login", loginUser);
router.put("/change-password", changePassword);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.put("/update-profile", updateUserProfile);
router.put("/payment-method", updateUserPaymentMethod);
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
router.delete("/designs/:id", deleteCustomerDesign);

module.exports = router;


