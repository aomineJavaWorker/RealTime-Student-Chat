function testEmail() {
    const subject = "Student Chat e-pasta sūtīšanas pārbaude";
    const message = "Šī ir pārbaudes vēstule no Student Chat. Tev nekas nav jādara.";

    return {
        subject,
        textContent: message,
        htmlContent: `<p lang="lv">${message}</p>`
    };
}


function codeEmail(subject, instruction, code) {
    if (typeof code !== "string" || !/^[0-9]{6}$/.test(code)) {
        throw new Error("Vēstules kodam jāsastāv no sešiem cipariem.");
    }

    const expiry = "Kods ir derīgs 10 minūtes.";
    const notice = "Ja tu to nepieprasīji, vari ignorēt šo vēstuli.";

    return {
        subject,
        textContent: [instruction, code, expiry, notice].join("\n\n"),
        htmlContent: `<div lang="lv"><p>${instruction}</p><p><strong>${code}</strong></p><p>${expiry}</p><p>${notice}</p></div>`
    };
}


function verificationEmail(code) {
    return codeEmail(
        "Apstiprini savu Student Chat e-pasta adresi",
        "Lai apstiprinātu savu e-pasta adresi, ievadi šo kodu Student Chat.",
        code
    );
}


function passwordResetEmail(code) {
    return codeEmail(
        "Student Chat paroles atjaunošana",
        "Lai atjaunotu savu paroli, ievadi šo kodu Student Chat.",
        code
    );
}


module.exports = { testEmail, verificationEmail, passwordResetEmail };
