const loginForm =
    document.getElementById(
        "loginForm"
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


const loginButton =
    document.getElementById(
        "loginButton"
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
// LOGIN
// ==========================================

loginForm.addEventListener(
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


        hideError();


        if (
            !username ||
            !courseNumber ||
            !password
        ) {

            showError(
                "Aizpildi visus laukus."
            );

            return;

        }


        try {

            loginButton.disabled =
                true;


            loginButton.textContent =
                "Pieslēdzas...";


            const response =
                await fetch(
                    "/api/auth/login",
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
                    "Neizdevās pieslēgties."
                );

            }


            window.location.href =
                "/chat.html";

        } catch (error) {

            showError(
                error.message
            );

        } finally {

            loginButton.disabled =
                false;


            loginButton.textContent =
                "Pieslēgties";

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