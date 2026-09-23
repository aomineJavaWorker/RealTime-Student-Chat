const courseSelect = document.getElementById("courseSelect");
const continueButton = document.getElementById("continueButton");
const errorMessage = document.getElementById("errorMessage");

continueButton.addEventListener("click", () => {

    const selectedCourse = courseSelect.value;

    if (selectedCourse === "") {
        errorMessage.classList.remove("d-none");
        return;
    }

    errorMessage.classList.add("d-none");

    window.location.href = `chat.html?course=${selectedCourse}`;
});