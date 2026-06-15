const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "printsphere_jwt_secret_key_99";

// Helper to verify if the request comes from a authorized System Admin
const verifyAdmin = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === "Admin";
  } catch (err) {
    return false;
  }
};

// @desc    Get all active staff (Managers and Employees)
// @route   GET /api/admin/staff
exports.getStaffList = async (req, res) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const staff = await User.find({ role: { $in: ["Manager", "Employee"] } })
      .select("-passwordHash")
      .sort({ createdAt: -1 });

    res.json(staff);
  } catch (error) {
    console.error("Fetch staff list error:", error);
    res.status(500).json({ message: "Server error while fetching staff" });
  }
};

// @desc    Create a new Manager or Employee account
// @route   POST /api/admin/create-staff
exports.createStaffAccount = async (req, res) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const { name, email, password, role, phone, address } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please enter all required fields" });
    }

    if (role !== "Manager" && role !== "Employee") {
      return res.status(400).json({ message: "Role must be either Manager or Employee" });
    }

    // Check if email already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "An account already exists with this email" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save staff member
    const newStaff = await User.create({
      name,
      email,
      passwordHash,
      role,
      phone,
      address
    });

    res.status(201).json({
      message: `${role} account created successfully`,
      staff: {
        id: newStaff._id,
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role
      }
    });
  } catch (error) {
    console.error("Create staff account error:", error);
    res.status(500).json({ message: "Server error while creating staff account" });
  }
};


// @desc    Delete a staff account
// @route   DELETE /api/admin/delete-staff/:id
exports.deleteStaffAccount = async (req, res) => {
  try {
    if (!verifyAdmin(req)) {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    const deletedUser = await User.findOneAndDelete({
      _id: req.params.id,
      role: { $in: ["Manager", "Employee"] }
    });

    if (!deletedUser) {
      return res.status(404).json({ message: "Staff account not found or cannot be deleted" });
    }

    res.json({ message: `Account for ${deletedUser.name} deleted successfully` });
  } catch (error) {
    console.error("Delete staff account error:", error);
    res.status(500).json({ message: "Server error while deleting account" });
  }
};
