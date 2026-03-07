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
        headers: { "Authorization": `Bearer ${token}` }
    });

    const events = await res.json();
    const container = document.getElementById("eventList");
    container.innerHTML = "";

    if (events.length === 0) {
        container.innerHTML = "<p>No events assigned to you yet.</p>";
        return;
    }

    events.forEach(event => {
        const card = document.createElement("div");
        card.className = "event-card";

        const bannerUrl = event.bannerImageUrl || "https://via.placeholder.com/800x400?text=Event+Banner";
        const typeClass = event.type === 'Academic' ? 'badge-academic' : 'badge-conference';

        card.innerHTML = `
            <div class="event-banner" style="background-image: url('${bannerUrl}'); height: 100px;"></div>
            <div class="event-content" style="padding: 15px;">
                <div class="event-header">
                    <span class="badge ${typeClass}">${event.type || 'Event'}</span>
                    <span class="badge badge-status">${event.status.toUpperCase()}</span>
                </div>
                <h4 style="margin: 5px 0;">${event.title}</h4>
                <p style="font-size: 0.85rem; margin-bottom: 10px;">Students Enrolled: ${event.students.length}</p>
                <button onclick="selectEvent('${event._id}')" style="width: 100%; padding: 8px; font-size: 0.9rem;">
                    Review Submissions
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

/* =========================================
   SELECT EVENT & SHOW DETAILS
========================================= */
window.selectEvent = async function (eventId) {
    currentEventId = eventId;
    
    // Show the sections
    document.getElementById('eventDetailsSection').classList.remove('hidden');
    document.getElementById('submissionsSection').classList.remove('hidden');

    try {
        // 1. Load Event Details
        const eventRes = await fetch("http://localhost:5000/api/events/reviewer", {
            headers: { Authorization: "Bearer " + token }
        });
        const events = await eventRes.json();
        const event = events.find(e => e._id === eventId);
        
        document.getElementById("eventDetails").innerHTML = `
            <h2>${event.title}</h2>
            <p>${event.description}</p>
            <p><strong>Status:</strong> ${event.status.toUpperCase()}</p>
            <p><strong>Submissions Close:</strong> ${event.submissionEndDate ? new Date(event.submissionEndDate).toLocaleString() : 'N/A'}</p>
        `;

        // 2. Load Submissions
        const subRes = await fetch("http://localhost:5000/api/submissions/reviewer", {
            headers: { Authorization: "Bearer " + token }
        });
        const submissions = await subRes.json();
        const filtered = submissions.filter(s => s.event._id === eventId);

        displaySubmissions(filtered);
    } catch (err) {
        console.error("Error fetching data:", err);
    }
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
        <th style="padding: 10px;">Student</th>
        <th style="padding: 10px;">File</th>
        <th style="padding: 10px;">Status</th>
        <th style="padding: 10px; width: 40%;">Feedback / Action</th>
      </tr>
      ${submissions.map(sub => `
        <tr>
          <td style="padding: 10px;">
            <strong>${sub.student.name}</strong><br>
            <small>${sub.student.email}</small>
          </td>
          <td style="padding: 10px;">
            <a href="http://localhost:5000/${sub.filePath.replace(/\\/g, "/")}" target="_blank" class="preview-link">📄 View File</a><br>
            <small>${sub.fileName}</small>
          </td>
          <td style="padding: 10px;">
            <span class="status-badge status-${sub.status}">${sub.status}</span>
          </td>
          <td style="padding: 10px;">
            ${sub.status === 'ai-reviewed' || sub.status === 'approved' 
              ? `<div class="feedback-box" style="white-space: pre-wrap; font-family: sans-serif; font-size: 0.85rem; max-height: 200px; overflow-y: auto; padding: 10px;">${sub.aiFeedback}</div>` 
              : `<button onclick="generateReview('${sub._id}')" style="font-size: 0.9rem; padding: 8px 12px;">Generate AI Review</button>`
            }
          </td>
        </tr>
      `).join("")}
    </table>
  `;
}

/* =========================================
   GENERATE REVIEW
========================================= */
window.generateReview = async function (submissionId) {
  try {
    alert("Generating AI Review... This might take 10-20 seconds depending on file size.");

    const res = await fetch("http://localhost:5000/api/submissions/review", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token
      },
      body: JSON.stringify({
        submissionId
      })
    });

    const data = await res.json();
    
    if (res.ok) {
        alert("Review generated successfully!");
        selectEvent(currentEventId); // Refresh table
    } else {
        alert("Error: " + data.message);
    }
  } catch(err) {
      console.error(err);
      alert("Failed to generate review. Check server console.");
  }
};

window.onload = function () {
  loadReviewerEvents();
};