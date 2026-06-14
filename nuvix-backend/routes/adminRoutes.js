const express = require("express");
const router = express.Router();
const {
  getStaffList,
  createStaffAccount,
  updateStaffPassword,
  deleteStaffAccount
} = require("../controllers/adminController");

router.get("/staff", getStaffList);
router.post("/create-staff", createStaffAccount);
router.put("/update-staff-password", updateStaffPassword);
router.delete("/delete-staff/:id", deleteStaffAccount);

module.exports = router;
