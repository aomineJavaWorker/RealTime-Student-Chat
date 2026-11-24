const form = document.getElementById("resetForm");
const email = document.getElementById("resetEmail");
const code = document.getElementById("resetCode");
const password = document.getElementById("newPassword");
const repeat = document.getElementById("repeatPassword");
const feedback = document.getElementById("feedback");
const submitButton = document.getElementById("submitReset");
const resend = document.getElementById("resend");
const restart = document.getElementById("restart");
let step = "request";
let token = "";
let busy = false;
let resendAt = 0;

function render() {
    const seconds = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
    document.getElementById("emailStep").hidden = step !== "request";
    document.getElementById("codeStep").hidden = step !== "verify";
    document.getElementById("passwordStep").hidden = step !== "complete";
    submitButton.textContent = { request: "Nosūtīt kodu", verify: "Apstiprināt kodu", complete: "Saglabāt jauno paroli" }[step];
    submitButton.disabled = busy;
    restart.hidden = step === "request";
    restart.disabled = busy;
    resend.hidden = step !== "verify";
    resend.disabled = busy || seconds > 0;
    resend.textContent = seconds ? `Jauns kods pēc ${seconds} s` : "Nosūtīt jaunu kodu";
}

async function send(action) {
    if (busy) return;
    const body = { email: email.value.trim() };
    if (action === "request" && (!body.email || !email.validity.valid)) {
        feedback.textContent = "Ievadi derīgu e-pasta adresi.";
        email.focus();
        return;
    }
    if (action === "verify") {
        body.code = code.value;
        if (!/^[0-9]{6}$/.test(body.code)) {
            feedback.textContent = "Ievadi sešciparu kodu.";
            code.focus();
            return;
        }
    }
    if (action === "complete") {
        if (password.value.length < 8 || new TextEncoder().encode(password.value).length > 72) {
            feedback.textContent = "Pārbaudi jaunās paroles garumu.";
            password.focus();
            return;
        }
        if (password.value !== repeat.value) {
            feedback.textContent = "Paroles nesakrīt.";
            repeat.focus();
            return;
        }
        Object.assign(body, { token, password: password.value, passwordConfirm: repeat.value });
    }
    busy = true;
    render();
    try {
        const response = await fetch("/api/auth/password-reset/" + action, {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
        });
        const data = await response.json();
        feedback.textContent = data.message || "";
        if (action === "request" && data.retryAfter) resendAt = Date.now() + data.retryAfter * 1000;
        if (!response.ok) return;
        if (action === "request") {
            step = "verify";
            code.value = "";
        } else if (action === "verify") {
            token = data.token;
            code.value = "";
            step = "complete";
        } else {
            token = "";
            form.reset();
            window.location.replace("/?password-reset=success");
        }
    } catch {
        feedback.textContent = "Neizdevās saņemt servera atbildi. Mēģini vēlreiz.";
    } finally {
        busy = false;
        render();
        if (step === "verify") code.focus();
        if (step === "complete") password.focus();
    }
}

form.addEventListener("submit", event => {
    event.preventDefault();
    send(step);
});
resend.addEventListener("click", () => send("request"));
restart.addEventListener("click", () => {
    token = "";
    step = "request";
    feedback.textContent = "";
    form.reset();
    render();
    email.focus();
});
window.setInterval(render, 1000);
