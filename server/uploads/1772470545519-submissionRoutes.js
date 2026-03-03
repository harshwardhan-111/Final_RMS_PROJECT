const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  uploadSubmission,
  getMySubmissions,
  getReviewerSubmissions,
  reviewSubmission
} = require("../controllers/submissionController");


const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

// Student upload
router.post(
  "/upload",
  authMiddleware,
  roleMiddleware(["student"]),
  upload.single("projectFile"),
  uploadSubmission
);
router.get(
  "/my",
  authMiddleware,
  roleMiddleware(["student"]),
  getMySubmissions
);
router.get(
  "/reviewer",
  authMiddleware,
  roleMiddleware(["reviewer"]),
  getReviewerSubmissions
);

router.put(
  "/review",
  authMiddleware,
  roleMiddleware(["reviewer"]),
  reviewSubmission
);
module.exports = router;
