const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 🔹 Generate JWT
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// 🔹 Register (Handles both Student public registration and Admin creating a Reviewer)
exports.register = async (req, res) => {
  try {
    // Note: Public registration form should send role: "student"
    // Admin dashboard sends role: "reviewer"
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    // Default to student if no role is provided (Req 1: Registration module only student can register)
    const assignedRole = role || "student";

    if (!["student", "reviewer"].includes(assignedRole)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Encrypt the password for the standard login flow
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user object
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: assignedRole,
    };

    // If Admin is creating a reviewer, save the plain password so Admin can view it later
    if (assignedRole === "reviewer") {
      userData.plainPassword = password;
    }

    const user = await User.create(userData);

    res.status(201).json({
      message: `${assignedRole.charAt(0).toUpperCase() + assignedRole.slice(1)} registered successfully`,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Login (Reviewer uses email and the password admin created, Student uses their own)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Fetch the user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Compare the entered password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    res.json({
      message: "Login successful",
      token: generateToken(user._id, user.role),
      role: user.role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ... existing register and login functions ...

// 🔹 Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+plainPassword');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 🔹 Update Student Profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, collegeName, phoneNumber, degree } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id, 
      { name, collegeName, phoneNumber, degree }, 
      { new: true }
    );
    
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};