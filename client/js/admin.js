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
    if (res.ok) {
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

        // Check if event is live
        const now = new Date();
        const start = event.startDate ? new Date(event.startDate) : null;
        const end = event.endDate ? new Date(event.endDate) : null;
        const isLive = start && end && now >= start && now <= end;

        card.innerHTML = `
    <h4 style="cursor: pointer; color: #007bff;" onclick="showEventDetails('${event._id}')">${event.title}</h4>
    <p><strong>Code:</strong> ${event.eventCode}</p>
    <p><strong>Type:</strong> ${event.type}</p>
    <p><strong>Status:</strong> ${event.status}</p>
    ${isLive ? `<p style="background: #d4edda; color: #155724; padding: 5px; border-radius: 4px;"><strong>Total Students:</strong> ${event.students ? event.students.length : 0}</p>` : ""}
    <p><strong>Assigned Reviewers:</strong>
    ${event.reviewers.length > 0
                ? event.reviewers.map(r => r.name).join(", ")
                : "None"}
    </p>
    <div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 8px;">
        <h5 style="margin-top: 0; margin-bottom: 10px; color: #495057;">Filter & Assign Reviewers</h5>
        
        <label style="font-weight: bold; font-size: 0.9em; display: block; margin-bottom: 5px;">1. Select Domain(s) to Filter By:</label>
        <p style="font-size: 0.8em; color: #6c757d; margin-top: 0; margin-bottom: 5px;">Hold CTRL (or CMD) to select multiple domains. Leave empty to see all reviewers.</p>
        <select id="domain-select-${event._id}" multiple style="width: 100%; height: 80px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;" onchange="loadReviewersForEvent('${event._id}')">
            <option value="Machine Learning (ML)">Machine Learning (ML)</option>
            <option value="Natural Language Processing (NLP)">Natural Language Processing (NLP)</option>
            <option value="Computer Vision (CV)">Computer Vision (CV)</option>
            <option value="Full-Stack Development">Full-Stack Development</option>
            <option value="Backend Systems">Backend Systems</option>
            <option value="Cloud Computing (AWS/Azure)">Cloud Computing (AWS/Azure)</option>
            <option value="Blockchain">Blockchain</option>
        </select>
        
        <label style="font-weight: bold; font-size: 0.9em; display: block; margin-top: 15px; margin-bottom: 5px;">2. Select Reviewer(s) to Assign <span id="rev-count-${event._id}" style="color: #6c757d; font-weight: normal;">(0 found)</span>:</label>
        <select id="reviewer-${event._id}" multiple style="width: 100%; height: 100px; padding: 5px; border: 1px solid #ccc; border-radius: 4px;">
            <!-- Fetched dynamically -->
        </select>
        
        <button onclick="assignReviewerToEvent('${event._id}')" style="margin-top: 15px; width: 100%; background: #28a745; color: white; border: none; padding: 10px; border-radius: 5px; cursor: pointer;">
            Assign Selected Reviewers
        </button>
    </div>

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

    <div style="margin-top: 10px;">
        <button onclick="toggleMapping('${event._id}')" style="background: #17a2b8; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.85em;">
            👥 View Reviewer-Student Mapping
        </button>
    </div>

    <div id="mapping-${event._id}" class="hidden" style="margin-top: 10px; padding: 15px; background: #fffbe6; border: 1px solid #ffe58f; border-radius: 8px;">
        <h5 style="margin-top: 0; color: #856404; display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1.2em;">📊</span> Distribution Mapping
        </h5>
        ${event.assignments && event.assignments.length > 0 
            ? (() => {
                const grouped = {};
                event.assignments.forEach(a => {
                    const revName = a.reviewer ? a.reviewer.name : "Unassigned";
                    if (!grouped[revName]) grouped[revName] = [];
                    grouped[revName].push(a.student);
                });

                return Object.entries(grouped).map(([rev, students]) => `
                    <div style="margin-bottom: 15px; background: white; padding: 12px; border-radius: 6px; border-left: 5px solid #ffc107; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
                        <div style="font-weight: bold; color: #595959; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px;">
                            Reviewer: ${rev} <span style="font-weight: normal; color: #888; font-size: 0.85em;">(${students.length} students)</span>
                        </div>
                        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;">
                            ${students.map(s => `
                                <div style="background: #fdfdfd; padding: 8px; border-radius: 4px; border: 1px solid #f0f0f0;">
                                    <div style="font-weight: bold; font-size: 0.9em;">${s ? s.name : 'Unknown'}</div>
                                    <div style="font-size: 0.8em; color: #777;">${s ? s.email : 'N/A'}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('');
            })()
            : "<p style='color: #888; font-style: italic; margin-top: 10px;'>No student distribution available. Assign reviewers to create mapping.</p>"
        }
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

function toggleMapping(eventId) {
    const mappingDiv = document.getElementById(`mapping-${eventId}`);
    if (mappingDiv) {
        mappingDiv.classList.toggle('hidden');
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
    const domainSelect = document.getElementById(`domain-select-${eventId}`);
    const revCount = document.getElementById(`rev-count-${eventId}`);
    let queryParams = "";
    
    if (domainSelect) {
        const selectedDomains = Array.from(domainSelect.selectedOptions).map(opt => opt.value);
        if (selectedDomains.length > 0) {
            queryParams = `?domains=${encodeURIComponent(selectedDomains.join(","))}`;
        }
    }

    const res = await fetch(`http://localhost:5000/api/events/reviewers${queryParams}`, {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    let reviewers = await res.json();
    const select = document.getElementById(`reviewer-${eventId}`);
    select.innerHTML = "";
    
    // If filtering returned nothing, show "no matches found" and fallback to ALL reviewers
    if (reviewers.length === 0 && queryParams !== "") {
        const option = document.createElement("option");
        option.disabled = true;
        option.textContent = "no matches found";
        select.appendChild(option);
        
        // Fetch all reviewers as fallback
        const allRes = await fetch(`http://localhost:5000/api/events/reviewers`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        reviewers = await allRes.json();
    }

    if (revCount) {
        revCount.innerText = `(${reviewers.length} found)`;
    }

    const finalSelectedDomains = domainSelect ? Array.from(domainSelect.selectedOptions).map(opt => opt.value) : [];

    if (reviewers.length === 0 && queryParams === "") {
         const option = document.createElement("option");
         option.disabled = true;
         option.textContent = "No reviewers in database";
         select.appendChild(option);
         return;
    }

    if (finalSelectedDomains.length > 0) {
        let globalShownReviewerIds = new Set();
        
        finalSelectedDomains.forEach(domain => {
            const domainReviewers = reviewers.filter(r => 
                r.technicalDomains && r.technicalDomains.includes(domain)
            );
            
            if (domainReviewers.length > 0) {
                const optgroup = document.createElement("optgroup");
                optgroup.label = `Domain: ${domain}`;
                
                domainReviewers.forEach(reviewer => {
                    const option = document.createElement("option");
                    option.value = reviewer._id;
                    const ratingStr = (typeof reviewer.rating === 'number') ? reviewer.rating.toFixed(1) : "0.0";
                    option.textContent = `${reviewer.name} (⭐ Rating: ${ratingStr})`;
                    optgroup.appendChild(option);
                    globalShownReviewerIds.add(reviewer._id);
                });
                select.appendChild(optgroup);
            }
        });

        // If some reviewers were returned by server but didn't fit into groups (e.g. they match one domain but we are showing another), 
        // or just to ensure nothing is lost, show an "Others" category.
        const otherReviewers = reviewers.filter(r => !globalShownReviewerIds.has(r._id));
        if (otherReviewers.length > 0) {
            const optgroup = document.createElement("optgroup");
            optgroup.label = "Other Matches";
            otherReviewers.forEach(reviewer => {
                const option = document.createElement("option");
                option.value = reviewer._id;
                const ratingStr = (typeof reviewer.rating === 'number') ? reviewer.rating.toFixed(1) : "0.0";
                option.textContent = `${reviewer.name} (⭐ Rating: ${ratingStr})`;
                optgroup.appendChild(option);
            });
            select.appendChild(optgroup);
        }
    } else {
        // No filter selected, list everyone
        reviewers.forEach(reviewer => {
            const option = document.createElement("option");
            option.value = reviewer._id;
            const ratingStr = (typeof reviewer.rating === 'number') ? reviewer.rating.toFixed(1) : "0.0";
            option.textContent = `${reviewer.name} (⭐ Rating: ${ratingStr})`;
            select.appendChild(option);
        });
    }
}
async function assignReviewerToEvent(eventId) {
    const select = document.getElementById(`reviewer-${eventId}`);
    if (!select) return;
    
    const selectedOptions = Array.from(select.selectedOptions);
    const reviewerIds = Array.from(new Set(selectedOptions.map(opt => opt.value)));

    if (reviewerIds.length === 0) {
        alert("Please select at least one reviewer");
        return;
    }

    const res = await fetch("http://localhost:5000/api/events/assign-reviewer", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            eventId,
            reviewerIds
        })
    });

    const data = await res.json();
    alert(data.message);
    loadEvents();
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

    if (sectionId === "submissionsTrackerSection") {
        loadTrackerEvents();
    }
}
/* =====================
   SUBMISSIONS TRACKER
===================== */
async function loadTrackerEvents() {
    const res = await fetch("http://localhost:5000/api/events/all", {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const events = await res.json();
    const selector = document.getElementById("eventTrackerSelector");
    selector.innerHTML = `<option value="">-- Select an Event to Track --</option>`;
    events.forEach(ev => {
        const opt = document.createElement("option");
        opt.value = ev._id;
        opt.textContent = ev.title;
        selector.appendChild(opt);
    });
}

async function loadTrackerData(eventId) {
    if (!eventId) {
        document.getElementById("trackerDetails").classList.add("hidden");
        return;
    }

    const res = await fetch(`http://localhost:5000/api/events/tracker/${eventId}`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }

    const { event, submissions } = data;

    // Build a lookup: studentId -> submission info
    const submissionMap = {};
    submissions.forEach(sub => {
        submissionMap[sub.student._id] = sub;
    });

    const students = event.students || [];
    const submittedCount = students.filter(s => submissionMap[s._id]).length;

    document.getElementById("statJoined").innerText = students.length;
    document.getElementById("statSubmitted").innerText = submittedCount;

    const tbody = document.getElementById("trackerTableBody");
    if (students.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="padding:15px; text-align:center; color:#666;">No students have joined this event yet.</td></tr>`;
    } else {
        tbody.innerHTML = students.map(student => {
            const sub = submissionMap[student._id];
            const reviewerName = sub && sub.reviewer ? sub.reviewer.name : "—";
            const statusBg = sub ? (sub.status.includes('Accepted') || sub.status === 'approved' ? '#d4edda' : sub.status === 'pending' ? '#fff3cd' : '#cfe2ff') : '#f8d7da';
            const statusColor = sub ? (sub.status.includes('Accepted') || sub.status === 'approved' ? '#155724' : sub.status === 'pending' ? '#856404' : '#084298') : '#842029';
            const statusText = sub ? sub.status : 'Not Submitted';
            return `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <strong>${student.name}</strong><br>
                    <small style="color:#666;">${student.email}</small>
                </td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${reviewerName}</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                    <span style="padding: 4px 10px; border-radius: 20px; font-size: 0.82rem; font-weight: bold; background: ${statusBg}; color: ${statusColor};">${statusText}</span>
                </td>
            </tr>`;
        }).join("");
    }

    document.getElementById("trackerDetails").classList.remove("hidden");
}

/* =====================
   LOAD & SEARCH REVIEWERS
===================== */
async function loadReviewers() {
    const res = await fetch(`http://localhost:5000/api/events/reviewers`, {
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
                <span>👤 ${r.name} <strong>(⭐ ${r.rating ? r.rating.toFixed(2) : "0.00"})</strong></span>
                <small>▼</small>
            </h4>
            <p>📧 ${r.email}</p>
            <div id="reviewer-details-${r._id}" class="hidden details-panel">
                <div style="background:#f4f9ff; padding:10px; margin-bottom:10px; border-radius:5px; border-left:4px solid #007bff;">
                    <strong>Performance Stats:</strong><br>
                    • Rating: ${r.rating ? r.rating.toFixed(2) : "0.00"}<br>
                    • Total Reviews: ${r.totalReviews || 0} <br>
                    • Avg Accuracy: ${r.avgAccuracy ? r.avgAccuracy.toFixed(2) : "0.00"} <br>
                    • Avg Timeliness: ${r.avgTimeliness ? r.avgTimeliness.toFixed(2) : "0.00"}
                </div>
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

