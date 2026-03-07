const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

let currentEventId = null;

function showSection(sectionId) {
    const sections = document.querySelectorAll(".section");
    sections.forEach(sec => sec.classList.add("hidden"));
    document.getElementById(sectionId).classList.remove("hidden");

    if(sectionId === 'assignedEventsSection') loadReviewerEvents();
    if(sectionId === 'profileSection') loadProfile();
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
    // Show the actual plain password the admin created
    document.getElementById("revPassword").value = user.plainPassword || "(Password hidden/updated)";
}

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
        const bannerUrl = event.bannerImageUrl || "https://placehold.co/800x400?text=Event+Banner";
        
        card.innerHTML = `
            <div class="event-banner" style="background-image: url('${bannerUrl}'); height: 100px;"></div>
            <div class="event-content" style="padding: 15px;">
                <h4 style="margin: 5px 0;">${event.title}</h4>
                <p>Status: <strong>${event.status.toUpperCase()}</strong></p>
                <button onclick="selectEvent('${event._id}', '${event.title}')" style="width: 100%;">View Submissions</button>
            </div>
        `;
        container.appendChild(card);
    });
}

/* =========================================
   SELECT EVENT & SHOW SUBMISSIONS
========================================= */
window.selectEvent = async function (eventId, eventTitle) {
    currentEventId = eventId;
    document.getElementById('subEventTitle').innerText = `Submissions for: ${eventTitle}`;
    showSection('submissionsSection');

    try {
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
   DISPLAY SUBMISSIONS TABLE (Fixes Tiny Box Issue)
========================================= */
let globalSubmissionsData = []; // Store locally so we can read the review later

function displaySubmissions(submissions) {
  globalSubmissionsData = submissions;
  const table = document.getElementById("submissionTable");
  
  if (submissions.length === 0) {
      table.innerHTML = "<p>No submissions uploaded for this event yet.</p>";
      return;
  }

  table.innerHTML = `
    <table border="1" width="100%" style="border-collapse: collapse; text-align: left;">
      <tr style="background-color: #f8f9fa;">
        <th style="padding: 10px;">Student Details</th>
        <th style="padding: 10px;">Submitted File</th>
        <th style="padding: 10px;">AI Status</th>
        <th style="padding: 10px; width: 30%;">Action</th>
      </tr>
      ${submissions.map(sub => `
        <tr>
          <td style="padding: 10px;">
            <strong>${sub.student.name}</strong><br>
            <small>${sub.student.email}</small>
          </td>
          <td style="padding: 10px;">
            <a href="http://localhost:5000/${sub.filePath.replace(/\\/g, "/")}" target="_blank" class="preview-link">📄 View File</a>
          </td>
          <td style="padding: 10px;">
            <span class="status-badge status-${sub.status}">${sub.status}</span>
          </td>
          <td style="padding: 10px;">
            ${(sub.status === 'ai-reviewed' || sub.status === 'approved')
              // Display a button to open the full review instead of a cramped text box
              ? `<button class="approve" onclick="viewFullReview('${sub._id}')" style="width:100%;">📖 Read Full Review</button>` 
              : `<button onclick="generateReview('${sub._id}')" style="width:100%;">Generate AI Review</button>`
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
window.viewFullReview = function(submissionId) {
    const submission = globalSubmissionsData.find(s => s._id === submissionId);
    if(submission && submission.aiFeedback) {
        document.getElementById('fullReviewContent').innerText = submission.aiFeedback;
        document.getElementById('navFullReview').style.display = 'block'; // Unhide nav item
        showSection('fullReviewSection');
    }
}

/* =========================================
   GENERATE REVIEW
========================================= */
window.generateReview = async function (submissionId) {
  try {
    alert("Analyzing PDF with Gemini... This takes about 10-20 seconds.");

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
        // Find the event title to reload the page correctly
        const eventTitle = document.getElementById('subEventTitle').innerText.replace("Submissions for: ", "");
        selectEvent(currentEventId, eventTitle); 
        
        // Immediately show the new review
        setTimeout(() => { viewFullReview(submissionId); }, 500);
    } else {
        alert("Error: " + data.message);
    }
  } catch(err) {
      console.error(err);
      alert("Failed to generate review. Check server console.");
  }
};

window.onload = function () {
  showSection('assignedEventsSection');
};