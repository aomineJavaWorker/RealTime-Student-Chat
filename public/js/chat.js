const params = new URLSearchParams(window.location.search);
const course = params.get("course");

const courseTitle = document.getElementById("courseTitle");
const chatTitle = document.getElementById("chatTitle");

const usernameInput = document.getElementById("usernameInput");
const joinButton = document.getElementById("joinButton");
const usernameError = document.getElementById("usernameError");

const loginSection = document.getElementById("loginSection");
const chatSection = document.getElementById("chatSection");

const usernameDisplay = document.getElementById("usernameDisplay");


if (course) {
    courseTitle.textContent = `${course}. kursa čats`;
    chatTitle.textContent = `${course}. kursa čats`;
}


joinButton.addEventListener("click", () => {

    const username = usernameInput.value.trim();

    if (username === "") {

        usernameError.classList.remove("d-none");

        return;
    }

    usernameError.classList.add("d-none");

    usernameDisplay.textContent = username;

    loginSection.classList.add("d-none");
    chatSection.classList.remove("d-none");

});