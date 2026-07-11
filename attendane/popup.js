const loginView = document.getElementById("loginView");
const homeView = document.getElementById("homeView");
const logoutBtn = document.getElementById("logoutBtn");

document.addEventListener("DOMContentLoaded", () => {
    renderUI();

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

function logout() {
    chrome.storage.local.remove("accessToken", () => {
        renderUI();
    });
}