const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "login.html";
}

async function loadSubmissions() {
    try {
        const res = await fetch("http://localhost:5000/api/submissions/reviewer", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await res.json();

        const container = document.getElementById("submissionList");
        container.innerHTML = "";

        if (data.length === 0) {
            container.innerHTML = "<p>No submissions assigned.</p>";
            return;
        }

        data.forEach(sub => {
            const card = document.createElement("div");
            card.className = "card";

           card.innerHTML = `
    <h4>${sub.event.title}</h4>
    <p><strong>Student:</strong> ${sub.student.name}</p>
    <p><strong>Email:</strong> ${sub.student.email}</p>
    <p><strong>Status:</strong> ${sub.status}</p>

    <a href="http://localhost:5000/uploads/${sub.fileName}" 
       target="_blank" class="preview-link">
       View Uploaded File
    </a>

    <textarea placeholder="Add feedback..." id="feedback-${sub._id}"></textarea>

    <div class="button-group">
        <button class="approve" onclick="review('${sub._id}','approved')">Approve</button>
        <button class="reject" onclick="review('${sub._id}','rejected')">Reject</button>
    </div>
`;

            container.appendChild(card);
        });

    } catch (err) {
        console.error(err);
    }
}

async function review(id, decision) {
    const feedback = document.getElementById(`feedback-${id}`).value;

    try {
        const res = await fetch("http://localhost:5000/api/submissions/review", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                submissionId: id,
                decision,
                feedback
            })
        });

        const data = await res.json();
        alert(data.message);
        loadSubmissions();

    } catch (err) {
        console.error(err);
    }
}

function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

loadSubmissions();
