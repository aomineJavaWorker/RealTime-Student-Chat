(() => {
    const byId = id => document.getElementById(id);
    const modal = byId("profileModal");
    const form = byId("profileEmailForm");
    const edit = byId("editEmail");
    const resend = byId("profileResend");
    const feedback = byId("profileEmailFeedback");
    const password = byId("profileEmailPassword");
    const address = byId("newProfileEmail");
    const endpoint = "/api/auth/email-verification";
    let resendAt = 0;
    let busy = false;
    let loaded = false;
    let timer;
    let view = 0;

    function buttons() {
        const seconds = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
        resend.disabled = !loaded || busy || seconds > 0;
        resend.textContent = seconds ? `Jauns kods pēc ${seconds} s` : "Nosūtīt jaunu kodu";
        edit.disabled = !loaded || busy;
        byId("saveProfileEmail").disabled = !loaded || busy;
    }

    function showForm(open) {
        form.hidden = !open;
        edit.setAttribute("aria-expanded", String(open));
        if (open) address.focus();
        else form.reset();
    }

    async function refresh(version) {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (response.status === 401) {
            window.location.replace("/");
            return;
        }
        if (!response.ok) throw new Error();
        const { user } = await response.json();
        if (version !== view) return;
        byId("profileEmail").textContent = user.email || "Nav pievienota";
        byId("profileEmailStatus").textContent = user.email
            ? (user.emailVerified ? "Apstiprināta" : "Nav apstiprināta") : "Nav e-pasta adreses";
        byId("pendingEmailRow").hidden = !user.pendingEmail;
        byId("profilePendingEmail").textContent = user.pendingEmail || "";
        byId("profileVerification").hidden = !user.needsEmailVerification;
        byId("verifyEmailMenuItem").hidden = !user.needsEmailVerification;
        edit.textContent = user.email || user.pendingEmail ? "Mainīt e-pasta adresi" : "Pievienot e-pasta adresi";
        loaded = true;
        if (user.needsEmailVerification) {
            const status = await fetch(endpoint, { cache: "no-store" });
            if (status.ok) {
                const data = await status.json();
                if (version === view) resendAt = Math.max(resendAt, Date.now() + data.retryAfter * 1000);
            }
        }
    }

    modal.addEventListener("show.bs.modal", async () => {
        const version = ++view;
        feedback.textContent = "";
        loaded = false;
        buttons();
        timer = window.setInterval(buttons, 1000);
        try {
            await refresh(version);
        } catch {
            if (version === view) feedback.textContent = "Neizdevās ielādēt e-pasta iestatījumus. Atver profilu vēlreiz.";
        } finally {
            buttons();
        }
    });

    modal.addEventListener("hidden.bs.modal", () => {
        view++;
        window.clearInterval(timer);
        showForm(false);
    });

    edit.addEventListener("click", () => showForm(form.hidden));

    async function submit(action, body) {
        if (busy || !loaded) return;
        busy = true;
        buttons();
        password.value = "";
        feedback.textContent = "Nosūta pieprasījumu…";
        try {
            const response = await fetch(endpoint + action, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            if (response.status === 401) {
                window.location.replace("/");
                return;
            }
            const data = await response.json();
            if (typeof data.retryAfter === "number") resendAt = Date.now() + data.retryAfter * 1000;
            if (data.addressSaved) showForm(false);
            feedback.textContent = data.addressSaved && !response.ok
                ? "Adrese gaida apstiprinājumu. " + data.message : data.message;
            await refresh(view);
        } catch {
            feedback.textContent = "Neizdevās saņemt servera atbildi. Atver profilu vēlreiz.";
        } finally {
            busy = false;
            buttons();
        }
    }

    resend.addEventListener("click", () => submit("/resend", {}));
    form.addEventListener("submit", event => {
        event.preventDefault();
        if (!address.validity.valid || !password.value) {
            feedback.textContent = "Ievadi derīgu e-pasta adresi un pašreizējo paroli.";
            (address.validity.valid ? password : address).focus();
            return;
        }
        submit("/address", { email: address.value, currentPassword: password.value });
    });
})();
