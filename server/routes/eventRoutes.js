const express = require("express");
const router = express.Router();

const {
  createEvent,
  joinEvent,
  getAllEvents,
  assignReviewer,
  updateEventStatus,
  getAllReviewers
} = require("../controllers/eventController");


const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


/* =========================================
   ADMIN CREATE EVENT
========================================= */
router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["admin"]),
  createEvent
);


/* =========================================
   STUDENT JOIN EVENT
========================================= */
router.post(
  "/join",
  authMiddleware,
  roleMiddleware(["student"]),
  joinEvent
);


/* =========================================
   ADMIN ASSIGN REVIEWER
========================================= */
router.put(
  "/assign-reviewer",
  authMiddleware,
  roleMiddleware(["admin"]),
  assignReviewer
);
// Update Event Status (Admin)
router.put(
  "/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateEventStatus
);
//get all events for admin
router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllEvents
);
//get all reviwers which were created
router.get(
  "/reviewers",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllReviewers
);
module.exports = router;
