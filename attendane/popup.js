const loginView = document.getElementById("loginView");
const homeView = document.getElementById("homeView");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeText = document.getElementById("welcomeText");
const attendanceBtn = document.getElementById("attendanceBtn");
const loader = document.getElementById("loader");

const BASE_URL = "https://cb.api-workspace.createbytes.com/api/v1";

document.addEventListener("DOMContentLoaded", () => {
    renderUI();

    loginBtn.addEventListener("click", login);
    logoutBtn.addEventListener("click", logout);
});

function renderUI() {
    chrome.storage.local.get(["accessToken"], (result) => {
        if (result.accessToken) {
            showHomeView();
        } else {
            showLoginView();
        }
    });
}

function showLoginView() {
    chrome.storage.local.get(["email", "password"], (result) => {
        emailInput.value = result.email || "";
        passwordInput.value = result.password || "";
    });

    loginView.classList.add("active");
    homeView.classList.remove("active");
}

function showHomeView() {
    chrome.storage.local.get(["name"], (result) => {
        welcomeText.innerText = `Hi ${result.name}`;
    });

    homeView.classList.add("active");
    loginView.classList.remove("active");
    loadAttendanceStatus();
}

function showLoader() {
    loader.classList.add("active");
    attendanceBtn.style.display = "none";
}

function hideLoader() {
    loader.classList.remove("active");
    attendanceBtn.style.display = "block";
}

async function login() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // validation
    if (email === "" || password === "") {
        status.innerText = "❌ Invalid Inputs";
        return;
    }

    // fetch login API
    try {

        const payload = {
            email: email,
            password: password,
        };

        const response = await fetch(`${BASE_URL}/auth/login/`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)
        });

        if (response.ok) {
            status.innerText = "✅ Checked In";

            const data = await response.json();

            chrome.storage.local.set(
                {
                    accessToken: data.access,
                    name: data.user.name,
                    email: email,
                    password: password,
                },
                () => {
                    renderUI();
                }
            );
        } else {
            status.innerText = "❌ Failed";
        }

    } catch (err) {
        console.log(err);
        status.innerText = "Network Error";
    }
}

function logout() {
    chrome.storage.local.remove("accessToken", () => {
        renderUI();
    });
}

async function loadAttendanceStatus() {
    chrome.storage.local.get(["accessToken"], async (result) => {

        if (!result.accessToken) {
            logout();
            return;
        }

        const today = new Date().toISOString().split("T")[0];

        try {
            showLoader();
            const response = await fetch(
                `${BASE_URL}/attendance/me/?date_after=${today}&date_before=${today}`,
                {
                    headers: {
                        "Authorization": `Bearer ${result.accessToken}`
                    }
                }
            );
            if (response.status === 401) {
                logout();
                return;
            }

            if (!response.ok) return;

            const data = await response.json();

            const logs = data.results.length > 0
                    ? data.results[0].user_entry_logs || []
                    : [];

            if (logs.length === 0) {
                // Check In
                setAttendanceButton("Check In", false, false, checkIn);
            } else {
                const lastLog = logs[logs.length - 1];
                if (lastLog.type === "in") {
                    // Check Out
                    setAttendanceButton("Check Out", false, true, checkOut);
                } else {
                    // Checked Out
                    setAttendanceButton("Checked Out", true, true, null);
                }
            }
        } catch (err) {
            console.log(err);
        } finally {
            hideLoader();
        }
    });
}

function setAttendanceButton(text, disabled, isCheckout, onClick) {
    attendanceBtn.innerText = text;
    attendanceBtn.disabled = disabled;
    attendanceBtn.classList.toggle("checkout", isCheckout);
    attendanceBtn.onclick = onClick;
}

async function checkIn() {
    chrome.storage.local.get(["accessToken"], async (result) => {

        try {
            const response = await fetch(
                `${BASE_URL}/api/v1/attendance/check-in/`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${result.accessToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.ok) {
                await loadAttendanceStatus();
            } else {
                console.error("Check In failed");
            }

        } catch (err) {
            console.error(err);
        }

    });
}

async function checkOut() {
    chrome.storage.local.get(["accessToken"], async (result) => {

        try {
            const response = await fetch(
                `${BASE_URL}/attendance/check-out/`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${result.accessToken}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (response.ok) {
                await loadAttendanceStatus();
            } else {
                console.error("Check Out failed");
            }

        } catch (err) {
            console.error(err);
        }

    });
}