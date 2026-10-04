const params = new URLSearchParams(window.location.search);
const course = params.get("course");
const socket = io();
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

async function loadMessages() {
    try {
        const response = await fetch(
            `/api/messages?course=${course}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.message || "Neizdevās ielādēt ziņas."
            );
        }

        messages.innerHTML = "";

        if (data.length === 0) {
            messages.innerHTML = `
                <p class="text-secondary mb-0">
                    Ziņu vēl nav.
                </p>
            `;

            return;
        }

        data.forEach((message) => {
            addMessageToChat(message);
        });

    } catch (error) {
        messageError.textContent = error.message;
        messageError.classList.remove("d-none");
    }
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
                socket.emit(
            "joinCourse",
            Number(course)
        );
        usernameError.classList.add("d-none");

        usernameDisplay.textContent = data.username;

        loginSection.classList.add("d-none");
        chatSection.classList.remove("d-none");
        await loadMessages();

        console.log("Izveidots lietotājs:", data);
        console.log("User ID:", currentUserId);

    } catch (error) {
        usernameError.textContent = error.message;
        usernameError.classList.remove("d-none");
    }
});

function addMessageToChat(message) {

    const emptyMessage = messages.querySelector(
        "p.text-secondary"
    );

    if (emptyMessage) {
        emptyMessage.remove();
    }


    const messageElement =
        document.createElement("div");

    messageElement.classList.add(
        "border-bottom",
        "pb-2",
        "mb-2"
    );

    messageElement.dataset.messageId =
        message._id;


    const messageHeader =
        document.createElement("div");

    messageHeader.classList.add(
        "d-flex",
        "justify-content-between",
        "align-items-center"
    );


    const usernameElement =
        document.createElement("strong");

    usernameElement.textContent =
        message.user.username;


    const rightSide =
        document.createElement("div");

    rightSide.classList.add(
        "d-flex",
        "align-items-center",
        "gap-2"
    );


    const timeElement =
        document.createElement("small");

    timeElement.classList.add(
        "text-secondary"
    );


    if (message.createdAt) {

        const messageDate =
            new Date(message.createdAt);

        timeElement.textContent =
            messageDate.toLocaleTimeString(
                "lv-LV",
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

    }


    rightSide.appendChild(
        timeElement
    );


    if (
        message.user._id === currentUserId
    ) {

        const deleteButton =
            document.createElement("button");

        deleteButton.type = "button";

        deleteButton.classList.add(
            "btn",
            "btn-sm",
            "btn-outline-danger"
        );

        deleteButton.textContent =
            "Dzēst";


        deleteButton.addEventListener(
            "click",
            () => {

                deleteMessage(
                    message._id
                );

            }
        );


        rightSide.appendChild(
            deleteButton
        );

    }


    messageHeader.appendChild(
        usernameElement
    );

    messageHeader.appendChild(
        rightSide
    );


    const textElement =
        document.createElement("p");

    textElement.classList.add(
        "mb-0"
    );

    textElement.textContent =
        message.text;


    messageElement.appendChild(
        messageHeader
    );

    messageElement.appendChild(
        textElement
    );


    messages.appendChild(
        messageElement
    );
}

async function deleteMessage(messageId) {

    try {

        const response = await fetch(
            `/api/messages/${messageId}`,
            {
                method: "DELETE",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    userId: currentUserId
                })
            }
        );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Neizdevās izdzēst ziņu."
            );

        }


        messageError.classList.add(
            "d-none"
        );

    } catch (error) {

        messageError.textContent =
            error.message;

        messageError.classList.remove(
            "d-none"
        );

    }

}

socket.on(
    "newMessage",
    (message) => {

        addMessageToChat(message);

    }
);

socket.on(
    "messageDeleted",
    (messageId) => {

        const messageElement =
            messages.querySelector(
                `[data-message-id="${messageId}"]`
            );


        if (messageElement) {

            messageElement.remove();

        }


        if (messages.children.length === 0) {

            messages.innerHTML = `
                <p class="text-secondary mb-0">
                    Ziņu vēl nav.
                </p>
            `;

        }

    }
);

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