const button = document.getElementById("checkinBtn");
const status = document.getElementById("status");

button.addEventListener("click", async () => {

    status.innerText = "Checking in...";

    try {

        const response = await fetch("http://localhost:8000/api/v1/users/login/", {
            method: "POST",

            headers: {
                // "Authorization": "Bearer YOUR_ACCESS_TOKEN",
                "Content-Type": "application/json"
            },

            body: JSON.stringify({})
        });

        if (response.ok) {
            status.innerText = "✅ Checked In";
        } else {
            status.innerText = "❌ Failed";
        }

    } catch (err) {
        console.error(err);
        status.innerText = "Network Error";
    }

});