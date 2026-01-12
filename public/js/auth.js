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

    // Client-side reference (optional, UI use only)
    sessionStorage.setItem("LOGGED_IN_USER", email); // NO I18N

    // 🔥 Server-side session (CRITICAL for SAML)
    await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" }, // NO I18N
        body: JSON.stringify({ email }),
        credentials: "include" // REQUIRED for cookies
    });

    // Navigate after session is established
    window.location.href = "/courses.html"; // NO I18N
}
