const courseSelect = document.getElementById("courseSelect");
const continueButton = document.getElementById("continueButton");
const errorMessage = document.getElementById("errorMessage");


async function loadCourses() {
    try {
        const response = await fetch("/api/courses");

        if (!response.ok) {
            throw new Error("Neizdevās iegūt kursus.");
        }

        const courses = await response.json();

        courses.forEach((course) => {
            const option = document.createElement("option");

            option.value = course.number;
            option.textContent = course.name;

            courseSelect.appendChild(option);
        });

    } catch (error) {
        console.error(error);

        errorMessage.textContent = "Neizdevās ielādēt kursus.";
        errorMessage.classList.remove("d-none");
    }
}


continueButton.addEventListener("click", () => {
    const selectedCourse = courseSelect.value;

    if (selectedCourse === "") {
        errorMessage.textContent = "Lūdzu, izvēlies kursu!";
        errorMessage.classList.remove("d-none");
        return;
    }

    errorMessage.classList.add("d-none");

    window.location.href =
        `chat.html?course=${selectedCourse}`;
});


loadCourses();