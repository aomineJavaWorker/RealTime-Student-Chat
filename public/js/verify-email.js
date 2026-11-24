const form = document.getElementById("codeForm");
const code = document.getElementById("code");
const feedback = document.getElementById("feedback");
const confirmButton = document.getElementById("confirm");
const resendButton = document.getElementById("resend");
let resendAt = 0;
let busy = true;
let complete = false;

function updateButtons() {
    const seconds = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
    confirmButton.disabled = busy || complete;
    resendButton.disabled = busy || complete || seconds > 0;
    resendButton.textContent = seconds
        ? `Jaunu kodu var pieprasīt pēc ${seconds} s`
        : "Nosūtīt jaunu kodu";
}

async function request(action, options) {
    busy = true;
    updateButtons();
    try {
        const response = await fetch("/api/auth/email-verification" + action, options);
        const data = await response.json();
        if (response.status === 401 || data.verificationUnnecessary) {
            complete = true;
            window.location.replace(response.status === 401 ? "/" : "/chat.html");
            return;
        }

        if (data.address) {
            document.getElementById("verificationAddress").textContent = data.address;
        }
        if (action !== "/confirm" && typeof data.retryAfter === "number") {
            resendAt = Date.now() + data.retryAfter * 1000;
        }
        feedback.textContent = data.message || "";
        if (!response.ok) return;

        if (!action && data.deliveryFailed) {
            feedback.textContent = "Neizdevās apstiprināt koda nosūtīšanu. Pārbaudi iesūtni vai pieprasi jaunu kodu.";
        } else if (!action && !data.hasCode) {
            feedback.textContent = "Pieprasi jaunu kodu, lai apstiprinātu e-pasta adresi.";
        } else if (action === "/resend") {
            code.value = "";
            code.focus();
        } else if (action === "/confirm") {
            complete = true;
            code.disabled = true;
            resendButton.hidden = true;
        }
    } catch {
        feedback.textContent = "Neizdevās saņemt servera atbildi. Mēģini vēlreiz.";
    } finally {
        busy = false;
        updateButtons();
    }
}

form.addEventListener("submit", event => {
    event.preventDefault();
    if (busy || complete) return;
    if (!code.validity.valid) {
        feedback.textContent = "Ievadi sešciparu kodu.";
        code.focus();
        return;
    }
    request("/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.value })
    });
});

resendButton.addEventListener("click", () => request("/resend", { method: "POST" }));
window.setInterval(updateButtons, 1000);
request("");
