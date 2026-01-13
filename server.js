// server.js  // NO I18N
require("dotenv").config(); // NO I18N

const express = require("express"); // NO I18N
const fetch = require("node-fetch"); // NO I18N
const jwt = require("jsonwebtoken"); // NO I18N
const path = require("path"); // NO I18N

const app = express();

/* =======================
   Body Parsing + Static
======================= */
app.use(express.json()); // NO I18N
app.use(express.urlencoded({ extended: true })); // NO I18N
app.use(express.static(path.join(__dirname, "public"))); // NO I18N

/* =======================
   Environment Config
======================= */
const {
    PORT = 3000,
    JWT_SECRET,
    STATIC_CLIENT_ID,
    STATIC_CLIENT_SECRET,
    UDEMY_ACCOUNT_NAME,
    UDEMY_ACCOUNT_ID,
    UDEMY_CLIENT_ID,
    UDEMY_CLIENT_SECRET
} = process.env;

/* =======================
   Validation (Fail Fast)
======================= */
[
    "JWT_SECRET",
    "STATIC_CLIENT_ID",
    "STATIC_CLIENT_SECRET",
    "UDEMY_ACCOUNT_NAME",
    "UDEMY_ACCOUNT_ID",
    "UDEMY_CLIENT_ID",
    "UDEMY_CLIENT_SECRET"
].forEach(key => {
    if (!process.env[key]) {
        throw new Error(`Missing env variable: ${key}`); // NO I18N
    }
});

/* =======================
   Incoming Request Logger
======================= */
app.use((req, res, next) => {
    console.log(`[INCOMING] ${req.method} ${req.originalUrl}`); // NO I18N
    next();
});

/* =======================
   CORS (Simple)
======================= */
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*"); // NO I18N
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS"); // NO I18N
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    ); // NO I18N

    if (req.method === "OPTIONS") {
        return res.sendStatus(200); // NO I18N
    }
    next();
});

/* =======================
   Udemy Catalog Proxy
======================= */
app.get("/api/udemy/courses", async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1", 10); // NO I18N
        const pageSize = parseInt(req.query.page_size || "25", 10); // NO I18N

        const url =
            `https://${UDEMY_ACCOUNT_NAME}.udemy.com/api-2.0/organizations/` +
            `${UDEMY_ACCOUNT_ID}/courses/list/?page=${page}&page_size=${pageSize}`; // NO I18N

        const auth = Buffer
            .from(`${UDEMY_CLIENT_ID}:${UDEMY_CLIENT_SECRET}`)
            .toString("base64"); // NO I18N

        const response = await fetch(url, {
            headers: {
                Authorization: `Basic ${auth}`, // NO I18N
                Accept: "application/json" // NO I18N
            }
        });

        if (!response.ok) {
            throw new Error(`Udemy API error ${response.status}`); // NO I18N
        }

        res.json(await response.json());

    } catch (err) {
        console.error("Udemy proxy error:", err.message); // NO I18N
        res.status(500).json({ error: "Udemy proxy failure" }); // NO I18N
    }
});

/* =======================
   OAuth Token Endpoint
======================= */
app.post("/api/oauth/token", (req, res) => {
    const { client_id, client_secret, grant_type } = req.body;
    
    console.log("Input client_id =", client_id); // NO I18N
    console.log("Input client_secret =", client_secret); // NO I18N
    console.log("Input grant_type =", grant_type); // NO I18N
    console.log("STATIC_CLIENT_ID =", STATIC_CLIENT_ID); // NO I18N
    console.log("STATIC_CLIENT_SECRET =", STATIC_CLIENT_SECRET); // NO I18N

    if (grant_type !== "client_credentials") {
        return res.status(400).json({ error: "unsupported_grant_type" }); // NO I18N
    }

    if (
        client_id !== STATIC_CLIENT_ID ||
        client_secret !== STATIC_CLIENT_SECRET
    ) {
        return res.status(401).json({ error: "invalid_client" }); // NO I18N
    }

    const token = jwt.sign(
        { client_id, scope: "xapi:write" },
        JWT_SECRET,
        { expiresIn: "1h" }
    );

    res.json({
        access_token: token,
        token_type: "Bearer",
        expires_in: 3600,
        scope: "xapi:write"
    });
});

/* =======================
   xAPI Endpoint
======================= */
app.post("/api/xapi/statements", (req, res) => {
    try {
        const auth = req.headers.authorization || "";

        if (!auth.startsWith("Bearer ")) {
            return res.sendStatus(401); // NO I18N
        }

        jwt.verify(auth.split(" ")[1], JWT_SECRET);

        console.log("xAPI Statement Received"); // NO I18N
        console.log(JSON.stringify(req.body, null, 2)); // NO I18N

        res.sendStatus(204);

    } catch (err) {
        console.error("xAPI auth error:", err.message); // NO I18N
        res.sendStatus(401);
    }
});

/* =======================
   Root + Health
======================= */
app.get("/health", (req, res) => {
    res.json({ status: "ok" }); // NO I18N
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html")); // NO I18N
});

/* =======================
   Start Server
======================= */
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`); // NO I18N
});
