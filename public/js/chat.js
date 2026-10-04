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


const replyPreview =
    document.getElementById(
        "replyPreview"
    );


const replyUsername =
    document.getElementById(
        "replyUsername"
    );


const replyText =
    document.getElementById(
        "replyText"
    );


const cancelReplyButton =
    document.getElementById(
        "cancelReplyButton"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const clearSearchButton =
    document.getElementById(
        "clearSearchButton"
    );


const searchEmpty =
    document.getElementById(
        "searchEmpty"
    );


let currentUserId = null;
let currentUsername = null;
let currentReplyTo = null;


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
// SOCKET.IO ISTABA
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


        messages.innerHTML =
            "";


        if (data.length === 0) {

            messages.innerHTML = `
                <p
                    id="emptyMessages"
                    class="text-secondary mb-0"
                >
                    Ziņu vēl nav.
                </p>
            `;

            searchEmpty.classList.add(
                "d-none"
            );

            return;

        }


        data.forEach(
            (message) => {

                addMessageToChat(
                    message
                );

            }
        );


        applyMessageSearch();

    } catch (error) {

        showMessageError(
            error.message
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
                        method:
                            "POST",

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


            usernameDisplay.textContent =
                data.username;


            usernameError.classList.add(
                "d-none"
            );


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
        "chat-message",
        "border-bottom",
        "pb-3",
        "mb-3"
    );


    messageElement.dataset.messageId =
        message._id;


    messageElement.dataset.messageText =
        message.text;


    messageElement.dataset.username =
        message.user?.username || "";


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
        message.user?.username ||
        "Nezināms lietotājs";


    const rightSide =
        document.createElement(
            "div"
        );


    rightSide.classList.add(
        "d-flex",
        "align-items-center",
        "gap-2",
        "flex-wrap"
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
    // ATBILDĒT
    // ======================================

    const replyButton =
        document.createElement(
            "button"
        );


    replyButton.type =
        "button";


    replyButton.classList.add(
        "btn",
        "btn-sm",
        "btn-outline-secondary"
    );


    replyButton.textContent =
        "Atbildēt";


    replyButton.addEventListener(
        "click",
        () => {

            startReply(
                message
            );

        }
    );


    rightSide.appendChild(
        replyButton
    );


    // ======================================
    // SAVAS ZIŅAS
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


    messageElement.appendChild(
        messageHeader
    );


    // ======================================
    // ATBILDE UZ CITU ZIŅU
    // ======================================

    if (message.replyTo) {

        const replyElement =
            document.createElement(
                "div"
            );


        replyElement.classList.add(
            "border-start",
            "border-3",
            "ps-2",
            "my-2",
            "text-secondary"
        );


        const replyUser =
            document.createElement(
                "small"
            );


        replyUser.classList.add(
            "fw-bold",
            "d-block"
        );


        replyUser.textContent =
            message.replyTo.user?.username ||
            "Nezināms lietotājs";


        const replyMessageText =
            document.createElement(
                "small"
            );


        replyMessageText.textContent =
            message.replyTo.text ||
            "Ziņa nav pieejama";


        replyElement.appendChild(
            replyUser
        );


        replyElement.appendChild(
            replyMessageText
        );


        messageElement.appendChild(
            replyElement
        );

    }


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
        new Date(
            message.updatedAt
        ).getTime() >
        new Date(
            message.createdAt
        ).getTime()
    ) {

        addEditedLabel(
            textElement
        );

    }


    messageElement.appendChild(
        textElement
    );


    messages.appendChild(
        messageElement
    );

}


// ==========================================
// MEKLĒT ZIŅAS
// ==========================================

function applyMessageSearch() {

    const searchValue =
        searchInput.value
            .trim()
            .toLowerCase();


    const messageElements =
        messages.querySelectorAll(
            ".chat-message"
        );


    let visibleMessages = 0;


    messageElements.forEach(
        (messageElement) => {

            const messageText =
                messageElement
                    .dataset
                    .messageText
                    .toLowerCase();


            const username =
                messageElement
                    .dataset
                    .username
                    .toLowerCase();


            const matches =
                messageText.includes(
                    searchValue
                ) ||
                username.includes(
                    searchValue
                );


            if (matches) {

                messageElement.classList.remove(
                    "d-none"
                );

                visibleMessages++;

            } else {

                messageElement.classList.add(
                    "d-none"
                );

            }

        }
    );


    if (
        searchValue !== "" &&
        messageElements.length > 0 &&
        visibleMessages === 0
    ) {

        searchEmpty.classList.remove(
            "d-none"
        );

    } else {

        searchEmpty.classList.add(
            "d-none"
        );

    }

}


searchInput.addEventListener(
    "input",
    () => {

        applyMessageSearch();

    }
);


clearSearchButton.addEventListener(
    "click",
    () => {

        searchInput.value =
            "";


        applyMessageSearch();


        searchInput.focus();

    }
);


// ==========================================
// SĀKT ATBILDI
// ==========================================

function startReply(message) {

    currentReplyTo = {
        id:
            message._id,

        username:
            message.user?.username ||
            "Nezināms lietotājs",

        text:
            message.text
    };


    replyUsername.textContent =
        currentReplyTo.username;


    replyText.textContent =
        currentReplyTo.text;


    replyPreview.classList.remove(
        "d-none"
    );


    messageInput.focus();

}


// ==========================================
// ATCELT ATBILDI
// ==========================================

function cancelReply() {

    currentReplyTo =
        null;


    replyUsername.textContent =
        "";


    replyText.textContent =
        "";


    replyPreview.classList.add(
        "d-none"
    );

}


cancelReplyButton.addEventListener(
    "click",
    cancelReply
);


// ==========================================
// REDIĢĒTS
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

        showMessageError(
            "Ziņa nevar būt tukša."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `/api/messages/${messageId}`,
                {
                    method:
                        "PUT",

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


        hideMessageError();

    } catch (error) {

        showMessageError(
            error.message
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
                    method:
                        "DELETE",

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


        hideMessageError();

    } catch (error) {

        showMessageError(
            error.message
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


        applyMessageSearch();

    }
);


// ==========================================
// REDIĢĒŠANA REAL-TIME
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


        applyMessageSearch();

    }
);


// ==========================================
// DZĒŠANA REAL-TIME
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
            currentReplyTo &&
            currentReplyTo.id ===
            messageId
        ) {

            cancelReply();

        }


        const remainingMessages =
            messages.querySelectorAll(
                ".chat-message"
            );


        if (
            remainingMessages.length === 0
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


        applyMessageSearch();

    }
);


// ==========================================
// TIEŠSAISTES LIETOTĀJI
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


                userElement.appendChild(
                    statusBadge
                );


                userElement.appendChild(
                    nameElement
                );


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
                        youBadge
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

            showMessageError(
                "Lūdzu, ievadi ziņu!"
            );

            return;

        }


        if (!currentUserId) {

            showMessageError(
                "Lietotājs nav pievienojies čatam."
            );

            return;

        }


        try {

            const response =
                await fetch(
                    "/api/messages",
                    {
                        method:
                            "POST",

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
                                    Number(course),

                                replyToId:
                                    currentReplyTo
                                        ? currentReplyTo.id
                                        : null
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


            messageInput.value =
                "";


            cancelReply();

            hideMessageError();

            messageInput.focus();

        } catch (error) {

            showMessageError(
                error.message
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

        if (
            event.key === "Enter"
        ) {

            sendButton.click();

        }

    }
);


// ==========================================
// KĻŪDAS
// ==========================================

function showMessageError(
    message
) {

    messageError.textContent =
        message;


    messageError.classList.remove(
        "d-none"
    );

}


function hideMessageError() {

    messageError.classList.add(
        "d-none"
    );

}