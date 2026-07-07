const status = document.getElementById("status");
const loginBtn = document.getElementById("loginBtn");
const checkInBtn = document.getElementById("checkInBtn");

document.addEventListener("DOMContentLoaded", () => {

    chrome.storage.local.get(["accessToken"], (result) => {

        if (result.accessToken) {
            status.innerText = "Logged In";
            checkInBtn.style.display = "block";
        } else {
            status.innerText = "Not Logged In";
            loginBtn.style.display = "block";
        }

    });

});