const token = localStorage.getItem("token");
let allReviewersData = []; // Store for searching
if (!token) {
    window.location.href = "login.html";
}

/* =====================
   CREATE REVIEWER
===================== */
async function createReviewer() {
    const name = document.getElementById("reviewerName").value;
    const email = document.getElementById("reviewerEmail").value;
    const password = document.getElementById("reviewerPassword").value;

    const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            name,
            email,
            password,
            role: "reviewer"
        })
    });

    const data = await res.json();
    alert(data.message);
}

/* =====================
   CREATE EVENT
===================== */
async function createEventHandler() {
    const title = document.getElementById("eventTitle").value;
    const type = document.getElementById("eventType").value;
    const description = document.getElementById("eventDesc").value;
    const bannerImageUrl = document.getElementById("eventBannerUrl").value;
    const allowMultipleSubmissions = document.getElementById("allowMultiple").checked;
    
    const startDate = document.getElementById("eventStartDate").value;
    const endDate = document.getElementById("eventEndDate").value;
    const registrationStartDate = document.getElementById("regStart").value;
    const registrationEndDate = document.getElementById("regEnd").value;
    const submissionStartDate = document.getElementById("subStart").value;
    const submissionEndDate = document.getElementById("subEnd").value;

    const res = await fetch("http://localhost:5000/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            title, type, description, bannerImageUrl, allowMultipleSubmissions,
            startDate, endDate,
            registrationStartDate, registrationEndDate, submissionStartDate, submissionEndDate
        })
    });

    const data = await res.json();
    alert(data.message);
    if(res.ok) {
        document.getElementById("createEventSection").querySelectorAll('input:not([type="checkbox"]), textarea').forEach(el => el.value = '');
        showSection('viewEventsSection');
    }
}

/* =====================
   LOAD EVENTS
===================== */
async function loadEvents() {
    const res = await fetch("http://localhost:5000/api/events/all", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();

    const container = document.getElementById("eventList");
    container.innerHTML = "";

    data.forEach(event => {
        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
    <h4 style="cursor: pointer; color: #007bff;" onclick="showEventDetails('${event._id}')">${event.title}</h4>
    <p><strong>Code:</strong> ${event.eventCode}</p>
    <p><strong>Type:</strong> ${event.type}</p>
    <p><strong>Status:</strong> ${event.status}</p>
    <p><strong>Assigned Reviewers:</strong>
    ${event.reviewers.length > 0
                ? event.reviewers.map(r => r.name).join(", ")
                : "None"}
    </p>
    <select id="reviewer-${event._id}">
        <option value="">Select Reviewer</option>
    </select>

    <button onclick="assignReviewerToEvent('${event._id}')">
        Assign Reviewer
    </button>

    <br><br>

    <button onclick="updateStatus('${event._id}','active')">
        Set Active
    </button>

    <button onclick="updateStatus('${event._id}','completed')">
        Set Completed
    </button>

    <button onclick="deleteEvent('${event._id}')" style="background-color: #dc3545; color: white; margin-left: 10px;">
        Delete Event
    </button>

    <div id="details-${event._id}" class="hidden" style="margin-top: 15px; padding: 10px; border: 1px solid #ccc; border-radius: 5px; background: #f9f9f9;">
        <p><strong>Description:</strong> ${event.description}</p>
        <p><strong>Start:</strong> ${event.startDate ? new Date(event.startDate).toLocaleString() : 'N/A'}</p>
        <p><strong>End:</strong> ${event.endDate ? new Date(event.endDate).toLocaleString() : 'N/A'}</p>
    </div>
`;

        container.appendChild(card);
        loadReviewersForEvent(event._id);
    });
}

function showEventDetails(eventId) {
    const detailsDiv = document.getElementById(`details-${eventId}`);
    if (detailsDiv) {
        detailsDiv.classList.toggle('hidden');
    }
}

/* =====================
   UPDATE STATUS
===================== */
async function updateStatus(eventId, status) {

    const res = await fetch("http://localhost:5000/api/events/status", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ eventId, status })
    });

    const data = await res.json();
    alert(data.message);
    loadEvents();
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}
//Load all reviwers created
async function loadReviewersForEvent(eventId) {

    const res = await fetch("http://localhost:5000/api/events/reviewers", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const reviewers = await res.json();

    const select = document.getElementById(`reviewer-${eventId}`);

    reviewers.forEach(reviewer => {
        const option = document.createElement("option");
        option.value = reviewer._id;
        option.textContent = reviewer.name + " (" + reviewer.email + ")";
        select.appendChild(option);
    });
}
async function assignReviewerToEvent(eventId) {

    const reviewerId = document
        .getElementById(`reviewer-${eventId}`)
        .value;

    if (!reviewerId) {
        alert("Please select a reviewer");
        return;
    }

    const res = await fetch(
        "http://localhost:5000/api/events/assign-reviewer",
        {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                eventId,
                reviewerId
            })
        }
    );

    const data = await res.json();
    alert(data.message);
}
function showSection(sectionId) {

    const sections = document.querySelectorAll(".section");

    sections.forEach(sec => {
        sec.classList.add("hidden");
    });

    document.getElementById(sectionId)
        .classList.remove("hidden");

    if (sectionId === "viewEventsSection") {
        loadEvents();
    }

    if (sectionId === "viewReviewersSection") {
        loadReviewers();
    }
}
/* =====================
   LOAD & SEARCH REVIEWERS
===================== */
async function loadReviewers() {
    const res = await fetch("http://localhost:5000/api/events/reviewers", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    allReviewersData = await res.json();
    renderReviewers(allReviewersData);
}

function renderReviewers(reviewers) {
    const container = document.getElementById("reviewerList");
    container.innerHTML = "";

    reviewers.forEach(r => {
        const card = document.createElement("div");
        card.className = "card";
        
        const assignedEventsHtml = r.assignedEvents && r.assignedEvents.length > 0
            ? r.assignedEvents.map(e => `<span class="badge">${e.title}</span>`).join(" ")
            : "<em>No events assigned</em>";

        card.innerHTML = `
            <h4 style="cursor: pointer; color: #007bff; display:flex; justify-content:space-between;" onclick="showReviewerDetails('${r._id}')">
                <span>👤 ${r.name}</span>
                <small>▼</small>
            </h4>
            <p>📧 ${r.email}</p>
            <div id="reviewer-details-${r._id}" class="hidden details-panel">
                <p><strong>Actual Password:</strong> <span style="font-family:monospace; background:#eee; padding:2px 5px;">${r.plainPassword || 'Not stored'}</span></p>
                <p><strong>Assigned Events:</strong><br> ${assignedEventsHtml}</p>
                <p><strong>Total Students Under Care:</strong> <span style="font-size:1.2em; font-weight:bold; color:green;">${r.studentCount || 0}</span></p>
                <button onclick="deleteReviewer('${r._id}')" class="btn-danger">Delete Reviewer</button>
            </div>
        `;
        container.appendChild(card);
    });
}

function filterReviewers() {
    const query = document.getElementById("searchReviewerInput").value.toLowerCase();
    const filtered = allReviewersData.filter(r => {
        const matchName = r.name.toLowerCase().includes(query);
        const matchEvent = r.assignedEvents.some(e => e.title.toLowerCase().includes(query));
        return matchName || matchEvent;
    });
    renderReviewers(filtered);
}

function showReviewerDetails(id) {
    const detailsDiv = document.getElementById(`reviewer-details-${id}`);
    if (detailsDiv) {
        detailsDiv.classList.toggle('hidden');
    }
}

async function deleteReviewer(id) {
    if (!confirm("Are you sure you want to delete this reviewer?")) return;

    const res = await fetch(`http://localhost:5000/api/events/reviewer/${id}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();
    alert(data.message || "Reviewer deleted");
    loadReviewers();
}
/* =====================
   DELETE EVENT
===================== */
async function deleteEvent(eventId) {
    if (!confirm("Are you sure you want to delete this event? This action cannot be undone.")) return;

    try {
        const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();
        
        if (res.ok) {
            alert("Event deleted successfully");
            loadEvents(); // Refresh the events list
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        console.error("Failed to delete event:", err);
        alert("Failed to delete event.");
    }
}
loadEvents();
