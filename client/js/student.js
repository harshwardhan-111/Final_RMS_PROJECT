const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
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

    loadJoinedEvents();

  } catch (err) {
    console.error(err);
  }
};

/* =========================================
   LOAD JOINED EVENTS
========================================= */
async function loadJoinedEvents() {
  try {
    const res = await fetch("http://localhost:5000/api/events/student", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const events = await res.json();

    const container = document.getElementById("submissionList");
    container.innerHTML = "<h4>Joined Events</h4>";

    events.forEach(event => {
      container.innerHTML += `
        <div class="card">
          <h4>${event.title}</h4>
          <p>Status: ${event.status}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
  }
}

/* =========================================
   LOAD SUBMISSIONS
========================================= */
async function loadMySubmissions() {
  try {
    const res = await fetch("http://localhost:5000/api/submissions/my", {
      headers: {
        Authorization: "Bearer " + token
      }
    });

    const submissions = await res.json();

    const container = document.getElementById("submissionList");

    container.innerHTML += "<h4>My Submissions</h4>";

    submissions.forEach(sub => {
      container.innerHTML += `
        <div class="card">
          <p><strong>Event:</strong> ${sub.event?.title || "Unknown"}</p>
          <p>Status: ${sub.status}</p>
          <p>File: ${sub.fileName}</p>
        </div>
      `;
    });

  } catch (err) {
    console.error(err);
  }
}

/* =========================================
   UPLOAD SUBMISSION
========================================= */
window.uploadSubmission = async function () {
  try {
    const fileInput = document.getElementById("fileInput");
    const eventCode = document.getElementById("eventCode").value.trim();

    if (!fileInput.files.length) {
      alert("Please select a file");
      return;
    }

    if (!eventCode) {
      alert("Please enter event code");
      return;
    }

    const formData = new FormData();
    formData.append("projectFile", fileInput.files[0]); // MUST match multer
    formData.append("eventCode", eventCode);

    const res = await fetch("http://localhost:5000/api/submissions/upload", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token
      },
      body: formData
    });

    const data = await res.json();
    alert(data.message);

    loadMySubmissions();

  } catch (err) {
    console.error(err);
  }
};

/* =========================================
   ON LOAD
========================================= */
window.onload = function () {
  loadJoinedEvents();
  loadMySubmissions();
};