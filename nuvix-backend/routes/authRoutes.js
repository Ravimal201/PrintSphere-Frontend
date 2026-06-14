const express = require("express");
const router = express.Router();
const { registerCustomer, loginUser } = require("../controllers/authController");

router.post("/register", registerCustomer);
router.post("/login", loginUser);

module.exports = router;
