const loginView = document.getElementById("loginView");
const homeView = document.getElementById("homeView");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeText = document.getElementById("welcomeText");

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

        const response = await fetch("https://cb.api-workspace.createbytes.com/api/v1/auth/login/", {
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

        if (!result.accessToken) return;

        const today = new Date().toISOString().split("T")[0];

        try {
            const response = await fetch(
                `https://cb.api-workspace.createbytes.com/api/v1/attendance/me/?date_after=${today}&date_before=${today}`,
                {
                    headers: {
                        "Authorization": `Bearer ${result.accessToken}`
                    }
                }
            );

            if (!response.ok) return;

            const data = await response.json();

            updateAttendanceButton(data);

        } catch (err) {
            console.error(err);
        }
    });
}

function updateAttendanceButton(data) {

    const attendanceBtn = document.getElementById("attendanceBtn");

    let checkedIn = false;

    if (
        data.results.length > 0 &&
        data.results[0].user_entry_logs &&
        data.results[0].user_entry_logs.length > 0
    ) {
        checkedIn = true;
    }

    if (checkedIn) {
        attendanceBtn.innerText = "Check Out";
        attendanceBtn.classList.add("checkout");
    } else {
        attendanceBtn.innerText = "Check In";
        attendanceBtn.classList.remove("checkout");
    }
}