const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

let currentEventId = null;

/* =========================================
   LOAD REVIEWER EVENTS
========================================= */
async function loadReviewerEvents() {
  const res = await fetch("http://localhost:5000/api/events/reviewer", {
    headers: { Authorization: "Bearer " + token }
  });

  const events = await res.json();
  const container = document.getElementById("eventList");
  container.innerHTML = "";

  events.forEach(event => {
    container.innerHTML += `
      <div class="card" onclick="selectEvent('${event._id}')">
        <h4>${event.title}</h4>
        <p>Status: ${event.status}</p>
      </div>
    `;
  });
}

/* =========================================
   SELECT EVENT
========================================= */
window.selectEvent = async function (eventId) {
  currentEventId = eventId;

  // Load submissions of this event
  const res = await fetch("http://localhost:5000/api/submissions/reviewer", {
    headers: { Authorization: "Bearer " + token }
  });

  const submissions = await res.json();
  const filtered = submissions.filter(s => s.event._id === eventId);

  displaySubmissions(filtered);
};

/* =========================================
   DISPLAY SUBMISSIONS TABLE
========================================= */
function displaySubmissions(submissions) {
  const table = document.getElementById("submissionTable");
  table.innerHTML = `
    <table border="1" width="100%">
      <tr>
        <th>Student</th>
        <th>Email</th>
        <th>File</th>
        <th>Status</th>
        <th>Action</th>
      </tr>
      ${submissions.map(sub => `
        <tr>
          <td>${sub.student.name}</td>
          <td>${sub.student.email}</td>
          <td>${sub.fileName}</td>
          <td>${sub.status}</td>
          <td>
            <button onclick="generateReview('${sub._id}')">Generate Review</button>
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}

/* =========================================
   GENERATE REVIEW (AI PLACEHOLDER)
========================================= */
window.generateReview = async function (submissionId) {

  // Placeholder AI feedback
  const aiGeneratedFeedback = "AI generated review will appear here in future.";

  await fetch("http://localhost:5000/api/submissions/review", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      submissionId,
      decision: "approved",
      feedback: aiGeneratedFeedback
    })
  });

  alert("Review generated successfully");
  selectEvent(currentEventId);
};

/* =========================================
   LOAD ON START
========================================= */
window.onload = function () {
  loadReviewerEvents();
};