const express = require("express");
const router = express.Router();
const { registerCustomer, loginUser, changePassword, getStoreProducts, getRecommendations, getActivePricingRules } = require("../controllers/authController");

router.post("/register", registerCustomer);
router.post("/login", loginUser);
router.put("/change-password", changePassword);
router.get("/products", getStoreProducts);
router.get("/recommendations", getRecommendations);
router.get("/pricing-rules", getActivePricingRules);

module.exports = router;
