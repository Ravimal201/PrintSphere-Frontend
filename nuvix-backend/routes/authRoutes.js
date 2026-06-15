const express = require("express");
const router = express.Router();
const { registerCustomer, loginUser, changePassword } = require("../controllers/authController");

router.post("/register", registerCustomer);
router.post("/login", loginUser);
router.put("/change-password", changePassword);

module.exports = router;
