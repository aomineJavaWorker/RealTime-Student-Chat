// Load synchronously in <head>, before styles, to apply the theme before paint.
// Shared with any future page that loads theme.css and uses data-theme-toggle.
(() => {
    const storageKey = "student-chat-theme";
    const root = document.documentElement;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    let preference = readPreference();

    function readPreference() {
        try {
            const value = localStorage.getItem(storageKey);
            return value === "light" || value === "dark" ? value : null;
        } catch {
            return null;
        }
    }

    function applyTheme() {
        const theme = preference || (systemTheme.matches ? "dark" : "light");
        root.dataset.bsTheme = theme;
        root.style.colorScheme = theme;
        document.querySelector('meta[name="theme-color"]')?.setAttribute(
            "content", theme === "dark" ? "#0f172a" : "#f3f6fb"
        );
        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            const label = theme === "dark" ? "Ieslēgt gaišo tēmu" : "Ieslēgt tumšo tēmu";
            button.setAttribute("aria-label", label);
            button.title = label;
        });
    }

    applyTheme();

    document.addEventListener("DOMContentLoaded", () => {
        document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
            button.hidden = false;
            button.addEventListener("click", () => {
                preference = root.dataset.bsTheme === "dark" ? "light" : "dark";
                try {
                    localStorage.setItem(storageKey, preference);
                } catch {
                    // Theme switching still works when browser storage is unavailable.
                }
                applyTheme();
            });
        });
        applyTheme();
    });

    systemTheme.addEventListener("change", () => {
        if (!preference) applyTheme();
    });

    window.addEventListener("storage", (event) => {
        if (event.key === storageKey || event.key === null) {
            preference = readPreference();
            applyTheme();
        }
    });

    window.addEventListener("pageshow", (event) => {
        if (event.persisted) {
            preference = readPreference();
            applyTheme();
        }
    });
})();
