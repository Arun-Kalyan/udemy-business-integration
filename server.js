// server.js  // NO I18N

const express = require("express"); // NO I18N
const fetch = require("node-fetch"); // NO I18N
const jwt = require("jsonwebtoken"); // NO I18N
const path = require("path"); // NO I18N

const app = express();

/* =======================
   Body Parsing
======================= */
app.use(express.json()); // NO I18N
app.use(express.urlencoded({ extended: true })); // NO I18N
app.use(express.static(path.join(__dirname, ".."))); // NO I18N

/* =======================
   Config
======================= */
const JWT_SECRET = "super-secret-key-change-later"; // NO I18N

const STATIC_CLIENT = {
    clientId: "lms_udemy_client", // NO I18N
    clientSecret: "lms_udemy_secret_123", // NO I18N
    scope: "xapi:write" // NO I18N
};

/* =======================
   Incoming Request Logger
======================= */
app.use((req, res, next) => {
    console.log(`[INCOMING] ${req.method} ${req.originalUrl}`); // NO I18N
    next();
});

/* =======================
   CORS
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

const ACCOUNT_NAME = "zohopeople-test"; // NO I18N
const ACCOUNT_ID = "371985"; // NO I18N
const CLIENT_ID = "QSt7GSdOpCJW5fdfzZze9Q0xh0JCbUtPe3QGkRFA"; // NO I18N
const CLIENT_SECRET =
    "Ggf1ClVZ04yYD63QPYrkTNeiFSVWuUQyXrhvjlsxSz2w5xuNFcQFV3RogDGO4bWTPAsg2JxVTjYKgijJNqenYiDPTOlU9dOlOLRzZJb59Fv3ptB6evLqkIuibqALXxEQ"; // NO I18N

app.get("/api/udemy/courses", async (req, res) => {
    try {
        const page = parseInt(req.query.page || "1", 10); // NO I18N
        const pageSize = parseInt(req.query.page_size || "25", 10); // NO I18N

        const url =
            `https://${ACCOUNT_NAME}.udemy.com/api-2.0/organizations/` +
            `${ACCOUNT_ID}/courses/list/?page=${page}&page_size=${pageSize}`; // NO I18N

        const auth = Buffer
            .from(`${CLIENT_ID}:${CLIENT_SECRET}`)
            .toString("base64"); // NO I18N

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Basic ${auth}`, // NO I18N
                "Accept": "application/json" // NO I18N
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
    try {
        const { client_id, client_secret, grant_type } = req.body;

        if (grant_type !== "client_credentials") {
            return res.status(400).json({ error: "unsupported_grant_type" }); // NO I18N
        }

        const cid = (client_id || "").trim();
        const cs = (client_secret || "").trim();

        if (
            cid !== STATIC_CLIENT.clientId ||
            cs !== STATIC_CLIENT.clientSecret
        ) {
            return res.status(401).json({ error: "invalid_client" }); // NO I18N
        }

        const token = jwt.sign(
            { client_id: cid, scope: STATIC_CLIENT.scope },
            JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.json({
            access_token: token,
            token_type: "Bearer",
            expires_in: 3600,
            scope: STATIC_CLIENT.scope
        });

    } catch (err) {
        console.error("OAuth error:", err.message); // NO I18N
        res.sendStatus(500);
    }
});

/* =======================
   Canonical xAPI Endpoint
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
   xAPI Dynamic Path Trap (REGEX)
======================= */

app.post(/^\/api\/xapi\/statements\/.+/, (req, res) => {
    console.error("⚠️ UNEXPECTED xAPI PATH HIT"); // NO I18N
    console.error("Path:", req.originalUrl); // NO I18N
    res.status(400).json({ error: "invalid_xapi_endpoint" }); // NO I18N
});

/* =======================
   Global POST Catch-All (REGEX)
======================= */

app.post(/.*/, (req, res) => {
    console.warn("POST to unknown endpoint:", req.originalUrl); // NO I18N
    res.sendStatus(404);
});

/* =======================
   Health + Root
======================= */

app.get("/health", (req, res) => {
    res.json({ status: "ok" }); // NO I18N
});

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "..", "html", "index.html")
    ); // NO I1

});

/* =======================
   Start Server
======================= */

const PORT = 3000; // NO I18N
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`); // NO I18N
});
