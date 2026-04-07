const express = require("express");
const router = express.Router();

const eventController = require("../controllers/eventController");

const {
  createEvent,
  joinEvent,
  getAllEvents,
  assignReviewer,
  updateEventStatus,
  getAllReviewers,
  getStudentEvents,
  deleteReviewer,
  deleteEvent,
  getEventTracker,
} = eventController;

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

/* ADMIN CREATE EVENT */
router.post(
  "/create",
  authMiddleware,
  roleMiddleware(["admin"]),
  createEvent
);

/* STUDENT JOIN EVENT */
router.post(
  "/join",
  authMiddleware,
  roleMiddleware(["student"]),
  joinEvent
);

/* GET STUDENT EVENTS */
router.get(
  "/student",
  authMiddleware,
  roleMiddleware(["student"]),
  getStudentEvents
);

/* ADMIN ASSIGN REVIEWER */
router.put(
  "/assign-reviewer",
  authMiddleware,
  roleMiddleware(["admin"]),
  assignReviewer
);

/* ADMIN UPDATE STATUS */
router.put(
  "/status",
  authMiddleware,
  roleMiddleware(["admin"]),
  updateEventStatus
);

/* ADMIN GET ALL EVENTS */
router.get(
  "/all",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllEvents
);

/* ADMIN GET REVIEWERS */
router.get(
  "/reviewers",
  authMiddleware,
  roleMiddleware(["admin"]),
  getAllReviewers
);

/* ADMIN GET EVENT TRACKER */
router.get(
  "/tracker/:eventId",
  authMiddleware,
  roleMiddleware(["admin"]),
  getEventTracker
);

/* ADMIN DELETE REVIEWER */
router.delete(
  "/reviewer/:reviewerId",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteReviewer
);

router.get(
  "/reviewer",
  authMiddleware,
  roleMiddleware(["reviewer"]),
  eventController.getReviewerEvents
);
/* ADMIN DELETE EVENT */
router.delete(
  "/:eventId",
  authMiddleware,
  roleMiddleware(["admin"]),
  deleteEvent
);
module.exports = router;