const socket = io({
    autoConnect: false
});


// ==========================================
// ELEMENTS
// ==========================================

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

const currentUserAvatar =
    document.getElementById(
        "currentUserAvatar"
    );

const usernameDisplay =
    document.getElementById(
        "usernameDisplay"
    );

const profileButton =
    document.getElementById(
        "profileButton"
    );

const changePasswordButton =
    document.getElementById(
        "changePasswordButton"
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

const typingIndicator =
    document.getElementById(
        "typingIndicator"
    );

const unreadIndicator =
    document.getElementById(
        "unreadIndicator"
    );

const unreadCount =
    document.getElementById(
        "unreadCount"
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


const conversationList =
    document.getElementById(
        "conversationList"
    );

const courseUsers =
    document.getElementById(
        "courseUsers"
    );

const onlineUsersCount =
    document.getElementById(
        "onlineUsersCount"
    );

const participantsTabButton =
    document.getElementById(
        "participantsTabButton"
    );


// ==========================================
// PRIVATE CHAT
// ==========================================

const privateMessageModalElement =
    document.getElementById(
        "privateMessageModal"
    );

const privateChatAvatar =
    document.getElementById(
        "privateChatAvatar"
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


// ==========================================
// PROFILE
// ==========================================

const profileModalElement =
    document.getElementById(
        "profileModal"
    );

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );

const profileUsername =
    document.getElementById(
        "profileUsername"
    );

const profileCourse =
    document.getElementById(
        "profileCourse"
    );

const profileUsernameValue =
    document.getElementById(
        "profileUsernameValue"
    );

const profileCourseValue =
    document.getElementById(
        "profileCourseValue"
    );

const profileCreatedAt =
    document.getElementById(
        "profileCreatedAt"
    );


const profileModal =
    new bootstrap.Modal(
        profileModalElement
    );


// ==========================================
// CHANGE PASSWORD
// ==========================================

const changePasswordModalElement =
    document.getElementById(
        "changePasswordModal"
    );

const changePasswordForm =
    document.getElementById(
        "changePasswordForm"
    );

const currentPasswordInput =
    document.getElementById(
        "currentPasswordInput"
    );

const newPasswordInput =
    document.getElementById(
        "newPasswordInput"
    );

const confirmPasswordInput =
    document.getElementById(
        "confirmPasswordInput"
    );

const passwordError =
    document.getElementById(
        "passwordError"
    );

const passwordSuccess =
    document.getElementById(
        "passwordSuccess"
    );

const savePasswordButton =
    document.getElementById(
        "savePasswordButton"
    );


const changePasswordModal =
    new bootstrap.Modal(
        changePasswordModalElement
    );


// ==========================================
// PRIVATE TOAST
// ==========================================

const privateMessageToastElement =
    document.getElementById(
        "privateMessageToast"
    );

const privateToastAvatar =
    document.getElementById(
        "privateToastAvatar"
    );

const privateToastUsername =
    document.getElementById(
        "privateToastUsername"
    );

const privateToastText =
    document.getElementById(
        "privateToastText"
    );

const privateToastTime =
    document.getElementById(
        "privateToastTime"
    );

const privateToastOpenButton =
    document.getElementById(
        "privateToastOpenButton"
    );


const privateMessageToast =
    new bootstrap.Toast(
        privateMessageToastElement,
        {
            autohide:
                true,

            delay:
                6000
        }
    );


// ==========================================
// STATE
// ==========================================

const basePageTitle =
    "Čats | Student Chat";


const GROUP_WINDOW_MS =
    5 * 60 * 1000;


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


let currentUserId =
    null;

let currentUsername =
    null;

let currentCourseNumber =
    null;

let currentCourseName =
    null;

let currentUserCreatedAt =
    null;

let currentReplyTo =
    null;

let typingTimer =
    null;

let isTyping =
    false;

let unreadMessageCount =
    0;

let courseParticipants =
    [];

let privateConversations =
    [];

let onlineUserIds =
    new Set();

let currentPrivateUser =
    null;

let toastPrivateUser =
    null;


// ==========================================
// GENERAL HELPERS
// ==========================================

function getEntityId(
    value
) {

    if (!value) {
        return "";
    }


    if (
        typeof value ===
        "object"
    ) {

        return String(
            value._id ||
            ""
        );

    }


    return String(
        value
    );

}


function getInitial(
    username
) {

    return String(
        username ||
        "?"
    )
        .trim()
        .charAt(0)
        .toUpperCase() ||
        "?";

}


function createAvatar(
    username,
    className = ""
) {

    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        `user-avatar ${className}`
            .trim();


    avatar.textContent =
        getInitial(
            username
        );


    avatar.title =
        username ||
        "";


    return avatar;

}


function escapeText(
    value
) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        value;


    return element.innerHTML;

}


function formatConversationTime(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(
            value
        );


    const now =
        new Date();


    if (
        date.toDateString() ===
        now.toDateString()
    ) {

        return date.toLocaleTimeString(
            "lv-LV",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        );

    }


    return date.toLocaleDateString(
        "lv-LV",
        {
            day:
                "2-digit",

            month:
                "2-digit"
        }
    );

}


function getDateKey(
    value
) {

    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        )
            .padStart(
                2,
                "0"
            );


    const day =
        String(
            date.getDate()
        )
            .padStart(
                2,
                "0"
            );


    return `${year}-${month}-${day}`;

}


function formatDateLabel(
    value
) {

    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const today =
        new Date();


    const yesterday =
        new Date();


    yesterday.setDate(
        today.getDate() - 1
    );


    const dateKey =
        getDateKey(
            date
        );


    if (
        dateKey ===
        getDateKey(
            today
        )
    ) {

        return "Šodien";

    }


    if (
        dateKey ===
        getDateKey(
            yesterday
        )
    ) {

        return "Vakar";

    }


    const options = {
        day:
            "numeric",

        month:
            "long"
    };


    if (
        date.getFullYear() !==
        today.getFullYear()
    ) {

        options.year =
            "numeric";

    }


    return date.toLocaleDateString(
        "lv-LV",
        options
    );

}


function createDateSeparator(
    createdAt
) {

    const separator =
        document.createElement(
            "div"
        );


    separator.className =
        "message-date-separator";


    separator.dataset.dateKey =
        getDateKey(
            createdAt
        );


    const label =
        document.createElement(
            "span"
        );


    label.className =
        "message-date-label";


    label.textContent =
        formatDateLabel(
            createdAt
        );


    separator.appendChild(
        label
    );


    return separator;

}


function messagesBelongToSameGroup(
    previousElement,
    currentElement
) {

    if (
        !previousElement ||
        !currentElement
    ) {

        return false;

    }


    const previousUserId =
        previousElement
            .dataset
            .userId;


    const currentUserIdValue =
        currentElement
            .dataset
            .userId;


    const previousDateKey =
        previousElement
            .dataset
            .dateKey;


    const currentDateKey =
        currentElement
            .dataset
            .dateKey;


    const previousTime =
        new Date(
            previousElement
                .dataset
                .createdAt
        )
            .getTime();


    const currentTime =
        new Date(
            currentElement
                .dataset
                .createdAt
        )
            .getTime();


    if (
        !previousUserId ||
        previousUserId !==
            currentUserIdValue
    ) {

        return false;

    }


    if (
        !previousDateKey ||
        previousDateKey !==
            currentDateKey
    ) {

        return false;

    }


    if (
        Number.isNaN(
            previousTime
        ) ||
        Number.isNaN(
            currentTime
        )
    ) {

        return false;

    }


    return (
        currentTime -
        previousTime >=
            0 &&
        currentTime -
        previousTime <=
            GROUP_WINDOW_MS
    );

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
            String(
                data.user._id
            );


        currentUsername =
            data.user.username;


        currentCourseNumber =
            Number(
                data.user.courseNumber
            );


        currentCourseName =
            data.user.courseName ||
            `${currentCourseNumber}. kurss`;


        currentUserCreatedAt =
            data.user.createdAt ||
            null;


        currentUserAvatar.textContent =
            getInitial(
                currentUsername
            );


        currentUserAvatar.title =
            currentUsername;


        usernameDisplay.textContent =
            currentUsername;


        chatTitle.textContent =
            `${currentCourseNumber}. kursa čats`;


        courseName.textContent =
            currentCourseName;


        loadingMessage.classList.add(
            "d-none"
        );


        chatSection.classList.remove(
            "d-none"
        );


        socket.connect();


        await Promise.all([
            loadMessages(),
            loadCourseUsers(),
            loadConversations()
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


        console.error(
            error
        );

    }

}


// ==========================================
// PROFILE
// ==========================================

function openProfile() {

    profileAvatar.textContent =
        getInitial(
            currentUsername
        );


    profileAvatar.title =
        currentUsername ||
        "";


    profileUsername.textContent =
        currentUsername ||
        "";


    profileCourse.textContent =
        currentCourseName ||
        "";


    profileUsernameValue.textContent =
        currentUsername ||
        "-";


    profileCourseValue.textContent =
        currentCourseName ||
        "-";


    profileCreatedAt.textContent =
        currentUserCreatedAt

            ? new Date(
                currentUserCreatedAt
            )
                .toLocaleDateString(
                    "lv-LV",
                    {
                        day:
                            "numeric",

                        month:
                            "long",

                        year:
                            "numeric"
                    }
                )

            : "-";


    profileModal.show();

}


profileButton.addEventListener(
    "click",
    openProfile
);


changePasswordButton.addEventListener(
    "click",
    () => {

        hidePasswordMessages();


        changePasswordForm.reset();


        changePasswordModal.show();

    }
);


changePasswordModalElement.addEventListener(
    "shown.bs.modal",
    () => {

        currentPasswordInput.focus();

    }
);


changePasswordModalElement.addEventListener(
    "hidden.bs.modal",
    () => {

        changePasswordForm.reset();


        hidePasswordMessages();

    }
);


changePasswordForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        hidePasswordMessages();


        const currentPassword =
            currentPasswordInput.value;


        const newPassword =
            newPasswordInput.value;


        const confirmPassword =
            confirmPasswordInput.value;


        if (
            newPassword.length < 8 ||
            newPassword.length > 72
        ) {

            showPasswordError(
                "Jaunajai parolei jābūt no 8 līdz 72 rakstzīmēm garai."
            );


            return;

        }


        if (
            newPassword !==
            confirmPassword
        ) {

            showPasswordError(
                "Jaunās paroles nesakrīt."
            );


            return;

        }


        try {

            savePasswordButton.disabled =
                true;


            const response =
                await fetch(
                    "/api/auth/password",
                    {
                        method:
                            "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                currentPassword,
                                newPassword
                            })
                    }
                );


            const data =
                await response.json();


            if (
                response.status ===
                401
            ) {

                window.location.href =
                    "/";

                return;

            }


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Neizdevās nomainīt paroli."
                );

            }


            passwordSuccess.textContent =
                data.message ||
                "Parole veiksmīgi nomainīta.";


            passwordSuccess.classList.remove(
                "d-none"
            );


            changePasswordForm.reset();

        } catch (error) {

            showPasswordError(
                error.message
            );

        } finally {

            savePasswordButton.disabled =
                false;

        }

    }
);


function showPasswordError(
    message
) {

    passwordSuccess.classList.add(
        "d-none"
    );


    passwordError.textContent =
        message;


    passwordError.classList.remove(
        "d-none"
    );

}


function hidePasswordMessages() {

    passwordError.classList.add(
        "d-none"
    );


    passwordSuccess.classList.add(
        "d-none"
    );

}


// ==========================================
// SOCKET
// ==========================================

function joinSocketCourse() {

    if (
        currentUserId
    ) {

        socket.emit(
            "joinCourse"
        );

    }

}


socket.on(
    "connect",
    () => {

        isTyping =
            false;


        joinSocketCourse();

    }
);


socket.on(
    "disconnect",
    () => {

        isTyping =
            false;


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
// COURSE USERS
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
            response.status ===
            401
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
                        String(
                            user._id
                        ),

                    username:
                        user.username
                })
            );


        renderCourseUsers();

    } catch (error) {

        courseUsers.innerHTML =
            `
            <div
                class="list-group-item text-danger py-3"
            >
                ${escapeText(error.message)}
            </div>
            `;

    }

}


function renderCourseUsers() {

    courseUsers.innerHTML =
        "";


    const users =
        [
            ...courseParticipants
        ];


    users.sort(
        (a, b) => {

            const aCurrent =
                a._id ===
                currentUserId;


            const bCurrent =
                b._id ===
                currentUserId;


            if (
                aCurrent !==
                bCurrent
            ) {

                return aCurrent
                    ? -1
                    : 1;

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
        users.length ===
        0
    ) {

        courseUsers.innerHTML =
            `
            <div
                class="list-group-item text-secondary py-3"
            >
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


            item.className =
                "list-group-item d-flex align-items-center gap-2 participant-item py-3";


            const avatar =
                createAvatar(
                    user.username,
                    isOnline
                        ? "avatar-online"
                        : ""
                );


            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "participant-info";


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "participant-name";


            name.textContent =
                user.username;


            const state =
                document.createElement(
                    "div"
                );


            state.className =
                `participant-state ${isOnline ? "text-success" : "text-secondary"}`;


            state.textContent =
                isOnline
                    ? "Tiešsaistē"
                    : "Bezsaistē";


            info.append(
                name,
                state
            );


            item.append(
                avatar,
                info
            );


            if (isCurrent) {

                const badge =
                    document.createElement(
                        "span"
                    );


                badge.className =
                    "badge text-bg-primary";


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


                button.className =
                    "btn btn-sm btn-outline-primary";


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
// CONVERSATIONS
// ==========================================

async function loadConversations() {

    try {

        const response =
            await fetch(
                "/api/private-messages/conversations"
            );


        const data =
            await response.json();


        if (
            response.status ===
            401
        ) {

            window.location.href =
                "/";

            return;

        }


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Neizdevās ielādēt sarakstes."
            );

        }


        privateConversations =
            data.map(
                (conversation) => ({
                    user: {
                        _id:
                            String(
                                conversation
                                    .user
                                    ._id
                            ),

                        username:
                            conversation
                                .user
                                .username
                    },

                    lastMessage:
                        conversation
                            .lastMessage
                })
            );


        renderConversations();

    } catch (error) {

        conversationList.innerHTML =
            `
            <div
                class="list-group-item text-danger py-3"
            >
                ${escapeText(error.message)}
            </div>
            `;

    }

}


function renderConversations() {

    conversationList.innerHTML =
        "";


    if (
        privateConversations.length ===
        0
    ) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "sidebar-empty-state";


        empty.innerHTML =
            `
            <div class="sidebar-empty-icon">
                💬
            </div>

            <strong class="d-block mb-1">
                Sarakstu vēl nav
            </strong>

            <div class="small mb-3">
                Izvēlies kursa dalībnieku un uzraksti pirmo privāto ziņu.
            </div>
            `;


        const button =
            document.createElement(
                "button"
            );


        button.type =
            "button";


        button.className =
            "btn btn-sm btn-outline-primary";


        button.textContent =
            "Atvērt dalībniekus";


        button.addEventListener(
            "click",
            () => {

                bootstrap.Tab
                    .getOrCreateInstance(
                        participantsTabButton
                    )
                    .show();

            }
        );


        empty.appendChild(
            button
        );


        conversationList.appendChild(
            empty
        );


        return;

    }


    privateConversations.forEach(
        (conversation) => {

            const user =
                conversation.user;


            const isOnline =
                onlineUserIds.has(
                    user._id
                );


            const item =
                document.createElement(
                    "button"
                );


            item.type =
                "button";


            item.className =
                "list-group-item list-group-item-action conversation-item";


            const avatar =
                createAvatar(
                    user.username,
                    isOnline
                        ? "avatar-online"
                        : ""
                );


            const main =
                document.createElement(
                    "div"
                );


            main.className =
                "conversation-main";


            const top =
                document.createElement(
                    "div"
                );


            top.className =
                "conversation-top";


            const name =
                document.createElement(
                    "div"
                );


            name.className =
                "conversation-name";


            name.textContent =
                user.username;


            const time =
                document.createElement(
                    "span"
                );


            time.className =
                "conversation-time";


            time.textContent =
                formatConversationTime(
                    conversation
                        .lastMessage
                        ?.createdAt
                );


            const preview =
                document.createElement(
                    "div"
                );


            preview.className =
                "conversation-preview";


            preview.textContent =
                `${conversation.lastMessage?.isOwn ? "Tu: " : ""}${conversation.lastMessage?.text || ""}`;


            top.append(
                name,
                time
            );


            main.append(
                top,
                preview
            );


            item.append(
                avatar,
                main
            );


            item.addEventListener(
                "click",
                () => {

                    openPrivateChat(
                        user
                    );

                }
            );


            conversationList.appendChild(
                item
            );

        }
    );

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


        renderConversations();


        updatePrivateChatStatus();

    }
);


// ==========================================
// PRIVATE CHAT
// ==========================================

async function openPrivateChat(
    user
) {

    currentPrivateUser =
        user;


    privateMessageToast.hide();


    privateChatAvatar.textContent =
        getInitial(
            user.username
        );


    privateChatAvatar.title =
        user.username;


    privateChatUsername.textContent =
        `Privāta sarakste ar ${user.username}`;


    updatePrivateChatStatus();


    privateMessages.innerHTML =
        `
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

    if (
        !currentPrivateUser
    ) {

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


    privateChatAvatar.classList.toggle(
        "avatar-online",
        isOnline
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
            response.status ===
            401
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
            data.length ===
            0
        ) {

            showEmptyPrivateMessages();

            return;

        }


        data.forEach(
            (message) =>
                addPrivateMessageToChat(
                    message,
                    false
                )
        );


        refreshPrivateMessageLayout();


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
    message,
    refreshLayout = true
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


    const senderUsername =
        isOwn

            ? currentUsername

            : (
                message.sender
                    ?.username ||
                currentPrivateUser
                    ?.username ||
                "?"
            );


    const row =
        document.createElement(
            "div"
        );


    row.className =
        `private-message-row ${isOwn ? "private-message-own" : "private-message-other"}`;


    row.dataset.privateMessageId =
        message._id;


    row.dataset.userId =
        senderId;


    row.dataset.createdAt =
        message.createdAt ||
        "";


    row.dataset.dateKey =
        getDateKey(
            message.createdAt
        );


    const avatar =
        createAvatar(
            senderUsername,
            "user-avatar-private"
        );


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "private-message-wrapper";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "private-message-bubble";


    const text =
        document.createElement(
            "p"
        );


    text.className =
        "private-message-text";


    text.textContent =
        message.text;


    const time =
        document.createElement(
            "div"
        );


    time.className =
        "private-message-time";


    if (
        message.createdAt
    ) {

        time.textContent =
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


    bubble.appendChild(
        text
    );


    wrapper.append(
        bubble,
        time
    );


    if (isOwn) {

        row.append(
            wrapper,
            avatar
        );

    } else {

        row.append(
            avatar,
            wrapper
        );

    }


    privateMessages.appendChild(
        row
    );


    if (refreshLayout) {

        refreshPrivateMessageLayout();

    }

}


function refreshPrivateMessageLayout() {

    privateMessages
        .querySelectorAll(
            ".message-date-separator"
        )
        .forEach(
            (element) =>
                element.remove()
        );


    const rows =
        Array.from(
            privateMessages.querySelectorAll(
                ".private-message-row"
            )
        );


    let previousRow =
        null;


    let previousDateKey =
        null;


    rows.forEach(
        (row) => {

            const dateKey =
                row.dataset.dateKey;


            if (
                dateKey &&
                dateKey !==
                    previousDateKey
            ) {

                row.before(
                    createDateSeparator(
                        row.dataset.createdAt
                    )
                );

            }


            const continuation =
                messagesBelongToSameGroup(
                    previousRow,
                    row
                );


            row.classList.toggle(
                "message-group-continuation",
                continuation
            );


            row
                .querySelector(
                    ".user-avatar-private"
                )
                ?.classList.toggle(
                    "avatar-placeholder",
                    continuation
                );


            previousRow =
                row;


            previousDateKey =
                dateKey;

        }
    );

}


// ==========================================
// SEND PRIVATE MESSAGE
// ==========================================

async function sendPrivateMessage() {

    if (
        !currentPrivateUser
    ) {

        return;

    }


    const text =
        privateMessageInput
            .value
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
                            text
                        })
                }
            );


        const data =
            await response.json();


        if (
            response.status ===
            401
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


        addPrivateMessageToChat(
            data
        );


        privateMessageInput.value =
            "";


        hidePrivateMessageError();


        scrollPrivateMessagesToBottom();


        privateMessageInput.focus();


        await loadConversations();

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
            event.key ===
                "Enter" &&
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


        privateChatAvatar.classList.remove(
            "avatar-online"
        );

    }
);


// ==========================================
// PRIVATE TOAST
// ==========================================

function isPrivateModalOpen() {

    return privateMessageModalElement
        .classList
        .contains(
            "show"
        );

}


function showPrivateMessageToast(
    message,
    sender
) {

    toastPrivateUser =
        sender;


    privateToastAvatar.textContent =
        getInitial(
            sender.username
        );


    privateToastUsername.textContent =
        sender.username;


    privateToastText.textContent =
        message.text;


    privateToastTime.textContent =
        message.createdAt

            ? new Date(
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
                )

            : "tagad";


    privateMessageToast.show();

}


privateToastOpenButton.addEventListener(
    "click",
    () => {

        if (
            !toastPrivateUser
        ) {

            return;

        }


        const user =
            toastPrivateUser;


        privateMessageToast.hide();


        openPrivateChat(
            user
        );

    }
);


privateMessageToastElement.addEventListener(
    "hidden.bs.toast",
    () => {

        toastPrivateUser =
            null;

    }
);


socket.on(
    "privateMessage",
    async (message) => {

        const senderId =
            getEntityId(
                message.sender
            );


        const recipientId =
            getEntityId(
                message.recipient
            );


        if (
            senderId !==
                currentUserId &&
            recipientId !==
                currentUserId
        ) {

            return;

        }


        const isOwnMessage =
            senderId ===
            currentUserId;


        const partnerId =
            isOwnMessage
                ? recipientId
                : senderId;


        if (
            currentPrivateUser?._id ===
            partnerId
        ) {

            addPrivateMessageToChat(
                message
            );


            scrollPrivateMessagesToBottom();

        }


        if (!isOwnMessage) {

            const sameConversationOpen =
                isPrivateModalOpen() &&
                currentPrivateUser &&
                currentPrivateUser._id ===
                    senderId;


            if (
                !sameConversationOpen
            ) {

                showPrivateMessageToast(
                    message,
                    {
                        _id:
                            senderId,

                        username:
                            message.sender
                                ?.username ||
                            "Lietotājs"
                    }
                );

            }

        }


        await loadConversations();

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
        unreadMessageCount >
        0
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

    unreadMessageCount =
        0;


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
            event.key ===
                "Enter" ||
            event.key ===
                " "
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


        isTyping =
            true;

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


    isTyping =
        false;

}


messageInput.addEventListener(
    "input",
    () => {

        if (
            messageInput.value
                .trim() ===
            ""
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
            otherUsers.length ===
            0
        ) {

            typingIndicator.textContent =
                "";


            typingIndicator.classList.add(
                "d-none"
            );


            return;

        }


        if (
            otherUsers.length ===
            1
        ) {

            typingIndicator.textContent =
                `${otherUsers[0].username} raksta...`;

        } else if (
            otherUsers.length ===
            2
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
// GENERAL MESSAGES: LOAD / GROUP / DATES
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
            response.status ===
            401
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
            data.length ===
            0
        ) {

            showEmptyMessages();

            return;

        }


        data.forEach(
            (message) =>
                addMessageToChat(
                    message,
                    false
                )
        );


        refreshGeneralMessageLayout();


        applyMessageSearch();


        scrollMessagesToBottom();


        clearUnreadMessages();

    } catch (error) {

        showMessageError(
            error.message
        );

    }

}


function addMessageToChat(
    message,
    refreshLayout = true
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


    const userId =
        getEntityId(
            message.user
        );


    const isOwn =
        userId ===
        currentUserId;


    const messageUsername =
        isOwn

            ? currentUsername

            : (
                message.user
                    ?.username ||
                "Nezināms lietotājs"
            );


    const messageElement =
        document.createElement(
            "div"
        );


    messageElement.className =
        `chat-message ${isOwn ? "chat-message-own" : "chat-message-other"}`;


    messageElement.dataset.messageId =
        message._id;


    messageElement.dataset.messageText =
        message.text;


    messageElement.dataset.username =
        message.user?.username ||
        currentUsername ||
        "";


    messageElement.dataset.userId =
        userId;


    messageElement.dataset.createdAt =
        message.createdAt ||
        "";


    messageElement.dataset.dateKey =
        getDateKey(
            message.createdAt
        );


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


    const avatar =
        createAvatar(
            messageUsername,
            "user-avatar-message"
        );


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "message-wrapper";


    const info =
        document.createElement(
            "div"
        );


    info.className =
        "message-info";


    const username =
        document.createElement(
            "span"
        );


    username.className =
        "message-username";


    username.textContent =
        isOwn
            ? "Tu"
            : messageUsername;


    const time =
        document.createElement(
            "span"
        );


    time.className =
        "message-time";


    if (
        message.createdAt
    ) {

        time.textContent =
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


    info.append(
        username,
        time
    );


    wrapper.appendChild(
        info
    );


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        "message-bubble";


    if (
        message.replyTo
    ) {

        const replyElement =
            document.createElement(
                "div"
            );


        replyElement.className =
            "reply-message";


        replyElement.dataset.replyToId =
            message.replyTo._id;


        const replyUser =
            document.createElement(
                "small"
            );


        replyUser.className =
            "fw-semibold d-block";


        replyUser.textContent =
            message.replyTo.user
                ?.username ||
            "Nezināms lietotājs";


        const replyMessageText =
            document.createElement(
                "small"
            );


        replyMessageText.className =
            "reply-message-text";


        replyMessageText.textContent =
            message.replyTo.text ||
            "Ziņa nav pieejama";


        replyElement.append(
            replyUser,
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


    textElement.className =
        "message-text";


    textElement.textContent =
        message.text;


    if (
        message.editedAt
    ) {

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


    reactionsContainer.className =
        "reactions-container";


    wrapper.appendChild(
        reactionsContainer
    );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "message-actions";


    actions.append(
        createReactionMenu(
            message._id
        ),

        createActionMenu(
            message,
            messageElement,
            isOwn
        )
    );


    wrapper.appendChild(
        actions
    );


    if (isOwn) {

        messageElement.append(
            wrapper,
            avatar
        );

    } else {

        messageElement.append(
            avatar,
            wrapper
        );

    }


    messages.appendChild(
        messageElement
    );


    renderReactions(
        messageElement,
        message.reactions ||
        []
    );


    if (refreshLayout) {

        refreshGeneralMessageLayout();

    }

}


function refreshGeneralMessageLayout() {

    messages
        .querySelectorAll(
            ".message-date-separator"
        )
        .forEach(
            (element) =>
                element.remove()
        );


    const messageElements =
        Array.from(
            messages.querySelectorAll(
                ".chat-message"
            )
        );


    let previousMessage =
        null;


    let previousDateKey =
        null;


    messageElements.forEach(
        (messageElement) => {

            const dateKey =
                messageElement
                    .dataset
                    .dateKey;


            if (
                dateKey &&
                dateKey !==
                    previousDateKey
            ) {

                messageElement.before(
                    createDateSeparator(
                        messageElement
                            .dataset
                            .createdAt
                    )
                );

            }


            const continuation =
                messagesBelongToSameGroup(
                    previousMessage,
                    messageElement
                );


            messageElement.classList.toggle(
                "message-group-continuation",
                continuation
            );


            messageElement
                .querySelector(
                    ".user-avatar-message"
                )
                ?.classList.toggle(
                    "avatar-placeholder",
                    continuation
                );


            messageElement
                .querySelector(
                    ".message-username"
                )
                ?.classList.toggle(
                    "d-none",
                    continuation
                );


            previousMessage =
                messageElement;


            previousDateKey =
                dateKey;

        }
    );


    updateDateSeparatorVisibility();

}


function updateDateSeparatorVisibility() {

    const separators =
        Array.from(
            messages.querySelectorAll(
                ".message-date-separator"
            )
        );


    separators.forEach(
        (separator) => {

            let element =
                separator
                    .nextElementSibling;


            let hasVisibleMessage =
                false;


            while (
                element &&
                !element.classList.contains(
                    "message-date-separator"
                )
            ) {

                if (
                    element.classList.contains(
                        "chat-message"
                    ) &&
                    !element.classList.contains(
                        "d-none"
                    )
                ) {

                    hasVisibleMessage =
                        true;


                    break;

                }


                element =
                    element
                        .nextElementSibling;

            }


            separator.classList.toggle(
                "d-none",
                !hasVisibleMessage
            );

        }
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


    dropdown.className =
        "dropdown";


    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "btn btn-sm btn-light message-action-button";


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


    menu.className =
        "dropdown-menu message-menu";


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


    replyButton.className =
        "dropdown-item";


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


        editButton.className =
            "dropdown-item";


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


        deleteButton.className =
            "dropdown-item text-danger";


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


    dropdown.append(
        button,
        menu
    );


    return dropdown;

}


// ==========================================
// REACTIONS
// ==========================================

function createReactionMenu(
    messageId
) {

    const dropdown =
        document.createElement(
            "div"
        );


    dropdown.className =
        "dropdown";


    const menuButton =
        document.createElement(
            "button"
        );


    menuButton.type =
        "button";


    menuButton.className =
        "btn btn-sm btn-light message-action-button reaction-picker-button";


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


    menu.className =
        "dropdown-menu reaction-menu p-2";


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "row row-cols-4 g-1";


    reactionTypes.forEach(
        (reaction) => {

            const column =
                document.createElement(
                    "div"
                );


            column.className =
                "col";


            const reactionButton =
                document.createElement(
                    "button"
                );


            reactionButton.type =
                "button";


            reactionButton.className =
                "btn btn-light w-100";


            reactionButton.textContent =
                reaction;


            reactionButton.addEventListener(
                "click",
                () => {

                    toggleReaction(
                        messageId,
                        reaction
                    );

                }
            );


            column.appendChild(
                reactionButton
            );


            row.appendChild(
                column
            );

        }
    );


    menu.appendChild(
        row
    );


    dropdown.append(
        menuButton,
        menu
    );


    return dropdown;

}


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


            button.className =
                `btn btn-sm reaction-badge ${currentUserReacted ? "btn-primary" : "btn-light"}`;


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
            response.status ===
            401
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
        messageElements.length ===
            0 ||
        visibleMessages >
            0
    );


    updateDateSeparatorVisibility();

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

        username,

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


    editedElement.className =
        "text-secondary ms-2 edited-label";


    editedElement.textContent =
        "(rediģēts)";


    textElement.appendChild(
        editedElement
    );

}


// ==========================================
// EDIT / DELETE
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
            response.status ===
            401
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
            response.status ===
            401
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
// GENERAL SOCKET EVENTS
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
            String(
                message._id
            )
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
                data.reactions ||
                []
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
            String(
                messageId
            )
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

        } else {

            refreshGeneralMessageLayout();

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
            response.status ===
            401
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
            event.key ===
                "Enter" &&
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

    messages.innerHTML =
        `
        <div
            id="emptyMessages"
            class="chat-empty-state"
        >

            <div
                class="chat-empty-icon"
            >
                💬
            </div>

            <h5>
                Ziņu vēl nav
            </h5>

            <p
                class="mb-0"
            >
                Sāc sarunu ar sava kursa studentiem.
            </p>

        </div>
        `;

}


function showEmptyPrivateMessages() {

    privateMessages.innerHTML =
        `
        <div
            class="private-empty-message text-secondary text-center my-4"
        >
            Privāto ziņu vēl nav. Uzraksti pirmo ziņu!
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


// ==========================================
// START
// ==========================================

updateUnreadIndicator();


initializeChat();