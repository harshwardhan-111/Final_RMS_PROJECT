const API_URL = "http://localhost:5000/api/auth";

async function register() {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  const res = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ name, email, password, role })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Registration successful!");
    localStorage.setItem("token", data.token);
    window.location.href = "login.html";
  } else {
    alert(data.message);
  }
}

async function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (res.ok) {
  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.role);

  if (data.role === "student") {
  window.location.href = "student-dashboard.html";
} 
else if (data.role === "reviewer") {
  window.location.href = "reviewer-dashboard.html";
}
else if (data.role === "admin") {
  window.location.href = "admin-dashboard.html";
}

 else {
    alert(data.message);
  }
}
}
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}
