const express = require("express");
const router = express.Router();
const {
  getStaffList,
  createStaffAccount,
  deleteStaffAccount,
  getAnalytics,
  updateStaffPassword,
  getCustomerSatisfactionReviews
} = require("../controllers/adminController");

router.get("/staff", getStaffList);
router.post("/create-staff", createStaffAccount);
router.delete("/delete-staff/:id", deleteStaffAccount);
router.get("/analytics", getAnalytics);
router.put("/update-staff-password", updateStaffPassword);
router.get("/reviews", getCustomerSatisfactionReviews);

module.exports = router;
