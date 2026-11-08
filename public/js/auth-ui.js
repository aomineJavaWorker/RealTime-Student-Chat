(() => {
    const control = document.querySelector("[data-auth-switch]");
    if (!control) return;

    const current = control.querySelector('[aria-current="page"]');
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let navigationTimer;

    control.addEventListener("click", (event) => {
        const link = event.target.closest("a[data-auth-page]");
        // Keep native modified clicks, new tabs, downloads and reduced-motion navigation.
        if (!link || event.defaultPrevented || event.button !== 0 ||
            event.ctrlKey || event.metaKey || event.shiftKey || event.altKey ||
            (link.target && link.target !== "_self") || link.hasAttribute("download")) return;

        window.clearTimeout(navigationTimer);
        if (reducedMotion.matches || link === current) return;

        event.preventDefault();
        control.dataset.active = link.dataset.authPage;
        // Finish the 240 ms slide in this document, then use the real link destination.
        // The destination renders its active segment immediately, without a second animation.
        navigationTimer = window.setTimeout(() => window.location.assign(link.href), 250);
    });

    window.addEventListener("pagehide", () => window.clearTimeout(navigationTimer));
    window.addEventListener("pageshow", () => {
        // Restore the correct segment when this document returns from the back/forward cache.
        control.classList.add("auth-segments-reset");
        control.dataset.active = current.dataset.authPage;
        void control.offsetWidth;
        control.classList.remove("auth-segments-reset");
    });
})();
