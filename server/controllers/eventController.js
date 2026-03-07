const Event = require("../models/Event");
const User = require("../models/User");
const generateEventCode = require("../utils/generateEventCode");

/* =========================================
   CREATE EVENT (ADMIN ONLY)
========================================= */
exports.createEvent = async (req, res) => {
  try {
    const { 
      title, description, type, bannerImageUrl, allowMultipleSubmissions,
      startDate, endDate, // Overall Dates
      registrationStartDate, registrationEndDate, submissionStartDate, submissionEndDate // Phase Dates
    } = req.body;

    if (!title || !description || !type) {
      return res.status(400).json({ message: "Core required fields missing" });
    }

    const event = await Event.create({
      title,
      description,
      type,
      bannerImageUrl: bannerImageUrl || "https://via.placeholder.com/800x400?text=Event+Banner",
      allowMultipleSubmissions: allowMultipleSubmissions || false,
      startDate,
      endDate,
      registrationStartDate,
      registrationEndDate,
      submissionStartDate,
      submissionEndDate,
      eventCode: generateEventCode(),
      createdBy: req.user.id,
      status: "upcoming"
    });

    res.status(201).json({ message: "Event created successfully", event });
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
    if (!eventCode) return res.status(400).json({ message: "Event code required" });

    const event = await Event.findOne({ eventCode });
    if (!event) return res.status(404).json({ message: "Invalid event code" });

    if (event.students.includes(req.user.id)) {
      return res.status(400).json({ message: "Already joined this event" });
    }

    event.students.push(req.user.id);
    await event.save();
    res.status(200).json({ message: "Successfully joined event", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   ASSIGN REVIEWER
========================================= */
exports.assignReviewer = async (req, res) => {
  try {
    const { eventId, reviewerId } = req.body;
    if (!eventId || !reviewerId) return res.status(400).json({ message: "Missing IDs" });

    const event = await Event.findById(eventId);
    const reviewer = await User.findById(reviewerId);

    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!reviewer) return res.status(404).json({ message: "Reviewer not found" });

    if (event.reviewers.includes(reviewerId)) {
      return res.status(400).json({ message: "Reviewer already assigned" });
    }

    event.reviewers.push(reviewerId);
    await event.save();
    res.status(200).json({ message: "Reviewer assigned successfully", event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   UPDATE EVENT STATUS
========================================= */
exports.updateEventStatus = async (req, res) => {
  try {
    const { eventId, status } = req.body;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    event.status = status;
    await event.save();
    res.status(200).json({ message: "Event status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* =========================================
   UPDATE STATUSES BY DATE LOGIC (FAIL-SAFE)
========================================= */
const updateStatusesByDate = async (events) => {
  const now = new Date();
  for (let event of events) {
    let newStatus = event.status;

    // Use Submission Start or fallback to Overall Start Date
    const openDate = event.submissionStartDate || event.startDate;
    // Use Submission End or fallback to Overall End Date
    const closeDate = event.submissionEndDate || event.endDate;

    if (openDate) {
      const start = new Date(openDate);
      if (now < start) {
        newStatus = "upcoming";
      } else {
        if (closeDate) {
          const end = new Date(closeDate);
          if (now > end) {
            newStatus = "completed";
          } else {
            newStatus = event.submissionStartDate ? "submissions" : "active";
          }
        } else {
          newStatus = event.submissionStartDate ? "submissions" : "active";
        }
      }
    }

    if (newStatus !== event.status) {
      event.status = newStatus;
      await event.save();
    }
  }
  return events;
};

/* =========================================
   GET DATA FUNCTIONS
========================================= */
exports.getAllEvents = async (req, res) => {
  try {
    let events = await Event.find().populate("reviewers", "name email");
    events = await updateStatusesByDate(events);
    res.status(200).json(events);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getAllReviewers = async (req, res) => {
  try {
    const reviewers = await User.find({ role: "reviewer" }).select('+plainPassword').lean();
    for (let reviewer of reviewers) {
      const events = await Event.find({ reviewers: reviewer._id });
      reviewer.assignedEvents = events;
      reviewer.studentCount = events.reduce((acc, ev) => acc + ev.students.length, 0);
    }
    res.status(200).json(reviewers);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.params;
    await Event.updateMany({ reviewers: reviewerId }, { $pull: { reviewers: reviewerId } });
    await User.findByIdAndDelete(reviewerId);
    res.status(200).json({ message: "Reviewer deleted successfully" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getStudentEvents = async (req, res) => {
  try {
    let events = await Event.find({ students: req.user.id }).sort({ createdAt: -1 });
    events = await updateStatusesByDate(events);
    res.status(200).json(events);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getReviewerEvents = async (req, res) => {
  try {
    let events = await Event.find({ reviewers: req.user.id }).sort({ createdAt: -1 });
    events = await updateStatusesByDate(events);
    res.status(200).json(events);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};