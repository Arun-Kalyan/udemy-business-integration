// courses.js  // NO I18N

/* ======================
   Auth & Header
====================== */

const email = sessionStorage.getItem("LOGGED_IN_USER"); // NO I18N
if (!email) {
    window.location.href = "../index.html"; // NO I18N
}

document.getElementById("userEmail").innerText = email;
document.getElementById("userAvatar").innerText =
    email.charAt(0).toUpperCase(); // NO I18N

function logout() {
    sessionStorage.removeItem("LOGGED_IN_USER"); // NO I18N
    window.location.href = "../index.html"; // NO I18N
}

/* ======================
   Top Tabs (SINGLE handler)
====================== */

document.querySelectorAll(".top-tab").forEach(tab => {
    tab.addEventListener("click", () => {

        document.querySelectorAll(".top-tab")
            .forEach(t => t.classList.remove("active"));

        document.querySelectorAll(".tab-content")
            .forEach(c => c.classList.remove("active"));

        tab.classList.add("active");
        document.getElementById(tab.dataset.tab)
            .classList.add("active");
    });
});

/* ======================
   Pagination State
====================== */

let currentPage = 1; // NO I18N
let pageSize = 25;   // NO I18N
let totalCount = 0;  // NO I18N

/* ======================
   Fetch Courses
====================== */

async function fetchCourses() {
    try {
        renderSkeletons();

        const response = await fetch(
            `http://127.0.0.1:3000/api/udemy/courses?page=${currentPage}&page_size=${pageSize}` // NO I18N
        );

        if (!response.ok) {
            throw new Error("HTTP " + response.status); // NO I18N
        }

        const data = await response.json();

        totalCount = data.count || 0;
        renderCourses(data.results || []);
        renderPagination();

    } catch (e) {
        console.error("Failed to fetch courses", e); // NO I18N
    }
}

/* ======================
   Render Courses
====================== */

function renderCourses(courses) {
    const grid = document.getElementById("coursesGrid"); // NO I18N
    grid.innerHTML = "";

    courses.forEach(course => {

        const hours = Math.round(
            (course.estimated_content_length_video || 0) / 60
        ); // NO I18N

        const card = document.createElement("div");
        card.className = "course-card"; // NO I18N
        card.dataset.url = course.url;  // NO I18N

        card.innerHTML = `
            <img src="${course.images?.size_480x270 || ""}" alt="${course.title}" />
            <div class="course-body">
                <div class="course-title">${course.title}</div>
                <div class="course-instructor">${course.instructors?.[0] || ""}</div>
                <div class="course-meta">
                    ${hours} hrs • ${course.num_lectures || 0} lectures
                </div>
                <div class="course-category">
                    ${course.primary_subcategory?.title || ""}
                </div>
            </div>
        `;

        grid.appendChild(card);
    });
}

/* ======================
   Card Click → Udemy
====================== */

document.addEventListener("click", (e) => {
    const card = e.target.closest(".course-card"); // NO I18N
    if (card && card.dataset.url) {
        window.open(card.dataset.url, "_blank"); // NO I18N
    }
});

/* ======================
   Pagination Rendering
====================== */

function renderPagination() {
    let pagination = document.getElementById("pagination"); // NO I18N
    if (!pagination) {
        pagination = document.createElement("div");
        pagination.id = "pagination"; // NO I18N
        pagination.className = "pagination"; // NO I18N
        document.getElementById("coursesTab").appendChild(pagination);
    }

    const totalPages = Math.ceil(totalCount / pageSize);
    pagination.innerHTML = "";

    const createBtn = (label, disabled, onClick) => {
        const btn = document.createElement("button");
        btn.innerText = label; // NO I18N
        btn.disabled = disabled;
        btn.onclick = onClick;
        return btn;
    };

    pagination.appendChild(
        createBtn("Prev", currentPage === 1, () => {
            currentPage--;
            fetchCourses();
        })
    );

    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const btn = createBtn(i, false, () => {
            currentPage = i;
            fetchCourses();
        });
        if (i === currentPage) btn.classList.add("active");
        pagination.appendChild(btn);
    }

    pagination.appendChild(
        createBtn("Next", currentPage === totalPages, () => {
            currentPage++;
            fetchCourses();
        })
    );

    const startRec = (currentPage - 1) * pageSize + 1;
    const endRec = Math.min(currentPage * pageSize, totalCount);

    document.getElementById("resultsInfo").innerText =
        `Showing ${startRec}-${endRec} of ${totalCount}`; // NO I18N
}

/* ======================
   Page Size Change
====================== */

document.getElementById("pageSize").addEventListener("change", (e) => {
    pageSize = parseInt(e.target.value, 10); // NO I18N
    currentPage = 1;
    fetchCourses();
});

/* ======================
   Skeleton Loader
====================== */

function renderSkeletons() {
    const grid = document.getElementById("coursesGrid"); // NO I18N
    grid.innerHTML = "";

    for (let i = 0; i < pageSize; i++) {
        const skeleton = document.createElement("div");
        skeleton.className = "skeleton"; // NO I18N
        skeleton.innerHTML = `
            <div class="skeleton-img"></div>
            <div class="skeleton-body">
                <div class="skeleton-line"></div>
                <div class="skeleton-line short"></div>
                <div class="skeleton-line"></div>
                <div class="skeleton-line tiny"></div>
            </div>
        `;
        grid.appendChild(skeleton);
    }
}

/* ======================
   API Explorer
====================== */

const API_MAP = {
    courses: { url: () => `http://127.0.0.1:3000/api/udemy/courses?page=1&page_size=25` },
    categories: { url: () => `http://127.0.0.1:3000/api/udemy/categories` },
    instructors: { url: () => `http://127.0.0.1:3000/api/udemy/instructors` }
};

document.querySelectorAll(".api-btn").forEach(btn => {
    btn.addEventListener("click", async () => {

        document.querySelectorAll(".api-btn")
            .forEach(b => b.classList.remove("active"));

        btn.classList.add("active");

        const apiUrl = API_MAP[btn.dataset.api].url();
        document.getElementById("apiUrl").innerText = apiUrl;
        document.getElementById("apiResponse").innerText = "Loading..."; // NO I18N

        try {
            const res = await fetch(apiUrl);
            const data = await res.json();
            document.getElementById("apiResponse").innerHTML =
                prettyPrintJSON(data); // NO I18N
        } catch {
            document.getElementById("apiResponse").innerText =
                "Failed to fetch API response"; // NO I18N
        }
    });
});

function prettyPrintJSON(json) {
    return JSON.stringify(json, null, 2);
}

/* ======================
   Initial Load
====================== */

fetchCourses();
