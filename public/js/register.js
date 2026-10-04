const registerForm =
    document.getElementById(
        "registerForm"
    );


const usernameInput =
    document.getElementById(
        "usernameInput"
    );


const courseSelect =
    document.getElementById(
        "courseSelect"
    );


const passwordInput =
    document.getElementById(
        "passwordInput"
    );


const passwordConfirmInput =
    document.getElementById(
        "passwordConfirmInput"
    );


const registerButton =
    document.getElementById(
        "registerButton"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


// ==========================================
// SESSION CHECK
// ==========================================

async function checkSession() {

    try {

        const response =
            await fetch(
                "/api/auth/me"
            );


        if (response.ok) {

            window.location.href =
                "/chat.html";

        }

    } catch (error) {

        console.error(
            "Sesijas pārbaudes kļūda:",
            error
        );

    }

}


// ==========================================
// LOAD COURSES
// ==========================================

async function loadCourses() {

    try {

        const response =
            await fetch(
                "/api/courses"
            );


        const courses =
            await response.json();


        if (!response.ok) {

            throw new Error(
                courses.message ||
                "Neizdevās ielādēt kursus."
            );

        }


        courses.forEach(
            (course) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    course.number;


                option.textContent =
                    course.name;


                courseSelect.appendChild(
                    option
                );

            }
        );

    } catch (error) {

        showError(
            error.message
        );

    }

}


// ==========================================
// REGISTER
// ==========================================

registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const username =
            usernameInput.value.trim();


        const courseNumber =
            Number(
                courseSelect.value
            );


        const password =
            passwordInput.value;


        const passwordConfirm =
            passwordConfirmInput.value;


        hideError();


        if (
            !username ||
            !courseNumber ||
            !password ||
            !passwordConfirm
        ) {

            showError(
                "Aizpildi visus laukus."
            );

            return;

        }


        if (
            username.length < 3 ||
            username.length > 30
        ) {

            showError(
                "Lietotājvārdam jābūt no 3 līdz 30 rakstzīmēm garam."
            );

            return;

        }


        if (
            password.length < 8 ||
            password.length > 72
        ) {

            showError(
                "Parolei jābūt no 8 līdz 72 rakstzīmēm garai."
            );

            return;

        }


        if (
            password !==
            passwordConfirm
        ) {

            showError(
                "Paroles nesakrīt."
            );

            return;

        }


        try {

            registerButton.disabled =
                true;


            registerButton.textContent =
                "Reģistrē...";


            const response =
                await fetch(
                    "/api/auth/register",
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

                                password:
                                    password,

                                courseNumber:
                                    courseNumber
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Reģistrācija neizdevās."
                );

            }


            window.location.href =
                "/chat.html";

        } catch (error) {

            showError(
                error.message
            );

        } finally {

            registerButton.disabled =
                false;


            registerButton.textContent =
                "Reģistrēties";

        }

    }
);


// ==========================================
// ERRORS
// ==========================================

function showError(message) {

    errorMessage.textContent =
        message;


    errorMessage.classList.remove(
        "d-none"
    );

}


function hideError() {

    errorMessage.classList.add(
        "d-none"
    );

}


// ==========================================
// START
// ==========================================

checkSession();
loadCourses();