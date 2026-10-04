const socket = io({
    autoConnect: false
});


// ==========================================
// ELEMENTS
// ==========================================

const loadingMessage =
    document.getElementById("loadingMessage");

const chatSection =
    document.getElementById("chatSection");

const chatTitle =
    document.getElementById("chatTitle");

const courseName =
    document.getElementById("courseName");

const usernameDisplay =
    document.getElementById("usernameDisplay");

const logoutButton =
    document.getElementById("logoutButton");

const messages =
    document.getElementById("messages");

const messageInput =
    document.getElementById("messageInput");

const sendButton =
    document.getElementById("sendButton");

const messageError =
    document.getElementById("messageError");

const courseUsers =
    document.getElementById("courseUsers");

const onlineUsersCount =
    document.getElementById("onlineUsersCount");

const typingIndicator =
    document.getElementById("typingIndicator");

const unreadIndicator =
    document.getElementById("unreadIndicator");

const unreadCount =
    document.getElementById("unreadCount");

const replyPreview =
    document.getElementById("replyPreview");

const replyUsername =
    document.getElementById("replyUsername");

const replyText =
    document.getElementById("replyText");

const cancelReplyButton =
    document.getElementById("cancelReplyButton");

const searchInput =
    document.getElementById("searchInput");

const clearSearchButton =
    document.getElementById("clearSearchButton");

const searchEmpty =
    document.getElementById("searchEmpty");


// PRIVATE CHAT

const privateMessageModalElement =
    document.getElementById(
        "privateMessageModal"
    );

const privateChatUsername =
    document.getElementById(
        "privateChatUsername"
    );

const privateChatStatus =
    document.getElementById(
        "privateChatStatus"
    );

const privateMessages =
    document.getElementById(
        "privateMessages"
    );

const privateMessageInput =
    document.getElementById(
        "privateMessageInput"
    );

const privateSendButton =
    document.getElementById(
        "privateSendButton"
    );

const privateMessageError =
    document.getElementById(
        "privateMessageError"
    );


const privateMessageModal =
    new bootstrap.Modal(
        privateMessageModalElement
    );


const basePageTitle =
    "Čats | Student Chat";


// ==========================================
// STATE
// ==========================================

let currentUserId = null;

let currentUsername = null;

let currentCourseNumber = null;

let currentReplyTo = null;

let typingTimer = null;

let isTyping = false;

let unreadMessageCount = 0;

let courseParticipants = [];

let onlineUserIds =
    new Set();

let currentPrivateUser =
    null;


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
// HELPERS
// ==========================================

function getEntityId(value) {
    if (!value) {
        return "";
    }

    if (
        typeof value === "object"
    ) {
        return String(
            value._id || ""
        );
    }

    return String(value);
}


// ==========================================
// INITIALIZE
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
            String(data.user._id);

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


        await Promise.all([
            loadMessages(),
            loadCourseUsers()
        ]);


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
// SOCKET
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
// COURSE PARTICIPANTS
// ==========================================

async function loadCourseUsers() {
    try {
        const response =
            await fetch(
                "/api/private-messages/users"
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
                "Neizdevās ielādēt dalībniekus."
            );
        }


        courseParticipants =
            data.map(
                (user) => ({
                    _id:
                        String(user._id),

                    username:
                        user.username
                })
            );


        renderCourseUsers();

    } catch (error) {
        courseUsers.innerHTML = `
            <div class="list-group-item text-danger">
                ${escapeText(error.message)}
            </div>
        `;
    }
}


function renderCourseUsers() {
    courseUsers.innerHTML =
        "";


    const users =
        [...courseParticipants];


    users.sort(
        (a, b) => {
            const aIsCurrent =
                a._id ===
                currentUserId;

            const bIsCurrent =
                b._id ===
                currentUserId;


            if (
                aIsCurrent &&
                !bIsCurrent
            ) {
                return -1;
            }


            if (
                bIsCurrent &&
                !aIsCurrent
            ) {
                return 1;
            }


            const aOnline =
                onlineUserIds.has(
                    a._id
                );

            const bOnline =
                onlineUserIds.has(
                    b._id
                );


            if (
                aOnline !==
                bOnline
            ) {
                return aOnline
                    ? -1
                    : 1;
            }


            return a.username.localeCompare(
                b.username,
                "lv"
            );
        }
    );


    if (
        users.length === 0
    ) {
        courseUsers.innerHTML = `
            <div class="list-group-item text-secondary">
                Dalībnieku nav.
            </div>
        `;

        return;
    }


    users.forEach(
        (user) => {
            const isCurrent =
                user._id ===
                currentUserId;

            const isOnline =
                onlineUserIds.has(
                    user._id
                );


            const item =
                document.createElement(
                    "div"
                );


            item.classList.add(
                "list-group-item",
                "d-flex",
                "align-items-center",
                "gap-2"
            );


            const dot =
                document.createElement(
                    "span"
                );


            dot.classList.add(
                "participant-status-dot"
            );


            dot.classList.add(
                isOnline
                    ? "text-success"
                    : "text-secondary"
            );


            dot.textContent =
                "●";


            const info =
                document.createElement(
                    "div"
                );


            info.classList.add(
                "participant-info",
                "flex-grow-1"
            );


            const name =
                document.createElement(
                    "div"
                );


            name.classList.add(
                "participant-name",
                "fw-semibold"
            );


            name.textContent =
                user.username;


            const state =
                document.createElement(
                    "div"
                );


            state.classList.add(
                "participant-state",
                "text-secondary"
            );


            state.textContent =
                isOnline
                    ? "Tiešsaistē"
                    : "Bezsaistē";


            info.appendChild(
                name
            );


            info.appendChild(
                state
            );


            item.appendChild(
                dot
            );


            item.appendChild(
                info
            );


            if (isCurrent) {
                const badge =
                    document.createElement(
                        "span"
                    );


                badge.classList.add(
                    "badge",
                    "text-bg-primary"
                );


                badge.textContent =
                    "Tu";


                item.appendChild(
                    badge
                );

            } else {
                const button =
                    document.createElement(
                        "button"
                    );


                button.type =
                    "button";


                button.classList.add(
                    "btn",
                    "btn-sm",
                    "btn-outline-primary"
                );


                button.textContent =
                    "Ziņa";


                button.addEventListener(
                    "click",
                    () => {
                        openPrivateChat(
                            user
                        );
                    }
                );


                item.appendChild(
                    button
                );
            }


            courseUsers.appendChild(
                item
            );
        }
    );


    onlineUsersCount.textContent =
        `${onlineUserIds.size} online`;
}


// ==========================================
// ONLINE USERS
// ==========================================

socket.on(
    "onlineUsers",
    (users) => {
        onlineUserIds =
            new Set(
                users.map(
                    (user) =>
                        String(
                            user.userId
                        )
                )
            );


        renderCourseUsers();


        updatePrivateChatStatus();
    }
);


// ==========================================
// PRIVATE CHAT
// ==========================================

async function openPrivateChat(user) {
    currentPrivateUser =
        user;


    privateChatUsername.textContent =
        `Privāta sarakste ar ${user.username}`;


    updatePrivateChatStatus();


    privateMessages.innerHTML = `
        <div class="text-secondary text-center my-4">
            Ielādē saraksti...
        </div>
    `;


    hidePrivateMessageError();


    privateMessageModal.show();


    await loadPrivateMessages(
        user._id
    );
}


function updatePrivateChatStatus() {
    if (!currentPrivateUser) {
        return;
    }


    const isOnline =
        onlineUserIds.has(
            currentPrivateUser._id
        );


    privateChatStatus.textContent =
        isOnline
            ? "Tiešsaistē"
            : "Bezsaistē";


    privateChatStatus.classList.toggle(
        "text-success",
        isOnline
    );


    privateChatStatus.classList.toggle(
        "text-secondary",
        !isOnline
    );
}


async function loadPrivateMessages(
    userId
) {
    try {
        const response =
            await fetch(
                `/api/private-messages/${userId}`
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
                "Neizdevās ielādēt privātās ziņas."
            );
        }


        if (
            !currentPrivateUser ||
            currentPrivateUser._id !==
                userId
        ) {
            return;
        }


        privateMessages.innerHTML =
            "";


        if (
            data.length === 0
        ) {
            showEmptyPrivateMessages();

            return;
        }


        data.forEach(
            addPrivateMessageToChat
        );


        scrollPrivateMessagesToBottom();

    } catch (error) {
        privateMessages.innerHTML =
            "";

        showPrivateMessageError(
            error.message
        );
    }
}


function addPrivateMessageToChat(
    message
) {
    if (
        privateMessages.querySelector(
            `[data-private-message-id="${message._id}"]`
        )
    ) {
        return;
    }


    privateMessages
        .querySelector(
            ".private-empty-message"
        )
        ?.remove();


    const senderId =
        getEntityId(
            message.sender
        );


    const isOwn =
        senderId ===
        currentUserId;


    const row =
        document.createElement(
            "div"
        );


    row.classList.add(
        "private-message-row"
    );


    row.classList.add(
        isOwn
            ? "private-message-own"
            : "private-message-other"
    );


    row.dataset.privateMessageId =
        message._id;


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.classList.add(
        "private-message-wrapper"
    );


    const bubble =
        document.createElement(
            "div"
        );


    bubble.classList.add(
        "private-message-bubble"
    );


    const text =
        document.createElement(
            "p"
        );


    text.classList.add(
        "private-message-text"
    );


    text.textContent =
        message.text;


    bubble.appendChild(
        text
    );


    const time =
        document.createElement(
            "div"
        );


    time.classList.add(
        "private-message-time"
    );


    if (message.createdAt) {
        time.textContent =
            new Date(
                message.createdAt
            ).toLocaleTimeString(
                "lv-LV",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );
    }


    wrapper.appendChild(
        bubble
    );


    wrapper.appendChild(
        time
    );


    row.appendChild(
        wrapper
    );


    privateMessages.appendChild(
        row
    );
}


async function sendPrivateMessage() {
    if (!currentPrivateUser) {
        return;
    }


    const text =
        privateMessageInput.value
            .trim();


    if (!text) {
        showPrivateMessageError(
            "Lūdzu, ievadi ziņu!"
        );

        return;
    }


    try {
        privateSendButton.disabled =
            true;


        const response =
            await fetch(
                `/api/private-messages/${currentPrivateUser._id}`,
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
                                text
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
                "Neizdevās nosūtīt privāto ziņu."
            );
        }


        // Socket event arī atnāks.
        // Duplicate check neļaus ziņu
        // parādīt divreiz.
        addPrivateMessageToChat(
            data
        );


        privateMessageInput.value =
            "";


        hidePrivateMessageError();


        scrollPrivateMessagesToBottom();


        privateMessageInput.focus();

    } catch (error) {
        showPrivateMessageError(
            error.message
        );

    } finally {
        privateSendButton.disabled =
            false;
    }
}


privateSendButton.addEventListener(
    "click",
    sendPrivateMessage
);


privateMessageInput.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {
            event.preventDefault();

            sendPrivateMessage();
        }
    }
);


privateMessageModalElement.addEventListener(
    "shown.bs.modal",
    () => {
        privateMessageInput.focus();
    }
);


privateMessageModalElement.addEventListener(
    "hidden.bs.modal",
    () => {
        currentPrivateUser =
            null;

        privateMessageInput.value =
            "";

        hidePrivateMessageError();
    }
);


// ==========================================
// PRIVATE MESSAGE REAL-TIME
// ==========================================

socket.on(
    "privateMessage",
    (message) => {
        const senderId =
            getEntityId(
                message.sender
            );

        const recipientId =
            getEntityId(
                message.recipient
            );


        const belongsToCurrentUser =
            senderId === currentUserId ||
            recipientId === currentUserId;


        if (
            !belongsToCurrentUser
        ) {
            return;
        }


        const partnerId =
            senderId === currentUserId
                ? recipientId
                : senderId;


        if (
            currentPrivateUser &&
            currentPrivateUser._id ===
                partnerId
        ) {
            addPrivateMessageToChat(
                message
            );


            scrollPrivateMessagesToBottom();
        }
    }
);


// ==========================================
// UNREAD GENERAL CHAT
// ==========================================

function isChatActive() {
    return (
        document.visibilityState ===
            "visible" &&
        document.hasFocus()
    );
}


function isMessagesNearBottom() {
    const distanceFromBottom =
        messages.scrollHeight -
        messages.scrollTop -
        messages.clientHeight;


    return (
        distanceFromBottom <=
        80
    );
}


function updateUnreadIndicator() {
    unreadCount.textContent =
        unreadMessageCount;


    if (
        unreadMessageCount > 0
    ) {
        unreadIndicator.classList.remove(
            "d-none"
        );


        document.title =
            `${basePageTitle} (${unreadMessageCount})`;

    } else {
        unreadIndicator.classList.add(
            "d-none"
        );


        document.title =
            basePageTitle;
    }
}


function addUnreadMessage() {
    unreadMessageCount++;

    updateUnreadIndicator();
}


function clearUnreadMessages() {
    unreadMessageCount = 0;

    updateUnreadIndicator();
}


function goToLatestMessages() {
    scrollMessagesToBottom();

    clearUnreadMessages();
}


unreadIndicator.addEventListener(
    "click",
    goToLatestMessages
);


unreadIndicator.addEventListener(
    "keydown",
    (event) => {
        if (
            event.key === "Enter" ||
            event.key === " "
        ) {
            event.preventDefault();

            goToLatestMessages();
        }
    }
);


messages.addEventListener(
    "scroll",
    () => {
        if (
            isChatActive() &&
            isMessagesNearBottom()
        ) {
            clearUnreadMessages();
        }
    }
);


document.addEventListener(
    "visibilitychange",
    () => {
        if (
            document.visibilityState ===
                "visible" &&
            document.hasFocus() &&
            isMessagesNearBottom()
        ) {
            clearUnreadMessages();
        }
    }
);


window.addEventListener(
    "focus",
    () => {
        if (
            isMessagesNearBottom()
        ) {
            clearUnreadMessages();
        }
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
    stopTyping
);


socket.on(
    "typingUsers",
    (users) => {
        const otherUsers =
            users.filter(
                (user) =>
                    String(
                        user.userId
                    ) !==
                    currentUserId
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

        } else if (
            otherUsers.length === 2
        ) {
            typingIndicator.textContent =
                `${otherUsers[0].username} un ${otherUsers[1].username} raksta...`;

        } else {
            typingIndicator.textContent =
                `${otherUsers[0].username}, ${otherUsers[1].username} un vēl ${otherUsers.length - 2} raksta...`;
        }


        typingIndicator.classList.remove(
            "d-none"
        );
    }
);


// ==========================================
// LOAD GENERAL MESSAGES
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


        messages.innerHTML =
            "";


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

        clearUnreadMessages();

    } catch (error) {
        showMessageError(
            error.message
        );
    }
}


// ==========================================
// GENERAL MESSAGE UI
// ==========================================

function addMessageToChat(
    message
) {
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


    const isOwn =
        getEntityId(
            message.user
        ) ===
        currentUserId;


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.classList.add(
        "chat-message",
        isOwn
            ? "chat-message-own"
            : "chat-message-other"
    );


    messageElement.dataset.messageId =
        message._id;

    messageElement.dataset.messageText =
        message.text;

    messageElement.dataset.username =
        message.user?.username || "";


    messageElement.addEventListener(
        "dblclick",
        (event) => {
            if (
                event.target.closest(
                    "button, a, input, .dropdown-menu"
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


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.classList.add(
        "message-wrapper"
    );


    const info =
        document.createElement(
            "div"
        );


    info.classList.add(
        "message-info"
    );


    const username =
        document.createElement(
            "span"
        );


    username.classList.add(
        "message-username"
    );


    username.textContent =
        isOwn
            ? "Tu"
            : (
                message.user?.username ||
                "Nezināms lietotājs"
            );


    const time =
        document.createElement(
            "span"
        );


    time.classList.add(
        "message-time"
    );


    if (message.createdAt) {
        time.textContent =
            new Date(
                message.createdAt
            ).toLocaleTimeString(
                "lv-LV",
                {
                    hour:
                        "2-digit",

                    minute:
                        "2-digit"
                }
            );
    }


    info.appendChild(
        username
    );

    info.appendChild(
        time
    );

    wrapper.appendChild(
        info
    );


    const bubble =
        document.createElement(
            "div"
        );


    bubble.classList.add(
        "message-bubble"
    );


    if (message.replyTo) {
        const replyElement =
            document.createElement(
                "div"
            );


        replyElement.classList.add(
            "reply-message"
        );


        replyElement.dataset.replyToId =
            message.replyTo._id;


        const replyUser =
            document.createElement(
                "small"
            );


        replyUser.classList.add(
            "fw-semibold",
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


        bubble.appendChild(
            replyElement
        );
    }


    const textElement =
        document.createElement(
            "p"
        );


    textElement.classList.add(
        "message-text"
    );


    textElement.textContent =
        message.text;


    if (message.editedAt) {
        addEditedLabel(
            textElement
        );
    }


    bubble.appendChild(
        textElement
    );


    wrapper.appendChild(
        bubble
    );


    const reactionsContainer =
        document.createElement(
            "div"
        );


    reactionsContainer.classList.add(
        "reactions-container"
    );


    wrapper.appendChild(
        reactionsContainer
    );


    const actions =
        document.createElement(
            "div"
        );


    actions.classList.add(
        "message-actions"
    );


    actions.appendChild(
        createReactionMenu(
            message._id
        )
    );


    actions.appendChild(
        createActionMenu(
            message,
            messageElement,
            isOwn
        )
    );


    wrapper.appendChild(
        actions
    );


    messageElement.appendChild(
        wrapper
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
// ACTION MENU
// ==========================================

function createActionMenu(
    message,
    messageElement,
    isOwn
) {
    const dropdown =
        document.createElement(
            "div"
        );


    dropdown.classList.add(
        "dropdown"
    );


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.classList.add(
        "btn",
        "btn-sm",
        "btn-light",
        "message-action-button"
    );


    button.setAttribute(
        "data-bs-toggle",
        "dropdown"
    );


    button.textContent =
        "⋯";


    const menu =
        document.createElement(
            "ul"
        );


    menu.classList.add(
        "dropdown-menu",
        "message-menu"
    );


    const replyItem =
        document.createElement(
            "li"
        );


    const replyButton =
        document.createElement(
            "button"
        );


    replyButton.type =
        "button";


    replyButton.classList.add(
        "dropdown-item"
    );


    replyButton.textContent =
        "↩ Atbildēt";


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


    replyItem.appendChild(
        replyButton
    );


    menu.appendChild(
        replyItem
    );


    if (isOwn) {
        const editItem =
            document.createElement(
                "li"
            );


        const editButton =
            document.createElement(
                "button"
            );


        editButton.type =
            "button";


        editButton.classList.add(
            "dropdown-item"
        );


        editButton.textContent =
            "✎ Rediģēt";


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


        editItem.appendChild(
            editButton
        );


        menu.appendChild(
            editItem
        );


        const divider =
            document.createElement(
                "li"
            );


        divider.innerHTML =
            `<hr class="dropdown-divider">`;


        menu.appendChild(
            divider
        );


        const deleteItem =
            document.createElement(
                "li"
            );


        const deleteButton =
            document.createElement(
                "button"
            );


        deleteButton.type =
            "button";


        deleteButton.classList.add(
            "dropdown-item",
            "text-danger"
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


        deleteItem.appendChild(
            deleteButton
        );


        menu.appendChild(
            deleteItem
        );
    }


    dropdown.appendChild(
        button
    );


    dropdown.appendChild(
        menu
    );


    return dropdown;
}


// ==========================================
// REACTION MENU
// ==========================================

function createReactionMenu(
    messageId
) {
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
        "btn-light",
        "message-action-button",
        "reaction-picker-button"
    );


    menuButton.setAttribute(
        "data-bs-toggle",
        "dropdown"
    );


    menuButton.textContent =
        "😊";


    const menu =
        document.createElement(
            "div"
        );


    menu.classList.add(
        "dropdown-menu",
        "reaction-menu",
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
                        (reaction) =>
                            getEntityId(
                                reaction.user
                            )
                    );


            if (
                reactionUsers.length ===
                0
            ) {
                return;
            }


            const currentUserReacted =
                reactionUsers.includes(
                    currentUserId
                );


            const button =
                document.createElement(
                    "button"
                );


            button.type =
                "button";


            button.classList.add(
                "btn",
                "btn-sm",
                "reaction-badge",
                currentUserReacted
                    ? "btn-primary"
                    : "btn-light"
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
// EDITED
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
// GENERAL MESSAGE SOCKETS
// ==========================================

socket.on(
    "newMessage",
    (message) => {
        const wasNearBottom =
            isMessagesNearBottom();


        const isOwn =
            getEntityId(
                message.user
            ) ===
            currentUserId;


        addMessageToChat(
            message
        );


        applyMessageSearch();


        if (isOwn) {
            scrollMessagesToBottom();

            clearUnreadMessages();

            return;
        }


        if (
            !isChatActive() ||
            !wasNearBottom
        ) {
            addUnreadMessage();

            return;
        }


        scrollMessagesToBottom();
    }
);


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
                .length === 0
        ) {
            showEmptyMessages();
        }


        applyMessageSearch();
    }
);


// ==========================================
// SEND GENERAL MESSAGE
// ==========================================

sendButton.addEventListener(
    "click",
    sendMessage
);


async function sendMessage() {
    const text =
        messageInput.value
            .trim();


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
// UI HELPERS
// ==========================================

function showEmptyMessages() {
    messages.innerHTML = `
        <p
            id="emptyMessages"
            class="text-secondary text-center my-4"
        >
            Ziņu vēl nav.
        </p>
    `;
}


function showEmptyPrivateMessages() {
    privateMessages.innerHTML = `
        <div
            class="private-empty-message text-secondary text-center my-4"
        >
            Privāto ziņu vēl nav.
        </div>
    `;
}


function scrollMessagesToBottom() {
    messages.scrollTop =
        messages.scrollHeight;
}


function scrollPrivateMessagesToBottom() {
    privateMessages.scrollTop =
        privateMessages.scrollHeight;
}


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


function showPrivateMessageError(
    message
) {
    privateMessageError.textContent =
        message;


    privateMessageError.classList.remove(
        "d-none"
    );
}


function hidePrivateMessageError() {
    privateMessageError.classList.add(
        "d-none"
    );
}


/*
 * Šī funkcija tiek izmantota tikai
 * kļūdas teksta drošai ievietošanai HTML,
 * kad tas nepieciešams.
 */
function escapeText(value) {
    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value;


    return element.innerHTML;
}


// ==========================================
// START
// ==========================================

updateUnreadIndicator();

initializeChat();