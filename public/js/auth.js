// auth.js  // NO I18N

function authenticate(email, password) {
    return USERS.some(u =>
        u.email === email && u.password === password
    );
}

function togglePassword() {
    const pwd = document.getElementById("password"); // NO I18N
    pwd.type = pwd.type === "password" ? "text" : "password";
}

async function handleLogin() {
    const email = document.getElementById("email").value;        // NO I18N
    const password = document.getElementById("password").value; // NO I18N
    const errorDiv = document.getElementById("error");           // NO I18N

    if (!authenticate(email, password)) {
        errorDiv.style.display = "block";
        return;
    }

    // Browser session (existing)
    sessionStorage.setItem("LOGGED_IN_USER", email); // NO I18N

    // 🔥 Server session (REQUIRED FOR SAML)
    await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // NO I18N
        body: JSON.stringify({ email }),
        credentials: "include" // IMPORTANT
    });

    window.location.href = "../html/courses.html"; // NO I18N
}
