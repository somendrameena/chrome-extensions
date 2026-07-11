const loginView = document.getElementById("loginView");
const homeView = document.getElementById("homeView");

document.addEventListener("DOMContentLoaded", () => {
    renderUI();
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