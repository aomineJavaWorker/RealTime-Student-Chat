(() => {
    const nav = document.querySelector('.privacy-contents');
    const toggle = nav.querySelector('.contents-toggle');
    const links = [...nav.querySelectorAll('ol a')];
    const headings = links.map(link => document.querySelector(link.hash));
    const desktop = matchMedia('(min-width: 992px)');

    toggle.hidden = false;
    toggle.addEventListener('click', () => {
        toggle.setAttribute('aria-expanded', String(toggle.getAttribute('aria-expanded') !== 'true'));
    });
    nav.addEventListener('click', event => {
        const link = event.target.closest('a');
        if (link && !desktop.matches) {
            toggle.setAttribute('aria-expanded', 'false');
            const heading = document.querySelector(link.hash);
            heading.tabIndex = -1;
            heading.focus({preventScroll: true});
        }
    });

    let current = -1;
    function updateCurrent() {
        const index = headings.findLastIndex(heading => heading.getBoundingClientRect().top <= 40);
        const atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
        let next = index;
        if (atEnd) {
            // The final headings can share a viewport at the scroll limit.
            const target = links.findIndex(link => link.hash === location.hash);
            next = target >= 0 && headings[target].getBoundingClientRect().top >= 0
                ? target : headings.length - 1;
        }
        if (current === next) return;
        links[current]?.removeAttribute('aria-current');
        links[next]?.setAttribute('aria-current', 'location');
        current = next;
    }
    window.addEventListener('scroll', updateCurrent, {passive: true});
    window.addEventListener('resize', updateCurrent);
    window.addEventListener('hashchange', updateCurrent);
    window.addEventListener('pageshow', updateCurrent);
    updateCurrent();
})();
