// Ielādē galvenē pirms stiliem, lai jau pirmajā kadrā parādītu izvēlēto tēmu.
(() => {
    const key = "student-chat-theme";
    const lifetime = 30 * 24 * 60 * 60 * 1000;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    let preference = null;
    let expiresAt = 0;
    let expiryTimer;
    let dialog;

    const isTheme = value => value === "light" || value === "dark";

    function read(storage) {
        try {
            return window[storage].getItem(key);
        } catch {
            return null;
        }
    }

    function write(storage, value) {
        try {
            if (value === null) window[storage].removeItem(key);
            else window[storage].setItem(key, value);
            return true;
        } catch {
            return false;
        }
    }

    function load() {
        const raw = read("localStorage");
        let saved;
        if (raw !== null) {
            try {
                saved = JSON.parse(raw);
            } catch {
                // Vecajam ierakstam nebija ne termiņa, ne lietotāja izvēles to saglabāt.
            }
        }
        if (isTheme(saved?.theme) && Number.isSafeInteger(saved.expiresAt) && saved.expiresAt > Date.now()) {
            preference = saved.theme;
            expiresAt = saved.expiresAt;
            write("sessionStorage", null);
        } else {
            if (raw !== null) write("localStorage", null);
            const temporary = read("sessionStorage");
            preference = isTheme(temporary) ? temporary : null;
            expiresAt = 0;
        }
        render();
    }

    function render() {
        const theme = preference || (systemTheme.matches ? "dark" : "light");
        document.documentElement.dataset.bsTheme = theme;
        document.documentElement.style.colorScheme = theme;
        document.querySelector('meta[name="theme-color"]')?.setAttribute(
            "content", theme === "dark" ? "#0f172a" : "#f3f6fb"
        );
        if (dialog) {
            dialog.querySelector(`[value="${preference || "system"}"]`).checked = true;
            dialog.querySelector("#rememberTheme").checked = Boolean(expiresAt);
            dialog.querySelector("#rememberTheme").disabled = !preference;
            dialog.querySelector("#theme-hint").textContent = expiresAt
                ? "Tēma tiks saglabāta šajā ierīcē 30 dienas."
                : "Tēma tiks saglabāta tikai šajā cilnē.";
        }
        clearTimeout(expiryTimer);
        if (expiresAt) {
            // 30 dienas pārsniedz viena pārlūka taimera maksimālo intervālu.
            expiryTimer = setTimeout(load, Math.min(expiresAt - Date.now(), 2147483647));
        }
    }

    function changePreference() {
        if (expiresAt && expiresAt <= Date.now()) {
            load();
            return;
        }
        const choice = dialog.querySelector('input[name="theme"]:checked').value;
        preference = isTheme(choice) ? choice : null;
        const remember = preference && dialog.querySelector("#rememberTheme").checked;
        let success;
        if (remember) {
            const deadline = expiresAt || Date.now() + lifetime;
            success = write("localStorage", JSON.stringify({ theme: preference, expiresAt: deadline }));
            expiresAt = success ? deadline : 0;
            write("sessionStorage", success ? null : preference);
        } else {
            const removed = write("localStorage", null);
            success = write("sessionStorage", preference) && removed;
            expiresAt = 0;
        }
        dialog.querySelector('[role="status"]').textContent = success ? "" :
            "Pārlūka krātuve nav pieejama. Tēmas izvēli nevarēja saglabāt.";
        render();
    }

    load();
    document.addEventListener("DOMContentLoaded", () => {
        const button = document.querySelector("[data-theme-toggle]");
        if (!button) return;
        dialog = document.createElement("dialog");
        dialog.className = "theme-settings";
        dialog.setAttribute("aria-labelledby", "theme-title");
        dialog.innerHTML = `
            <form method="dialog">
                <div class="theme-heading">
                    <h2 id="theme-title" class="h5 mb-0">Tēmas iestatījumi</h2>
                    <button type="submit" class="btn-close" aria-label="Aizvērt tēmas iestatījumus"></button>
                </div>
                <fieldset class="theme-options">
                    <legend class="visually-hidden">Izvēlies tēmu</legend>
                    <label>
                        <input type="radio" class="visually-hidden" name="theme" value="system">
                        <span class="theme-option">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M12 17v3.5M8 20.5h8"/></svg>
                            Sistēmas tēma
                        </span>
                    </label>
                    <label>
                        <input type="radio" class="visually-hidden" name="theme" value="light">
                        <span class="theme-option">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5"/></svg>
                            Gaišā tēma
                        </span>
                    </label>
                    <label>
                        <input type="radio" class="visually-hidden" name="theme" value="dark">
                        <span class="theme-option">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 13.3A8.5 8.5 0 0 1 10.7 3.5a8.5 8.5 0 1 0 9.8 9.8Z"/></svg>
                            Tumšā tēma
                        </span>
                    </label>
                </fieldset>
                <div class="remember-choice">
                    <input type="checkbox" class="form-check-input" id="rememberTheme" aria-describedby="theme-hint">
                    <label for="rememberTheme">Atcerēties tēmu 30 dienas</label>
                    <p id="theme-hint"></p>
                </div>
                <p role="status" class="form-text m-0"></p>
                <button type="submit" class="btn btn-primary theme-done">Aizvērt</button>
            </form>`;
        document.body.append(dialog);
        button.setAttribute("aria-label", "Tēmas iestatījumi");
        button.setAttribute("aria-haspopup", "dialog");
        button.title = "Tēmas iestatījumi";
        button.hidden = false;
        button.addEventListener("click", () => dialog.showModal());
        dialog.addEventListener("change", changePreference);
        render();
    });

    systemTheme.addEventListener("change", render);
    window.addEventListener("storage", event => {
        if (event.key === key || event.key === null) load();
    });
    window.addEventListener("pageshow", event => {
        if (event.persisted) load();
    });
})();
