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

    let initialStatus = "upcoming";
    if (startDate && endDate) {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (now >= start && now <= end) {
        initialStatus = "active";
      } else if (now > end) {
        initialStatus = "completed";
      }
    }

    const event = await Event.create({
      title,
      description,
      type,
      eventCode: generateEventCode(),
      createdBy: req.user.id,
      startDate,
      endDate,
      status: initialStatus
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
const updateStatusesByDate = async (events) => {
  const now = new Date();
  for (let event of events) {
    let newStatus = event.status;
    if (event.startDate && event.endDate) {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      if (now < start) newStatus = "upcoming";
      else if (now >= start && now <= end) newStatus = "active";
      else if (now > end) newStatus = "completed";

      if (newStatus !== event.status) {
        event.status = newStatus;
        await event.save();
      }
    }
  }
  return events;
};

/* =========================================
   GET ALL EVENTS (ADMIN)
========================================= */
exports.getAllEvents = async (req, res) => {
  try {
    let events = await Event.find()
      .populate("reviewers", "name email");

    events = await updateStatusesByDate(events);

    res.status(200).json(events);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
/* =========================================
   GET ALL REVIEWERS (ADMIN)
========================================= */
exports.getAllReviewers = async (req, res) => {
  try {
    const reviewers = await User.find({ role: "reviewer" }).lean();

    for (let reviewer of reviewers) {
      const events = await Event.find({ reviewers: reviewer._id });
      reviewer.assignedEvents = events;
      reviewer.studentCount = events.reduce((acc, ev) => acc + ev.students.length, 0);
    }

    res.status(200).json(reviewers);

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

/* =========================================
   DELETE REVIEWER (ADMIN)
========================================= */
exports.deleteReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.params;

    // Remove reviewer from all events
    await Event.updateMany(
      { reviewers: reviewerId },
      { $pull: { reviewers: reviewerId } }
    );

    // Delete the user
    await User.findByIdAndDelete(reviewerId);

    res.status(200).json({ message: "Reviewer deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* =========================================
   GET STUDENT JOINED EVENTS
========================================= */
exports.getStudentEvents = async (req, res) => {
  try {
    let events = await Event.find({
      students: req.user.id
    }).sort({ createdAt: -1 });

    events = await updateStatusesByDate(events);

    res.status(200).json(events);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
/* =========================================
   GET REVIEWER ASSIGNED EVENTS
========================================= */
exports.getReviewerEvents = async (req, res) => {
  try {
    let events = await Event.find({
      reviewers: req.user.id
    }).sort({ createdAt: -1 });

    events = await updateStatusesByDate(events);

    res.status(200).json(events);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};