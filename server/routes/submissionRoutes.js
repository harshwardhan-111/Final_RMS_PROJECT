const express = require("express");
const router = express.Router();
const multer = require("multer");

const {
  uploadSubmission,
  getMySubmissions,
  getReviewerSubmissions,
  reviewSubmission,
  acceptAIReview,
  rejectAIReview,
  submitManualReview,
  deleteSubmission
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

router.post(
  "/accept",
  authMiddleware,
  roleMiddleware(["reviewer"]),
  acceptAIReview
);

router.post(
  "/reject",
  authMiddleware,
  roleMiddleware(["reviewer"]),
  rejectAIReview
);

router.post(
  "/manual-review",
  authMiddleware,
  roleMiddleware(["reviewer"]),
  submitManualReview
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["student"]),
  deleteSubmission
);

module.exports = router;
