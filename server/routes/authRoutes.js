const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

module.exports = router;
const authMiddleware = require("../middleware/authMiddleware");
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
