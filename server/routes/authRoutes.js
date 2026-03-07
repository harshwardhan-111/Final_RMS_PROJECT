const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);

router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
module.exports = router;
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/protected",
  authMiddleware,
  roleMiddleware(["student", "reviewer"]),
  (req, res) => {
    res.json({
      message: "You accessed protected route",
      user: req.user,
    });
  }
);
