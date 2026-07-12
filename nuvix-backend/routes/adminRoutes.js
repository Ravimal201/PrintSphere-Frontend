const express = require("express");
const router = express.Router();
const {
  getStaffList,
  createStaffAccount,
  deleteStaffAccount,
  getAnalytics,
  updateStaffPassword
} = require("../controllers/adminController");

router.get("/staff", getStaffList);
router.post("/create-staff", createStaffAccount);
router.delete("/delete-staff/:id", deleteStaffAccount);
router.get("/analytics", getAnalytics);
router.put("/update-staff-password", updateStaffPassword);

module.exports = router;
