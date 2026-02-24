const Event = require("../models/Event");
const User = require("../models/User");
const generateEventCode = require("../utils/generateEventCode");

/* =========================================
   CREATE EVENT (ADMIN ONLY)
========================================= */
exports.createEvent = async (req, res) => {
  try {
    const { title, description, type, startDate, endDate } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({ message: "All required fields missing" });
    }

    const event = await Event.create({
      title,
      description,
      type,
      eventCode: generateEventCode(),
      createdBy: req.user.id,
      startDate,
      endDate,
      status: "active"
    });

    res.status(201).json({
      message: "Event created successfully",
      event
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================
   STUDENT JOIN EVENT
========================================= */
exports.joinEvent = async (req, res) => {
  try {
    const eventCode = req.body.eventCode?.trim();

    if (!eventCode) {
      return res.status(400).json({ message: "Event code required" });
    }

    const event = await Event.findOne({ eventCode });

    if (!event) {
      return res.status(404).json({ message: "Invalid event code" });
    }

    if (event.students.includes(req.user.id)) {
      return res.status(400).json({ message: "Already joined this event" });
    }

    event.students.push(req.user.id);
    await event.save();

    res.status(200).json({
      message: "Successfully joined event",
      event
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================
   ASSIGN REVIEWER TO EVENT (ADMIN ONLY)
========================================= */
exports.assignReviewer = async (req, res) => {
  try {
    const { eventId, reviewerId } = req.body;

    if (!eventId || !reviewerId) {
      return res.status(400).json({ message: "Event ID and Reviewer ID required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const reviewer = await User.findById(reviewerId);
    if (!reviewer) {
      return res.status(404).json({ message: "Reviewer not found" });
    }

    if (reviewer.role !== "reviewer") {
      return res.status(400).json({ message: "User is not a reviewer" });
    }

    if (event.reviewers.includes(reviewerId)) {
      return res.status(400).json({ message: "Reviewer already assigned" });
    }

    event.reviewers.push(reviewerId);
    await event.save();

    res.status(200).json({
      message: "Reviewer assigned successfully",
      event
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* =========================================
   UPDATE EVENT STATUS (Admin Only)
========================================= */
exports.updateEventStatus = async (req, res) => {
  try {
    const { eventId, status } = req.body;

    // Validate input
    if (!eventId || !status) {
      return res.status(400).json({
        message: "Event ID and status are required"
      });
    }

    // Allowed statuses from current schema
    const allowedStatuses = ["upcoming", "active", "completed"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status value"
      });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }

    event.status = status;
    await event.save();

    res.status(200).json({
      message: "Event status updated successfully"
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
/* =========================================
   GET ALL EVENTS (ADMIN)
========================================= */
exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
  .populate("reviewers", "name email");

    res.status(200).json(events);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
//get all reviewers
/* =========================================
   GET ALL REVIEWERS (ADMIN)
========================================= */
exports.getAllReviewers = async (req, res) => {
  try {
    const reviewers = await User.find({ role: "reviewer" })
      .select("-password");

    res.status(200).json(reviewers);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};