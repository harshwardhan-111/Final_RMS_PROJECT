const token = localStorage.getItem("token");

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
async function createEventHandler()  {
    const title = document.getElementById("eventTitle").value;
    const type = document.getElementById("eventType").value;
    const description = document.getElementById("eventDesc").value;

    const res = await fetch("http://localhost:5000/api/events/create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            title,
            type,
            description
        })
    });

    const data = await res.json();
    alert(data.message);
    loadEvents();
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
    <h4>${event.title}</h4>
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
`;

        container.appendChild(card);
        loadReviewersForEvent(event._id);
    });
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
async function loadReviewers() {

    const res = await fetch(
        "http://localhost:5000/api/events/reviewers",
        {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        }
    );

    const reviewers = await res.json();

    const container = document.getElementById("reviewerList");
    container.innerHTML = "";

    reviewers.forEach(r => {

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <h4>${r.name}</h4>
            <p>${r.email}</p>
        `;

        container.appendChild(card);
    });
}
loadEvents();
