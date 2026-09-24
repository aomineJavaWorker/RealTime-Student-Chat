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

const messages = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const messageError = document.getElementById("messageError");

let currentUserId = null;


if (course) {
    courseTitle.textContent = `${course}. kursa čats`;
    chatTitle.textContent = `${course}. kursa čats`;
}


joinButton.addEventListener("click", async () => {
    const username = usernameInput.value.trim();

    if (username === "") {
        usernameError.textContent = "Lūdzu, ievadi savu vārdu!";
        usernameError.classList.remove("d-none");
        return;
    }

    try {
        const response = await fetch("/api/users", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username: username,
                courseNumber: Number(course)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Neizdevās izveidot lietotāju."
            );
        }

        currentUserId = data._id;

        usernameError.classList.add("d-none");

        usernameDisplay.textContent = data.username;

        loginSection.classList.add("d-none");
        chatSection.classList.remove("d-none");

        console.log("Izveidots lietotājs:", data);
        console.log("User ID:", currentUserId);

    } catch (error) {
        usernameError.textContent = error.message;
        usernameError.classList.remove("d-none");
    }
});

function addMessageToChat(message) {
    const emptyMessage = messages.querySelector(".text-secondary");

    if (emptyMessage) {
        emptyMessage.remove();
    }

    const messageElement = document.createElement("div");

    messageElement.classList.add(
        "border-bottom",
        "pb-2",
        "mb-2"
    );

    const usernameElement = document.createElement("strong");

    usernameElement.textContent =
        message.user.username;

    const textElement = document.createElement("p");

    textElement.classList.add("mb-0");

    textElement.textContent =
        message.text;

    messageElement.appendChild(usernameElement);
    messageElement.appendChild(textElement);

    messages.appendChild(messageElement);
}

sendButton.addEventListener("click", async () => {
    const messageText = messageInput.value.trim();

    if (messageText === "") {
        messageError.textContent = "Lūdzu, ievadi ziņu!";
        messageError.classList.remove("d-none");
        return;
    }

    if (!currentUserId) {
        messageError.textContent = "Lietotājs nav pievienojies čatam.";
        messageError.classList.remove("d-none");
        return;
    }

    try {
        const response = await fetch("/api/messages", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                text: messageText,
                userId: currentUserId,
                courseNumber: Number(course)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Neizdevās nosūtīt ziņu."
            );
        }

        messageError.classList.add("d-none");

        addMessageToChat(data);

        messageInput.value = "";

    } catch (error) {
        messageError.textContent = error.message;
        messageError.classList.remove("d-none");
    }
});

messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        sendButton.click();
    }
});