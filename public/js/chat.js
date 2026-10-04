const params =
    new URLSearchParams(
        window.location.search
    );


const course =
    params.get("course");


const socket =
    io();


const courseTitle =
    document.getElementById(
        "courseTitle"
    );


const chatTitle =
    document.getElementById(
        "chatTitle"
    );


const usernameInput =
    document.getElementById(
        "usernameInput"
    );


const joinButton =
    document.getElementById(
        "joinButton"
    );


const usernameError =
    document.getElementById(
        "usernameError"
    );


const loginSection =
    document.getElementById(
        "loginSection"
    );


const chatSection =
    document.getElementById(
        "chatSection"
    );


const usernameDisplay =
    document.getElementById(
        "usernameDisplay"
    );


const messages =
    document.getElementById(
        "messages"
    );


const messageInput =
    document.getElementById(
        "messageInput"
    );


const sendButton =
    document.getElementById(
        "sendButton"
    );


const messageError =
    document.getElementById(
        "messageError"
    );


const onlineUsers =
    document.getElementById(
        "onlineUsers"
    );


const onlineUsersCount =
    document.getElementById(
        "onlineUsersCount"
    );


let currentUserId = null;
let currentUsername = null;


// ==========================================
// KURSA NOSAUKUMS
// ==========================================

if (course) {

    courseTitle.textContent =
        `${course}. kursa čats`;

    chatTitle.textContent =
        `${course}. kursa čats`;

}


// ==========================================
// PIEVIENOŠANĀS SOCKET.IO ISTABAI
// ==========================================

function joinSocketCourse() {

    if (
        !currentUserId ||
        !currentUsername
    ) {

        return;

    }


    socket.emit(
        "joinCourse",
        {
            courseNumber:
                Number(course),

            userId:
                currentUserId,

            username:
                currentUsername
        }
    );

}


// Ja serveris restartējas,
// Socket.IO automātiski pieslēgsies atkārtoti

socket.on(
    "connect",
    () => {

        joinSocketCourse();

    }
);


// ==========================================
// IELĀDĒT ZIŅAS
// ==========================================

async function loadMessages() {

    try {

        const response =
            await fetch(
                `/api/messages?course=${course}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Neizdevās ielādēt ziņas."
            );

        }


        messages.innerHTML = "";


        if (data.length === 0) {

            messages.innerHTML = `
                <p
                    id="emptyMessages"
                    class="text-secondary mb-0"
                >
                    Ziņu vēl nav.
                </p>
            `;

            return;

        }


        data.forEach(
            (message) => {

                addMessageToChat(
                    message
                );

            }
        );

    } catch (error) {

        messageError.textContent =
            error.message;

        messageError.classList.remove(
            "d-none"
        );

    }

}


// ==========================================
// PIEVIENOTIES ČATAM
// ==========================================

joinButton.addEventListener(
    "click",
    async () => {

        const username =
            usernameInput.value.trim();


        if (username === "") {

            usernameError.textContent =
                "Lūdzu, ievadi savu vārdu!";

            usernameError.classList.remove(
                "d-none"
            );

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/users",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                username:
                                    username,

                                courseNumber:
                                    Number(course)
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Neizdevās pievienot lietotāju."
                );

            }


            currentUserId =
                data._id;


            currentUsername =
                data.username;


            usernameError.classList.add(
                "d-none"
            );


            usernameDisplay.textContent =
                data.username;


            loginSection.classList.add(
                "d-none"
            );


            chatSection.classList.remove(
                "d-none"
            );


            joinSocketCourse();


            await loadMessages();


            messageInput.focus();

        } catch (error) {

            usernameError.textContent =
                error.message;

            usernameError.classList.remove(
                "d-none"
            );

        }

    }
);


// ==========================================
// PARĀDĪT ZIŅU
// ==========================================

function addMessageToChat(message) {

    const emptyMessage =
        document.getElementById(
            "emptyMessages"
        );


    if (emptyMessage) {

        emptyMessage.remove();

    }


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.classList.add(
        "border-bottom",
        "pb-2",
        "mb-2"
    );


    messageElement.dataset.messageId =
        message._id;


    messageElement.dataset.messageText =
        message.text;


    const messageHeader =
        document.createElement(
            "div"
        );


    messageHeader.classList.add(
        "d-flex",
        "justify-content-between",
        "align-items-center",
        "gap-2"
    );


    const usernameElement =
        document.createElement(
            "strong"
        );


    usernameElement.textContent =
        message.user.username;


    const rightSide =
        document.createElement(
            "div"
        );


    rightSide.classList.add(
        "d-flex",
        "align-items-center",
        "gap-2"
    );


    const timeElement =
        document.createElement(
            "small"
        );


    timeElement.classList.add(
        "text-secondary"
    );


    if (message.createdAt) {

        const messageDate =
            new Date(
                message.createdAt
            );


        timeElement.textContent =
            messageDate.toLocaleTimeString(
                "lv-LV",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );

    }


    rightSide.appendChild(
        timeElement
    );


    // ======================================
    // SAVAS ZIŅAS POGAS
    // ======================================

    if (
        message.user &&
        String(message.user._id) ===
        String(currentUserId)
    ) {

        const editButton =
            document.createElement(
                "button"
            );


        editButton.type =
            "button";


        editButton.classList.add(
            "btn",
            "btn-sm",
            "btn-outline-primary"
        );


        editButton.textContent =
            "Rediģēt";


        editButton.addEventListener(
            "click",
            () => {

                editMessage(
                    message._id,
                    messageElement
                        .dataset
                        .messageText
                );

            }
        );


        rightSide.appendChild(
            editButton
        );


        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";


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
        document.createElement(
            "p"
        );


    textElement.classList.add(
        "mb-0",
        "message-text"
    );


    textElement.textContent =
        message.text;


    if (
        message.createdAt &&
        message.updatedAt &&
        new Date(message.updatedAt).getTime() >
        new Date(message.createdAt).getTime()
    ) {

        addEditedLabel(
            textElement
        );

    }


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


// ==========================================
// REDIĢĒTS UZRAKSTS
// ==========================================

function addEditedLabel(
    textElement
) {

    const oldLabel =
        textElement.querySelector(
            ".edited-label"
        );


    if (oldLabel) {

        oldLabel.remove();

    }


    const editedElement =
        document.createElement(
            "small"
        );


    editedElement.classList.add(
        "text-secondary",
        "ms-2",
        "edited-label"
    );


    editedElement.textContent =
        "(rediģēts)";


    textElement.appendChild(
        editedElement
    );

}


// ==========================================
// REDIĢĒT ZIŅU
// ==========================================

async function editMessage(
    messageId,
    oldText
) {

    const newText =
        prompt(
            "Rediģē ziņu:",
            oldText
        );


    if (newText === null) {

        return;

    }


    const trimmedText =
        newText.trim();


    if (trimmedText === "") {

        messageError.textContent =
            "Ziņa nevar būt tukša.";

        messageError.classList.remove(
            "d-none"
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/api/messages/${messageId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            text:
                                trimmedText,

                            userId:
                                currentUserId
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Neizdevās rediģēt ziņu."
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


// ==========================================
// DZĒST ZIŅU
// ==========================================

async function deleteMessage(
    messageId
) {

    try {

        const response =
            await fetch(
                `/api/messages/${messageId}`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            userId:
                                currentUserId
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


// ==========================================
// JAUNA ZIŅA REAL-TIME
// ==========================================

socket.on(
    "newMessage",
    (message) => {

        addMessageToChat(
            message
        );

    }
);


// ==========================================
// REDIĢĒTA ZIŅA REAL-TIME
// ==========================================

socket.on(
    "messageUpdated",
    (message) => {

        const messageElement =
            messages.querySelector(
                `[data-message-id="${message._id}"]`
            );


        if (!messageElement) {

            return;

        }


        messageElement
            .dataset
            .messageText =
            message.text;


        const textElement =
            messageElement.querySelector(
                ".message-text"
            );


        if (!textElement) {

            return;

        }


        textElement.textContent =
            message.text;


        addEditedLabel(
            textElement
        );

    }
);


// ==========================================
// DZĒSTA ZIŅA REAL-TIME
// ==========================================

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


        if (
            messages.children.length === 0
        ) {

            messages.innerHTML = `
                <p
                    id="emptyMessages"
                    class="text-secondary mb-0"
                >
                    Ziņu vēl nav.
                </p>
            `;

        }

    }
);


// ==========================================
// TIEŠSAISTES LIETOTĀJI REAL-TIME
// ==========================================

socket.on(
    "onlineUsers",
    (users) => {

        onlineUsersCount.textContent =
            users.length;


        onlineUsers.innerHTML =
            "";


        if (users.length === 0) {

            onlineUsers.innerHTML = `
                <div
                    class="list-group-item text-secondary"
                >
                    Neviens nav tiešsaistē.
                </div>
            `;

            return;

        }


        users.forEach(
            (user) => {

                const userElement =
                    document.createElement(
                        "div"
                    );


                userElement.classList.add(
                    "list-group-item",
                    "d-flex",
                    "align-items-center",
                    "gap-2"
                );


                const statusBadge =
                    document.createElement(
                        "span"
                    );


                statusBadge.classList.add(
                    "badge",
                    "rounded-pill",
                    "text-bg-success"
                );


                statusBadge.textContent =
                    "●";


                const nameElement =
                    document.createElement(
                        "span"
                    );


                nameElement.textContent =
                    user.username;


                if (
                    String(user.userId) ===
                    String(currentUserId)
                ) {

                    const youBadge =
                        document.createElement(
                            "span"
                        );


                    youBadge.classList.add(
                        "badge",
                        "text-bg-primary",
                        "ms-auto"
                    );


                    youBadge.textContent =
                        "Tu";


                    userElement.appendChild(
                        statusBadge
                    );


                    userElement.appendChild(
                        nameElement
                    );


                    userElement.appendChild(
                        youBadge
                    );

                } else {

                    userElement.appendChild(
                        statusBadge
                    );


                    userElement.appendChild(
                        nameElement
                    );

                }


                onlineUsers.appendChild(
                    userElement
                );

            }
        );

    }
);


// ==========================================
// NOSŪTĪT ZIŅU
// ==========================================

sendButton.addEventListener(
    "click",
    async () => {

        const messageText =
            messageInput.value.trim();


        if (messageText === "") {

            messageError.textContent =
                "Lūdzu, ievadi ziņu!";

            messageError.classList.remove(
                "d-none"
            );

            return;

        }


        if (!currentUserId) {

            messageError.textContent =
                "Lietotājs nav pievienojies čatam.";

            messageError.classList.remove(
                "d-none"
            );

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/messages",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                text:
                                    messageText,

                                userId:
                                    currentUserId,

                                courseNumber:
                                    Number(course)
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Neizdevās nosūtīt ziņu."
                );

            }


            messageError.classList.add(
                "d-none"
            );


            messageInput.value =
                "";


            messageInput.focus();

        } catch (error) {

            messageError.textContent =
                error.message;

            messageError.classList.remove(
                "d-none"
            );

        }

    }
);


// ==========================================
// ENTER = NOSŪTĪT
// ==========================================

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (event.key === "Enter") {

            sendButton.click();

        }

    }
);