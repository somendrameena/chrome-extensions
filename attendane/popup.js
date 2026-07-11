const loginView = document.getElementById("loginView");
const homeView = document.getElementById("homeView");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

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
    loginView.classList.add("active");
    homeView.classList.remove("active");
}

function showHomeView() {
    homeView.classList.add("active");
    loginView.classList.remove("active");
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
                    email: data.user.email,
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