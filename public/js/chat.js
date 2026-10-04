const socket = io({
    autoConnect: false
});


const loadingMessage =
    document.getElementById(
        "loadingMessage"
    );

const chatSection =
    document.getElementById(
        "chatSection"
    );

const chatTitle =
    document.getElementById(
        "chatTitle"
    );

const courseName =
    document.getElementById(
        "courseName"
    );

const usernameDisplay =
    document.getElementById(
        "usernameDisplay"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
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

const typingIndicator =
    document.getElementById(
        "typingIndicator"
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
let currentCourseNumber = null;
let currentReplyTo = null;

let typingTimer = null;
let isTyping = false;


const reactionTypes = [
    "👍",
    "❤️",
    "😂",
    "😍",
    "😮",
    "😢",
    "😡",
    "🔥",
    "🎉",
    "👏",
    "🤔",
    "😎"
];


// ==========================================
// INITIALIZE CHAT
// ==========================================

async function initializeChat() {
    try {
        const response =
            await fetch(
                "/api/auth/me"
            );

        const data =
            await response.json();


        if (
            !response.ok ||
            !data.authenticated
        ) {
            window.location.href =
                "/";

            return;
        }


        currentUserId =
            String(
                data.user._id
            );

        currentUsername =
            data.user.username;

        currentCourseNumber =
            Number(
                data.user.courseNumber
            );


        usernameDisplay.textContent =
            currentUsername;


        chatTitle.textContent =
            `${currentCourseNumber}. kursa čats`;


        courseName.textContent =
            data.user.courseName ||
            `${currentCourseNumber}. kurss`;


        loadingMessage.classList.add(
            "d-none"
        );


        chatSection.classList.remove(
            "d-none"
        );


        socket.connect();


        await loadMessages();


        messageInput.focus();

    } catch (error) {
        loadingMessage.classList.remove(
            "alert-light"
        );

        loadingMessage.classList.add(
            "alert-danger"
        );

        loadingMessage.textContent =
            "Neizdevās ielādēt čatu.";

        console.error(error);
    }
}


// ==========================================
// SOCKET ROOM
// ==========================================

function joinSocketCourse() {
    if (!currentUserId) {
        return;
    }

    socket.emit(
        "joinCourse"
    );
}


socket.on(
    "connect",
    () => {
        isTyping = false;

        joinSocketCourse();
    }
);


socket.on(
    "disconnect",
    () => {
        isTyping = false;

        clearTimeout(
            typingTimer
        );
    }
);


socket.on(
    "connect_error",
    () => {
        showMessageError(
            "Neizdevās izveidot reāllaika savienojumu."
        );
    }
);


// ==========================================
// TYPING
// ==========================================

function startTyping() {
    if (
        !currentUserId ||
        !socket.connected
    ) {
        return;
    }


    if (!isTyping) {
        socket.emit(
            "typingStart"
        );

        isTyping = true;
    }


    clearTimeout(
        typingTimer
    );


    typingTimer =
        setTimeout(
            stopTyping,
            1200
        );
}


function stopTyping() {
    clearTimeout(
        typingTimer
    );


    if (
        isTyping &&
        socket.connected
    ) {
        socket.emit(
            "typingStop"
        );
    }


    isTyping = false;
}


messageInput.addEventListener(
    "input",
    () => {
        if (
            messageInput.value
                .trim() === ""
        ) {
            stopTyping();
            return;
        }


        startTyping();
    }
);


messageInput.addEventListener(
    "blur",
    () => {
        stopTyping();
    }
);


// ==========================================
// TYPING USERS REAL-TIME
// ==========================================

socket.on(
    "typingUsers",
    (users) => {

        const otherUsers =
            users.filter(
                (user) =>
                    String(user.userId) !==
                    String(currentUserId)
            );


        if (
            otherUsers.length === 0
        ) {
            typingIndicator.textContent =
                "";

            typingIndicator.classList.add(
                "d-none"
            );

            return;
        }


        if (
            otherUsers.length === 1
        ) {
            typingIndicator.textContent =
                `${otherUsers[0].username} raksta...`;
        }

        else if (
            otherUsers.length === 2
        ) {
            typingIndicator.textContent =
                `${otherUsers[0].username} un ${otherUsers[1].username} raksta...`;
        }

        else {
            typingIndicator.textContent =
                `${otherUsers[0].username}, ${otherUsers[1].username} un vēl ${otherUsers.length - 2} raksta...`;
        }


        typingIndicator.classList.remove(
            "d-none"
        );
    }
);


// ==========================================
// LOAD MESSAGES
// ==========================================

async function loadMessages() {
    try {
        const response =
            await fetch(
                "/api/messages"
            );

        const data =
            await response.json();


        if (
            response.status === 401
        ) {
            window.location.href =
                "/";

            return;
        }


        if (!response.ok) {
            throw new Error(
                data.message ||
                "Neizdevās ielādēt ziņas."
            );
        }


        messages.innerHTML = "";


        if (
            data.length === 0
        ) {
            showEmptyMessages();
            return;
        }


        data.forEach(
            addMessageToChat
        );


        applyMessageSearch();

        scrollMessagesToBottom();

    } catch (error) {
        showMessageError(
            error.message
        );
    }
}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessageToChat(message) {

    if (
        messages.querySelector(
            `[data-message-id="${message._id}"]`
        )
    ) {
        return;
    }


    document
        .getElementById(
            "emptyMessages"
        )
        ?.remove();


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


    // ======================================
    // DOUBLE CLICK = 👍
    // ======================================

    messageElement.addEventListener(
        "dblclick",
        (event) => {

            if (
                event.target.closest(
                    "button, a, input"
                )
            ) {
                return;
            }


            toggleReaction(
                message._id,
                "👍"
            );
        }
    );


    // ======================================
    // HEADER
    // ======================================

    const messageHeader =
        document.createElement(
            "div"
        );


    messageHeader.classList.add(
        "d-flex",
        "justify-content-between",
        "align-items-center",
        "gap-2",
        "flex-wrap"
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


    // ======================================
    // TIME
    // ======================================

    const timeElement =
        document.createElement(
            "small"
        );


    timeElement.classList.add(
        "text-secondary"
    );


    if (message.createdAt) {
        timeElement.textContent =
            new Date(
                message.createdAt
            )
                .toLocaleTimeString(
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
    // REACTION MENU
    // ======================================

    rightSide.appendChild(
        createReactionMenu(
            message._id
        )
    );


    // ======================================
    // REPLY
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
                message._id,
                messageElement
                    .dataset
                    .username,
                messageElement
                    .dataset
                    .messageText
            );
        }
    );


    rightSide.appendChild(
        replyButton
    );


    // ======================================
    // OWN MESSAGE
    // ======================================

    if (
        message.user &&
        String(
            message.user._id
        ) ===
        String(
            currentUserId
        )
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
    // REPLY MESSAGE
    // ======================================

    if (message.replyTo) {

        const replyElement =
            document.createElement(
                "div"
            );


        replyElement.classList.add(
            "reply-message",
            "border-start",
            "border-3",
            "ps-2",
            "my-2",
            "text-secondary"
        );


        replyElement.dataset.replyToId =
            message.replyTo._id;


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


        replyMessageText.classList.add(
            "reply-message-text"
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


    // ======================================
    // MESSAGE TEXT
    // ======================================

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


    if (message.editedAt) {
        addEditedLabel(
            textElement
        );
    }


    messageElement.appendChild(
        textElement
    );


    // ======================================
    // REACTIONS
    // ======================================

    const reactionsContainer =
        document.createElement(
            "div"
        );


    reactionsContainer.classList.add(
        "reactions-container",
        "d-flex",
        "gap-2",
        "flex-wrap",
        "mt-2"
    );


    messageElement.appendChild(
        reactionsContainer
    );


    messages.appendChild(
        messageElement
    );


    renderReactions(
        messageElement,
        message.reactions || []
    );
}


// ==========================================
// REACTION MENU
// ==========================================

function createReactionMenu(messageId) {

    const dropdown =
        document.createElement(
            "div"
        );


    dropdown.classList.add(
        "dropdown"
    );


    const menuButton =
        document.createElement(
            "button"
        );


    menuButton.type =
        "button";


    menuButton.classList.add(
        "btn",
        "btn-sm",
        "btn-outline-secondary",
        "dropdown-toggle"
    );


    menuButton.setAttribute(
        "data-bs-toggle",
        "dropdown"
    );


    menuButton.setAttribute(
        "aria-expanded",
        "false"
    );


    menuButton.textContent =
        "😊";


    const menu =
        document.createElement(
            "div"
        );


    menu.classList.add(
        "dropdown-menu",
        "p-2"
    );


    const row =
        document.createElement(
            "div"
        );


    row.classList.add(
        "row",
        "row-cols-4",
        "g-1"
    );


    reactionTypes.forEach(
        (reaction) => {

            const column =
                document.createElement(
                    "div"
                );


            column.classList.add(
                "col"
            );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.classList.add(
                "btn",
                "btn-light",
                "w-100"
            );


            button.textContent =
                reaction;


            button.addEventListener(
                "click",
                () => {
                    toggleReaction(
                        messageId,
                        reaction
                    );
                }
            );


            column.appendChild(
                button
            );


            row.appendChild(
                column
            );
        }
    );


    menu.appendChild(
        row
    );


    dropdown.appendChild(
        menuButton
    );


    dropdown.appendChild(
        menu
    );


    return dropdown;
}


// ==========================================
// RENDER REACTIONS
// ==========================================

function renderReactions(
    messageElement,
    reactions
) {

    const container =
        messageElement.querySelector(
            ".reactions-container"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    reactionTypes.forEach(
        (reactionType) => {

            const reactionUsers =
                reactions
                    .filter(
                        (reaction) =>
                            reaction.type ===
                            reactionType
                    )
                    .map(
                        (reaction) => {

                            if (
                                typeof reaction.user ===
                                    "object" &&
                                reaction.user !==
                                    null
                            ) {
                                return String(
                                    reaction.user._id
                                );
                            }


                            return String(
                                reaction.user
                            );
                        }
                    );


            if (
                reactionUsers.length ===
                0
            ) {
                return;
            }


            const currentUserReacted =
                reactionUsers.includes(
                    String(
                        currentUserId
                    )
                );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.classList.add(
                "btn",
                "btn-sm"
            );


            button.classList.add(
                currentUserReacted
                    ? "btn-primary"
                    : "btn-outline-secondary"
            );


            button.textContent =
                `${reactionType} ${reactionUsers.length}`;


            button.addEventListener(
                "click",
                () => {
                    toggleReaction(
                        messageElement
                            .dataset
                            .messageId,
                        reactionType
                    );
                }
            );


            container.appendChild(
                button
            );
        }
    );
}


// ==========================================
// TOGGLE REACTION
// ==========================================

async function toggleReaction(
    messageId,
    reaction
) {
    try {
        const response =
            await fetch(
                `/api/messages/${messageId}/reaction`,
                {
                    method:
                        "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            reaction:
                                reaction
                        })
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {
            window.location.href =
                "/";

            return;
        }


        if (!response.ok) {
            throw new Error(
                data.message ||
                "Neizdevās saglabāt reakciju."
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
// SEARCH
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


    let visibleMessages =
        0;


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


            messageElement.classList.toggle(
                "d-none",
                !matches
            );


            if (matches) {
                visibleMessages++;
            }
        }
    );


    searchEmpty.classList.toggle(
        "d-none",

        searchValue === "" ||
        messageElements.length === 0 ||
        visibleMessages > 0
    );
}


searchInput.addEventListener(
    "input",
    applyMessageSearch
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
// REPLY
// ==========================================

function startReply(
    messageId,
    username,
    text
) {
    currentReplyTo = {
        id:
            messageId,

        username:
            username,

        text:
            text
    };


    replyUsername.textContent =
        username;


    replyText.textContent =
        text;


    replyPreview.classList.remove(
        "d-none"
    );


    messageInput.focus();
}


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
// EDITED LABEL
// ==========================================

function addEditedLabel(
    textElement
) {
    textElement
        .querySelector(
            ".edited-label"
        )
        ?.remove();


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
// EDIT MESSAGE
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


    if (
        newText === null
    ) {
        return;
    }


    const trimmedText =
        newText.trim();


    if (!trimmedText) {
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
                                trimmedText
                        })
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {
            window.location.href =
                "/";

            return;
        }


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
// DELETE MESSAGE
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
                        "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {
            window.location.href =
                "/";

            return;
        }


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
// NEW MESSAGE REAL-TIME
// ==========================================

socket.on(
    "newMessage",
    (message) => {

        addMessageToChat(
            message
        );


        applyMessageSearch();

        scrollMessagesToBottom();
    }
);


// ==========================================
// EDIT REAL-TIME
// ==========================================

socket.on(
    "messageUpdated",
    (message) => {

        const messageElement =
            messages.querySelector(
                `[data-message-id="${message._id}"]`
            );


        if (messageElement) {

            messageElement
                .dataset
                .messageText =
                    message.text;


            const textElement =
                messageElement.querySelector(
                    ".message-text"
                );


            if (textElement) {
                textElement.textContent =
                    message.text;

                addEditedLabel(
                    textElement
                );
            }
        }


        messages
            .querySelectorAll(
                `[data-reply-to-id="${message._id}"] .reply-message-text`
            )
            .forEach(
                (element) => {
                    element.textContent =
                        message.text;
                }
            );


        if (
            currentReplyTo?.id ===
            String(message._id)
        ) {
            currentReplyTo.text =
                message.text;

            replyText.textContent =
                message.text;
        }


        applyMessageSearch();
    }
);


// ==========================================
// REACTION REAL-TIME
// ==========================================

socket.on(
    "messageReactionUpdated",
    (data) => {

        const messageElement =
            messages.querySelector(
                `[data-message-id="${data.messageId}"]`
            );


        if (messageElement) {
            renderReactions(
                messageElement,
                data.reactions || []
            );
        }
    }
);


// ==========================================
// DELETE REAL-TIME
// ==========================================

socket.on(
    "messageDeleted",
    (messageId) => {

        messages
            .querySelector(
                `[data-message-id="${messageId}"]`
            )
            ?.remove();


        messages
            .querySelectorAll(
                `[data-reply-to-id="${messageId}"] .reply-message-text`
            )
            .forEach(
                (element) => {
                    element.textContent =
                        "Ziņa izdzēsta";
                }
            );


        if (
            currentReplyTo?.id ===
            String(messageId)
        ) {
            cancelReply();
        }


        if (
            messages
                .querySelectorAll(
                    ".chat-message"
                )
                .length ===
            0
        ) {
            showEmptyMessages();
        }


        applyMessageSearch();
    }
);


// ==========================================
// ONLINE USERS
// ==========================================

socket.on(
    "onlineUsers",
    (users) => {

        onlineUsersCount.textContent =
            users.length;


        onlineUsers.innerHTML =
            "";


        if (
            users.length === 0
        ) {
            onlineUsers.innerHTML = `
                <div class="list-group-item text-secondary">
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


                const status =
                    document.createElement(
                        "span"
                    );


                status.classList.add(
                    "text-success"
                );


                status.textContent =
                    "●";


                const name =
                    document.createElement(
                        "span"
                    );


                name.textContent =
                    user.username;


                userElement.appendChild(
                    status
                );


                userElement.appendChild(
                    name
                );


                if (
                    String(
                        user.userId
                    ) ===
                    String(
                        currentUserId
                    )
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
// SEND MESSAGE
// ==========================================

sendButton.addEventListener(
    "click",
    sendMessage
);


async function sendMessage() {

    const text =
        messageInput.value.trim();


    if (!text) {
        stopTyping();

        showMessageError(
            "Lūdzu, ievadi ziņu!"
        );

        return;
    }


    stopTyping();


    try {
        sendButton.disabled =
            true;


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
                                text,

                            replyToId:
                                currentReplyTo?.id ||
                                null
                        })
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401
        ) {
            window.location.href =
                "/";

            return;
        }


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

    } finally {
        sendButton.disabled =
            false;
    }
}


// ==========================================
// ENTER = SEND
// ==========================================

messageInput.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            sendMessage();
        }
    }
);


// ==========================================
// LOGOUT
// ==========================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {
            stopTyping();


            logoutButton.disabled =
                true;


            const response =
                await fetch(
                    "/api/auth/logout",
                    {
                        method:
                            "POST"
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {
                throw new Error(
                    data.message ||
                    "Neizdevās izrakstīties."
                );
            }


            socket.disconnect();


            window.location.href =
                "/";

        } catch (error) {
            showMessageError(
                error.message
            );


            logoutButton.disabled =
                false;
        }
    }
);


// ==========================================
// HELPERS
// ==========================================

function showEmptyMessages() {
    messages.innerHTML = `
        <p
            id="emptyMessages"
            class="text-secondary mb-0"
        >
            Ziņu vēl nav.
        </p>
    `;
}


function scrollMessagesToBottom() {
    messages.scrollTop =
        messages.scrollHeight;
}


function showMessageError(message) {
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


// ==========================================
// START
// ==========================================

initializeChat();