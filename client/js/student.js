const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

// Global section toggle
function showSection(sectionId) {
    const sections = document.querySelectorAll(".section");
    sections.forEach(sec => sec.classList.add("hidden"));
    document.getElementById(sectionId).classList.remove("hidden");

    if (sectionId === 'myEventsSection') loadMyEvents();
    if (sectionId === 'submissionsSection') loadMySubmissions();
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
    document.getElementById("profName").value = user.name;
    document.getElementById("profEmail").value = user.email;
    document.getElementById("profCollege").value = user.collegeName || "";
    document.getElementById("profDegree").value = user.degree || "";
    document.getElementById("profPhone").value = user.phoneNumber || "";
}

window.updateProfile = async function () {
    const name = document.getElementById("profName").value;
    const collegeName = document.getElementById("profCollege").value;
    const degree = document.getElementById("profDegree").value;
    const phoneNumber = document.getElementById("profPhone").value;

    const res = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name, collegeName, degree, phoneNumber })
    });
    const data = await res.json();
    alert(data.message);
}


/* =========================================
   JOIN EVENT
========================================= */
window.joinEvent = async function () {
    try {
        const eventCode = document.getElementById("eventCode").value.trim();

        if (!eventCode) {
            alert("Please enter event code");
            return;
        }

        const res = await fetch("http://localhost:5000/api/events/join", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + token
            },
            body: JSON.stringify({ eventCode })
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            document.getElementById("eventCode").value = "";
            loadMyEvents();
        }
    } catch (err) {
        console.error(err);
    }
};

/* =========================================
   LOAD MY EVENTS
========================================= */
async function loadMyEvents() {
    const res = await fetch("http://localhost:5000/api/events/student", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const events = await res.json();

    const container = document.getElementById("eventList");
    container.innerHTML = "";

    events.forEach(event => {
        const card = document.createElement("div");
        card.className = "event-card";

        const bannerUrl = event.bannerImageUrl || "https://via.placeholder.com/800x400?text=Event+Banner";
        const typeClass = event.type === 'Academic' ? 'badge-academic' : 'badge-conference';

        card.innerHTML = `
            <div class="event-banner" style="background-image: url('${bannerUrl}')"></div>
            <div class="event-content">
                <div class="event-header">
                    <span class="badge ${typeClass}">${event.type || 'Event'}</span>
                    <span class="badge badge-status">${event.status.toUpperCase()}</span>
                </div>
                <h3 style="margin: 0 0 10px 0;">${event.title}</h3>
                <p style="font-size: 0.9rem; color: #555;">${event.description.substring(0, 80)}...</p>
                <div class="date-info">🗓 Submission Phase: <br> ${event.submissionStartDate ? new Date(event.submissionStartDate).toLocaleDateString() : 'TBA'} - ${event.submissionEndDate ? new Date(event.submissionEndDate).toLocaleDateString() : 'TBA'}</div>
                <button onclick="openEventWorkspace('${event._id}')" style="width: 100%; margin-top: 15px;">Enter Workspace</button>
            </div>
        `;
        container.appendChild(card);
    });
}

/* =========================================
   OPEN EVENT WORKSPACE (Handles Phase Logic)
========================================= */
window.openEventWorkspace = async function (eventId) {
    showSection('eventWorkspaceSection');
    const container = document.getElementById("workspaceContent");
    container.innerHTML = "<h3>Loading event data...</h3>";

    try {
        // Fetch event data
        const eventRes = await fetch(`http://localhost:5000/api/events/student`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const events = await eventRes.json();
        const event = events.find(e => e._id === eventId);

        // Fetch user's submissions
        const subRes = await fetch("http://localhost:5000/api/submissions/my", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const allSubmissions = await subRes.json();
        const myEventSubmissions = allSubmissions.filter(sub => sub.event && sub.event._id === eventId);
        const hasSubmitted = myEventSubmissions.length > 0;

        // Determine Phase Message & Form Visibility
        let phaseMessage = "";
        let showForm = false;

        if (event.status === "upcoming" || event.status === "registration") {
            phaseMessage = `<div class="phase-alert phase-closed">⏳ Submissions are not open yet. They will open on ${new Date(event.submissionStartDate).toLocaleString()}.</div>`;
        } else if (event.status === "completed") {
            phaseMessage = `<div class="phase-alert phase-closed">🛑 This event has ended. Submissions are closed.</div>`;
        } else if (event.status === "submissions" || event.status === "active") {
            if (!event.allowMultipleSubmissions && hasSubmitted) {
                phaseMessage = `<div class="phase-alert phase-closed">✅ You have already submitted your work. Multiple submissions are not allowed for this event.</div>`;
            } else {
                phaseMessage = `<div class="phase-alert phase-open">🟢 Submissions are currently open! Closes on ${new Date(event.submissionEndDate).toLocaleString()}.</div>`;
                showForm = true;
            }
        }

        container.innerHTML = `
            <div class="event-banner" style="background-image: url('${event.bannerImageUrl || 'https://via.placeholder.com/800x400?text=Event+Banner'}'); height: 200px; border-radius: 10px; margin-bottom: 20px;"></div>
            <h2>${event.title} <span class="badge ${event.type === 'Academic' ? 'badge-academic' : 'badge-conference'}">${event.type}</span></h2>
            <p>${event.description}</p>
            
            ${phaseMessage}

            ${showForm ? `
                <div class="card" style="margin-top: 20px;">
                    <h3>Submit Your Work</h3>
                    <input type="file" id="submissionFile" />
                    <button onclick="uploadWorkspaceSubmission('${event.eventCode}', '${event._id}')">Upload Submission</button>
                </div>
            ` : ''}

            <div style="margin-top: 30px;">
                <h3>My Previous Submissions for this Event:</h3>
                <ul>
                    ${myEventSubmissions.map(s => `<li><strong>${s.fileName}</strong> - Status: <span class="status-badge status-${s.status.replace(/\s+/g, '-').toLowerCase()}">${s.status}</span></li>`).join("") || "<li>No submissions yet.</li>"}
                </ul>
            </div>
        `;
    } catch (err) {
        console.error(err);
        container.innerHTML = "<h3>Error loading workspace.</h3>";
    }
}

/* =========================================
   UPLOAD SUBMISSION FROM WORKSPACE
========================================= */
window.uploadWorkspaceSubmission = async function (eventCode, eventId) {
    try {
        const fileInput = document.getElementById("submissionFile");

        if (!fileInput.files.length) {
            alert("Please select a file");
            return;
        }

        const formData = new FormData();
        formData.append("projectFile", fileInput.files[0]);
        formData.append("eventCode", eventCode);

        // Show loading state
        alert("Uploading submission...");

        const res = await fetch("http://localhost:5000/api/submissions/upload", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token
            },
            body: formData
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            loadMySubmissions();
            openEventWorkspace(eventId); // Refresh the workspace view
        }

    } catch (err) {
        console.error(err);
        alert("Upload failed.");
    }
};

/* =========================================
   LOAD ALL SUBMISSIONS (Bottom list)
========================================= */
async function loadMySubmissions() {
    try {
        const res = await fetch("http://localhost:5000/api/submissions/my", {
            headers: { Authorization: "Bearer " + token }
        });
        const submissions = await res.json();
        const container = document.getElementById("submissionList");
        container.innerHTML = "";

        if (submissions.length === 0) {
            container.innerHTML = "<p>No submissions found.</p>";
            return;
        }

        submissions.forEach(sub => {
            let feedbackHtml = "";
            if (sub.reviewerFeedback) {
                feedbackHtml = `<div class="feedback-box" style="white-space: pre-wrap; font-size: 0.9rem; max-height: 150px; overflow-y: auto; background: #fdfae6; border-left: 4px solid #f29c1f; padding: 10px; margin-top: 10px;"><strong>Manual Review:</strong><br>${sub.reviewerFeedback}</div>`;
            } else if (sub.status === 'AI Review Rejected' || sub.aiReviewStatus === 'rejected') {
                feedbackHtml = `<div style="margin-top:10px; padding: 10px; color:#dc3545; font-size: 0.9rem;"><em>AI Review was rejected. Waiting for reviewer to write manual feedback...</em></div>`;
            } else if (sub.aiFeedback) {
                feedbackHtml = `<div class="feedback-box" style="white-space: pre-wrap; font-size: 0.9rem; max-height: 150px; overflow-y: auto; background: #f8f9fa; border-left: 4px solid #ced4da; padding: 10px; margin-top: 10px;"><strong>AI Feedback:</strong><br>${sub.aiFeedback}</div>`;
            }

            // Only allow deletion if not yet reviewed
            const lockedStatuses = ['AI Review Accepted', 'AI Review Rejected', 'approved', 'ai-reviewed'];
            const canDelete = !lockedStatuses.includes(sub.status) && !sub.reviewerFeedback;
            const deleteBtn = canDelete
                ? `<button onclick="deleteSubmission('${sub._id}', this)" style="margin-top: 10px; padding: 7px 16px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 0.85rem;">🗑️ Delete Submission</button>`
                : `<button disabled style="margin-top: 10px; padding: 7px 16px; background: #adb5bd; color: white; border: none; border-radius: 5px; cursor: not-allowed; font-size: 0.85rem;" title="Cannot delete after review.">🔒 Cannot Delete</button>`;

            container.innerHTML += `
        <div class="card" id="sub-card-${sub._id}">
          <p><strong>Event:</strong> ${sub.event?.title || "Unknown"}</p>
          <p><strong>File:</strong> ${sub.fileName}</p>
          <p><strong>Status:</strong> <span class="status-badge status-${sub.status.replace(/\s+/g, '-').toLowerCase()}">${sub.status}</span></p>
          ${feedbackHtml}
          ${deleteBtn}
        </div>
      `;
        });
    } catch (err) {
        console.error(err);
    }
}

window.deleteSubmission = async function (submissionId, btn) {
    const confirmed = confirm("Are you sure you want to delete this submission? This action cannot be undone.");
    if (!confirmed) return;

    try {
        const res = await fetch(`http://localhost:5000/api/submissions/${submissionId}`, {
            method: "DELETE",
            headers: { Authorization: "Bearer " + token }
        });
        const data = await res.json();

        if (res.ok) {
            alert("Submission deleted successfully.");
            // Remove the card from the UI without a full page reload
            const card = document.getElementById(`sub-card-${submissionId}`);
            if (card) card.remove();
        } else {
            alert("Error: " + data.message);
        }
    } catch (err) {
        console.error(err);
        alert("Failed to delete submission. Please try again.");
    }
};

window.onload = function () {
    loadMyEvents();
    loadMySubmissions();
};
