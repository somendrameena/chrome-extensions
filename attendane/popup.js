const loginView = document.getElementById("loginView");
const homeView = document.getElementById("homeView");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const welcomeText = document.getElementById("welcomeText");
const attendanceBtn = document.getElementById("attendanceBtn");
const loginError = document.getElementById("loginError");
const attendanceError = document.getElementById("attendanceError");

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
        passwordInput.value = "";
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

function setButtonLoading(button, isLoading) {
    if (isLoading) {
        if (button.getAttribute("aria-busy") === "true") {
            return;
        }

        button.dataset.text = button.innerText;
        button.setAttribute("aria-busy", "true");
        button.disabled = true;
        button.innerHTML = '<span class="button-spinner" aria-label="Loading"></span>';
        return;
    }

    button.innerText = button.dataset.text || button.innerText;
    button.disabled = button.classList.contains("disabled");
    delete button.dataset.text;
    button.removeAttribute("aria-busy");
}

function showError(element, message) {
    element.innerText = message;
    element.classList.add("active");
}

function clearError(element) {
    element.innerText = "";
    element.classList.remove("active");
}

async function getErrorMessage(response, fallback) {
    try {
        const data = await response.json();
        return data.detail || data.message || data.error || fallback;
    } catch {
        return fallback;
    }
}

function getStoredValues(keys) {
    return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
    });
}

async function login() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    clearError(loginError);

    // validation
    if (email === "" || password === "") {
        showError(loginError, "Please enter your email and password.");
        return;
    }

    // fetch login API
    try {
        setButtonLoading(loginBtn, true);

        const payload = {
            email: email,
            password: password,
        };

        const response = await fetch(`${BASE_URL}/auth/login/`, {
            method: "POST",
            credentials: "omit",
            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const data = await response.json();

            chrome.storage.local.set(
                {
                    accessToken: data.access,
                    name: data.user.name,
                    email: email,
                },
                () => {
                    renderUI();
                }
            );
        } else {
            showError(
                loginError,
                await getErrorMessage(response, "Login failed. Please check your credentials.")
            );
        }

    } catch (err) {
        console.log(err);
        showError(loginError, "Unable to connect. Please try again.");
    } finally {
        setButtonLoading(loginBtn, false);
    }
}

function logout() {
    chrome.storage.local.remove("accessToken", () => {
        renderUI();
    });
}

async function loadAttendanceStatus() {
    const result = await getStoredValues(["accessToken"]);

    if (!result.accessToken) {
        logout();
        return;
    }

    const today = new Date().toISOString().split("T")[0];

    try {
        clearError(attendanceError);
        setButtonLoading(attendanceBtn, true);
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

        if (!response.ok) {
            showError(
                attendanceError,
                await getErrorMessage(response, "Could not load attendance status.")
            );
            return;
        }

        const data = await response.json();

        const logs =
            data.results.length > 0
                ? data.results[0].user_entry_logs || []
                : [];

        const hasCheckIn = logs.some(log => log.type === "in");
        const hasCheckOut = logs.some(log => log.type === "out");

        if (!hasCheckIn) {
            // No check-in yet
            setAttendanceButton("Check In", false, "checkin", checkIn);

        } else if (!hasCheckOut) {
            // Checked in, but not checked out
            setAttendanceButton("Check Out", false, "checkout", checkOut);

        } else {
            // Both check-in and check-out completed
            setAttendanceButton("Checked Out", true, "disabled", null);
        }
    } catch (err) {
        console.log(err);
        showError(attendanceError, "Unable to connect. Please try again.");
    } finally {
        setButtonLoading(attendanceBtn, false);
    }
}

function setAttendanceButton(text, disabled, buttonClass, onClick) {
    if (attendanceBtn.getAttribute("aria-busy") === "true") {
        attendanceBtn.dataset.text = text;
    } else {
        attendanceBtn.innerText = text;
    }

    attendanceBtn.disabled = disabled;
    attendanceBtn.onclick = onClick;

    attendanceBtn.classList.remove("checkin", "checkout", "disabled");
    if (buttonClass) {
        attendanceBtn.classList.add(buttonClass);
    }
}

async function checkIn() {
    const result = await getStoredValues(["accessToken"]);

    try {
        clearError(attendanceError);
        setButtonLoading(attendanceBtn, true);
        const response = await fetch(
            `${BASE_URL}/attendance/check-in/`,
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
            showError(
                attendanceError,
                await getErrorMessage(response, "Check in failed. Please try again.")
            );
        }
    } catch (err) {
        console.error(err);
        showError(attendanceError, "Unable to connect. Please try again.");
    } finally {
        setButtonLoading(attendanceBtn, false);
    }
}

async function checkOut() {
    const result = await getStoredValues(["accessToken"]);

    try {
        clearError(attendanceError);
        setButtonLoading(attendanceBtn, true);
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
            showError(
                attendanceError,
                await getErrorMessage(response, "Check out failed. Please try again.")
            );
        }
    } catch (err) {
        console.error(err);
        showError(attendanceError, "Unable to connect. Please try again.");
    } finally {
        setButtonLoading(attendanceBtn, false);
    }
}
