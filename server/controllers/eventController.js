const Event = require("../models/Event");
const User = require("../models/User");
const Submission = require("../models/Submission");
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
    const { eventId, reviewerIds } = req.body;
    if (!eventId) return res.status(400).json({ message: "Missing Event ID" });
    
    let idsToAssign = Array.isArray(reviewerIds) ? reviewerIds : (req.body.reviewerId ? [req.body.reviewerId] : []);
    if (idsToAssign.length === 0) return res.status(400).json({ message: "No reviewer IDs provided" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Add selected reviewers to the event (preventing duplicates)
    for (const rid of idsToAssign) {
      if (!event.reviewers.includes(rid)) {
        event.reviewers.push(rid);
      }
    }

    // Now, distribute ALL students in this event among ALL current reviewers
    const studentList = event.students;
    const reviewerList = event.reviewers;

    if (studentList.length > 0 && reviewerList.length > 0) {
      // Fetch all reviewers to find the top-rated one
      const reviewerDocs = await User.find({ _id: { $in: reviewerList } }).sort({ rating: -1 });
      
      const numStudents = studentList.length;
      const numReviewers = reviewerList.length;
      const studentsPerReviewer = Math.floor(numStudents / numReviewers);
      const remainder = numStudents % numReviewers;

      let studentIdx = 0;
      const newAssignments = [];

      // Loop through each reviewer and assign their share
      for (let i = 0; i < numReviewers; i++) {
        const currentReviewer = reviewerDocs[i];
        let countToAssign = studentsPerReviewer;

        // If this is the top-rated reviewer (at index 0 after sorting), add the remainder
        if (i === 0) {
          countToAssign += remainder;
        }

        for (let j = 0; j < countToAssign; j++) {
          if (studentIdx < studentList.length) {
            newAssignments.push({
              student: studentList[studentIdx],
              reviewer: currentReviewer._id
            });
            studentIdx++;
          }
        }
      }

      event.assignments = newAssignments;
    }

    await event.save();
    
    // Explicitly populate for feedback in frontend
    const populatedEvent = await Event.findById(eventId)
      .populate("reviewers", "name email rating")
      .populate("assignments.student", "name email")
      .populate("assignments.reviewer", "name email");

    res.status(200).json({ 
      message: `Reviewers assigned and ${studentList.length} students distributed.`, 
      event: populatedEvent 
    });
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

exports.getEventTracker = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate("students", "name email collegeName");
    if (!event) return res.status(404).json({ message: "Event not found" });

    const submissions = await Submission.find({ event: eventId })
      .populate("student", "name email")
      .populate("reviewer", "name email");

    res.status(200).json({ event, submissions });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

/* =========================================
   GET DATA FUNCTIONS
========================================= */
exports.getAllEvents = async (req, res) => {
  try {
    let events = await Event.find()
      .populate("reviewers", "name email")
      .populate("assignments.student", "name email")
      .populate("assignments.reviewer", "name email");
    events = await updateStatusesByDate(events);
    res.status(200).json(events);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getAllReviewers = async (req, res) => {
  try {
    const { domains } = req.query;
    const query = { role: "reviewer" };
    
    if (domains) {
      // Clean up common issues like whitespace and empty strings
      const domainList = domains.split(",").map(d => d.trim()).filter(d => d !== "");
      if (domainList.length > 0) {
        query.technicalDomains = { $in: domainList };
      }
    }

    const reviewers = await User.find(query)
      .select('+plainPassword +technicalDomains')
      .sort({ rating: -1 })
      .lean();
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
    await Event.updateMany({ reviewers: reviewerId }, { 
      $pull: { 
        reviewers: reviewerId,
        assignments: { reviewer: reviewerId }
      } 
    });
    await User.findByIdAndDelete(reviewerId);
    res.status(200).json({ message: "Reviewer deleted successfully" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};

exports.getStudentEvents = async (req, res) => {
  try {
    let events = await Event.find({ students: req.user.id })
      .populate("assignments.reviewer", "name email")
      .populate("assignments.student", "name email")
      .sort({ createdAt: -1 });
    events = await updateStatusesByDate(events);
    res.status(200).json(events);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

/* =========================================
   GET REVIEWER ASSIGNED EVENTS
========================================= */
exports.getReviewerEvents = async (req, res) => {
  try {
    let events = await Event.find({
      reviewers: req.user.id
    })
    .populate("students", "name email collegeName") // <-- Added this to get student profiles
    .sort({ createdAt: -1 });

    events = await updateStatusesByDate(events);

    res.status(200).json(events);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.status(200).json({ message: "Event deleted successfully" });
  } catch (error) { res.status(500).json({ message: error.message }); }
};