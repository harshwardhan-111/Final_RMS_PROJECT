const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

let currentEventId = null;
let currentSubmissionId = null;

// NEW: Global arrays to hold data for the Tracker to cross-reference
let globalEventsData = [];
let globalAllSubmissions = [];

function showSection(sectionId) {
  const sections = document.querySelectorAll(".section");
  sections.forEach(sec => sec.classList.add("hidden"));
  document.getElementById(sectionId).classList.remove("hidden");

  if (sectionId === 'assignedEventsSection') loadReviewerEvents();
  if (sectionId === 'studentsTrackerSection') populateTrackerDropdown();
  if (sectionId === 'profileSection') loadProfile();
}

/* =========================================
   PROFILE FUNCTIONS
========================================= */
async function loadProfile() {
  const res = await fetch("http://localhost:5000/api/auth/me", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  const user = await res.json();
  document.getElementById("revName").value = user.name;
  document.getElementById("revEmail").value = user.email;
  document.getElementById("revPassword").value = user.plainPassword || "(Password hidden/updated)";
}

/* =========================================
   LOAD REVIEWER EVENTS
========================================= */
async function loadReviewerEvents() {
  // We fetch both Events and Submissions simultaneously so the Tracker has all the data it needs
  const [eventRes, subRes] = await Promise.all([
    fetch("http://localhost:5000/api/events/reviewer", { headers: { Authorization: "Bearer " + token } }),
    fetch("http://localhost:5000/api/submissions/reviewer", { headers: { Authorization: "Bearer " + token } })
  ]);

  globalEventsData = await eventRes.json();
  globalAllSubmissions = await subRes.json();

  const container = document.getElementById("eventList");
  container.innerHTML = "";

  if (globalEventsData.length === 0) {
    container.innerHTML = "<p>No events assigned to you yet.</p>";
    return;
  }

  globalEventsData.forEach(event => {
    const card = document.createElement("div");
    card.className = "event-card";
    const bannerUrl = event.bannerImageUrl || "https://placehold.co/800x400?text=Event+Banner";

    card.innerHTML = `
            <div class="event-banner" style="background-image: url('${bannerUrl}'); height: 100px; background-size: cover; border-radius: 8px 8px 0 0;"></div>
            <div class="event-content" style="padding: 15px; border: 1px solid #eee; border-top: none; border-radius: 0 0 8px 8px; background: white;">
                <h4 style="margin: 5px 0;">${event.title}</h4>
                <p>Status: <strong>${event.status.toUpperCase()}</strong></p>
                <div style="display: flex; gap: 10px;">
                    <button onclick="selectEvent('${event._id}', '${event.title}')" style="flex: 1; padding: 8px; background: #0f7dff; color: white; border: none; border-radius: 5px; cursor: pointer;">View Submissions</button>
                    <button onclick="jumpToTracker('${event._id}')" style="padding: 8px 15px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer;" title="View Student Tracker">👥</button>
                </div>
            </div>
        `;
    container.appendChild(card);
  });
}

/* =========================================
   STUDENTS TRACKER LOGIC (NEWLY ADDED)
========================================= */
function populateTrackerDropdown() {
  const selector = document.getElementById("eventTrackerSelector");
  const currentVal = selector.value;

  selector.innerHTML = '<option value="">-- Select an Event to Track --</option>';
  globalEventsData.forEach(ev => {
    selector.innerHTML += `<option value="${ev._id}" ${ev._id === currentVal ? 'selected' : ''}>${ev.title}</option>`;
  });
}

window.jumpToTracker = function (eventId) {
  showSection('studentsTrackerSection');
  document.getElementById("eventTrackerSelector").value = eventId;
  loadTrackerData(eventId);
};

window.loadTrackerData = function (eventId) {
  if (!eventId) {
    document.getElementById('trackerDetails').classList.add('hidden');
    return;
  }
  document.getElementById('trackerDetails').classList.remove('hidden');

  const event = globalEventsData.find(e => e._id === eventId);

  // Cross-reference students who joined with global submissions
  const mergedList = event.students.map(student => {
    const submission = globalAllSubmissions.find(s => s.student._id === student._id && s.event._id === eventId);
    return {
      name: student.name,
      email: student.email,
      college: student.collegeName || "Not Provided",
      status: submission ? submission.status : "Pending (No File)",
      hasSubmitted: !!submission
    };
  });

  // Update Top Stats
  document.getElementById("statJoined").innerText = mergedList.length;
  document.getElementById("statSubmitted").innerText = mergedList.filter(s => s.hasSubmitted).length;

  // Render Table
  const tbody = document.getElementById("trackerTableBody");
  tbody.innerHTML = mergedList.map(s => `
        <tr class="tracker-row">
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <strong>${s.name}</strong><br><small style="color: #666;">${s.email}</small>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">${s.college}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
                <span style="padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; background: ${s.hasSubmitted ? '#dcfce7' : '#fff3cd'}; color: ${s.hasSubmitted ? '#166534' : '#856404'};">
                    ${s.status}
                </span>
            </td>
        </tr>
    `).join("");
};

window.filterTrackerTable = function () {
  const query = document.getElementById("trackerSearch").value.toLowerCase();
  const rows = document.querySelectorAll(".tracker-row");

  rows.forEach(row => {
    const textContent = row.innerText.toLowerCase();
    row.style.display = textContent.includes(query) ? "" : "none";
  });
};

/* =========================================
   SELECT EVENT & SHOW SUBMISSIONS
========================================= */
window.selectEvent = async function (eventId, eventTitle) {
  currentEventId = eventId;
  document.getElementById('subEventTitle').innerText = `Submissions for: ${eventTitle}`;
  showSection('submissionsSection');

  // Use globalAllSubmissions to instantly display data without extra API calls
  const filtered = globalAllSubmissions.filter(s => s.event._id === eventId);
  displaySubmissions(filtered);
};

/* =========================================
   DISPLAY SUBMISSIONS TABLE
========================================= */
function displaySubmissions(submissions) {
  const table = document.getElementById("submissionTable");

  if (submissions.length === 0) {
    table.innerHTML = "<p>No submissions uploaded for this event yet.</p>";
    return;
  }

  table.innerHTML = `
    <table border="1" width="100%" style="border-collapse: collapse; text-align: left;">
      <tr style="background-color: #f8f9fa;">
        <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Student Details</th>
        <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">Submitted File</th>
        <th style="padding: 12px; border-bottom: 2px solid #dee2e6;">AI Status</th>
        <th style="padding: 12px; border-bottom: 2px solid #dee2e6; width: 30%;">Action</th>
      </tr>
      ${submissions.map(sub => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${sub.student.name}</strong><br>
            <small style="color: #666;">${sub.student.email}</small>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <a href="http://localhost:5000/${sub.filePath.replace(/\\/g, "/")}" target="_blank" style="color: #0f7dff; text-decoration: none; font-weight: bold;">📄 View File</a>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <span style="padding: 5px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: bold; background: #e2e8f0; color: #334155;">${sub.status}</span>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            ${(sub.status === 'ai-reviewed' || sub.status === 'approved' || sub.status === 'AI Review Accepted' || sub.status === 'AI Review Rejected')
      ? `<button onclick="viewFullReview('${sub._id}')" style="width:100%; padding: 8px; background: #198754; color: white; border: none; border-radius: 5px; cursor: pointer;">📖 Read Full Review</button>`
      : `<button onclick="generateReview('${sub._id}')" style="width:100%; padding: 8px; background: #0f7dff; color: white; border: none; border-radius: 5px; cursor: pointer;">Generate AI Review</button>`
    }
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}

/* =========================================
   VIEW FULL GENERATED REVIEW IN SIDEBAR
========================================= */
window.viewFullReview = function (submissionId) {
  const submission = globalAllSubmissions.find(s => s._id === submissionId);
  currentSubmissionId = submissionId;

  if (submission && submission.aiFeedback) {
    const reviewContent = document.getElementById('fullReviewContent');
    reviewContent.innerText = submission.aiFeedback;
    document.getElementById('navFullReview').style.display = 'block';

    // Check status
    if (!submission.aiReviewStatus || submission.aiReviewStatus === 'pending') {
      document.getElementById('reviewActions').style.display = 'flex';
      document.getElementById('manualReviewSection').style.display = 'none';
      reviewContent.contentEditable = false;
      reviewContent.style.border = "none";
    } else {
      document.getElementById('reviewActions').style.display = 'none';
      if (submission.aiReviewStatus === 'rejected') {
        document.getElementById('manualReviewSection').style.display = 'block';
        reviewContent.contentEditable = true;
        reviewContent.style.border = "1px solid #ccc";
        reviewContent.style.padding = "15px";

        // If there's already some manual reviewer feedback saved, show that instead of the AI one
        if (submission.reviewerFeedback) {
          reviewContent.innerText = submission.reviewerFeedback;
        }
      } else {
        document.getElementById('manualReviewSection').style.display = 'none';
        reviewContent.contentEditable = false;
        reviewContent.style.border = "none";
      }
    }

    showSection('fullReviewSection');
  }
}

window.acceptAIReview = async function () {
  if (!currentSubmissionId) return;
  try {
    const res = await fetch("http://localhost:5000/api/submissions/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ submissionId: currentSubmissionId })
    });
    const data = await res.json();
    if (res.ok) {
      alert("AI Review Accepted successfully!");
      await loadReviewerEvents(); // refresh data
      const eventTitle = document.getElementById('subEventTitle').innerText.replace("Submissions for: ", "");
      selectEvent(currentEventId, eventTitle); // Refresh table view without extra clicks
      viewFullReview(currentSubmissionId); // refresh view
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to accept review.");
  }
}

window.rejectAIReview = async function () {
  if (!currentSubmissionId) return;
  try {
    const res = await fetch("http://localhost:5000/api/submissions/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ submissionId: currentSubmissionId })
    });
    const data = await res.json();
    if (res.ok) {
      alert("AI Review Rejected. You can now manually edit the review.");
      await loadReviewerEvents(); // refresh data
      const eventTitle = document.getElementById('subEventTitle').innerText.replace("Submissions for: ", "");
      selectEvent(currentEventId, eventTitle); // Refresh table view without extra clicks
      viewFullReview(currentSubmissionId); // refresh view
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to reject review.");
  }
}

window.submitManualReview = async function () {
  if (!currentSubmissionId) return;
  const manualFeedback = document.getElementById('fullReviewContent').innerText;

  if (!manualFeedback.trim()) {
    alert("Manual review cannot be empty!");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/submissions/manual-review", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ submissionId: currentSubmissionId, feedback: manualFeedback })
    });
    const data = await res.json();
    if (res.ok) {
      alert("Manual review submitted successfully!");
      await loadReviewerEvents(); // refresh data
      const eventTitle = document.getElementById('subEventTitle').innerText.replace("Submissions for: ", "");
      selectEvent(currentEventId, eventTitle); // Refresh table view

      // Update UI to lock edit
      document.getElementById('manualReviewSection').style.display = 'none';
      const reviewContent = document.getElementById('fullReviewContent');
      reviewContent.contentEditable = false;
      reviewContent.style.border = "none";

    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to submit manual review.");
  }
}

/* =========================================
   GENERATE REVIEW
========================================= */
window.generateReview = async function (submissionId) {
  try {
    alert("Analyzing Document with Gemini... This takes about 10-20 seconds.");

    const res = await fetch("http://localhost:5000/api/submissions/review", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({ submissionId })
    });

    const data = await res.json();

    if (res.ok) {
      // Refresh the global data so the new status applies
      await loadReviewerEvents();

      const eventTitle = document.getElementById('subEventTitle').innerText.replace("Submissions for: ", "");
      selectEvent(currentEventId, eventTitle);

      setTimeout(() => { viewFullReview(submissionId); }, 500);
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error(err);
    alert("Failed to generate review. Check server console.");
  }
};

window.onload = function () {
  loadReviewerEvents().then(() => {
    showSection('assignedEventsSection');
  });
};
