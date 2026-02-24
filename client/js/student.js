const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

/* =============================
   JOIN EVENT
============================= */
async function joinEvent() {
    const eventCode = document.getElementById("eventCode").value.trim();

    if (!eventCode) {
        alert("Enter event code");
        return;
    }

    const res = await fetch("http://localhost:5000/api/events/join", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ eventCode })
    });

    const data = await res.json();
    alert(data.message);
}


/* =============================
   UPLOAD SUBMISSION
============================= */
async function uploadSubmission() {
    const eventCode = document.getElementById("uploadEventCode").value.trim();
    const file = document.getElementById("projectFile").files[0];

    if (!eventCode || !file) {
        alert("Event code and file required");
        return;
    }

    const formData = new FormData();
    formData.append("eventCode", eventCode);
    formData.append("file", file);

    const res = await fetch("http://localhost:5000/api/submissions/upload", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${token}`
        },
        body: formData
    });

    const data = await res.json();
    alert(data.message);
    loadSubmissions();
}


/* =============================
   LOAD MY SUBMISSIONS
============================= */
async function loadSubmissions() {
    const res = await fetch("http://localhost:5000/api/submissions/my", {
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await res.json();

    const container = document.getElementById("submissionList");
    container.innerHTML = "";

    if (data.length === 0) {
        container.innerHTML = "<p>No submissions yet.</p>";
        return;
    }

    data.forEach(sub => {

        let statusClass = "";
        if (sub.status === "approved") statusClass = "status-approved";
        else if (sub.status === "rejected") statusClass = "status-rejected";
        else statusClass = "status-pending";

        const card = document.createElement("div");
        card.className = "card";

        card.innerHTML = `
            <h4>${sub.event.title}</h4>
            <p><strong>Event Code:</strong> ${sub.event.eventCode}</p>

            <span class="status-badge ${statusClass}">
                ${sub.status.toUpperCase()}
            </span>

            <br>

            <a href="http://localhost:5000/uploads/${sub.fileName}" 
               target="_blank" class="preview-link">
               View My Submission
            </a>

            ${sub.reviewerFeedback ? `
                <div class="feedback-box">
                    <strong>Reviewer Feedback:</strong>
                    <p>${sub.reviewerFeedback}</p>
                </div>
            ` : ""}
        `;

        container.appendChild(card);
    });
}


function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

loadSubmissions();
