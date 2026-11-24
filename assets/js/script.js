/* =========================================================
   DANASABE AHMAD — PORTFOLIO
   assets/js/script.js

   Load it at the end of every page with:
   <script src="assets/js/script.js" defer></script>
   (use ../assets/js/script.js inside /pages)

   Modules
   1. Theme (dark / light)
   2. Header (scrolled state, active link)
   3. Mobile menu
   4. Scroll reveal
   5. Scroll-to-top button
   6. Project filter
   7. Contact form
   8. Small utilities (year, safe external links)
========================================================= */

(() => {
    "use strict";

    /* ---------- helpers ---------- */

    const $ = (selector, scope = document) => scope.querySelector(selector);
    const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /** localStorage that never throws (private mode, blocked storage) */
    const store = {
        get(key) {
            try { return localStorage.getItem(key); } catch { return null; }
        },
        set(key, value) {
            try { localStorage.setItem(key, value); } catch { /* ignore */ }
        }
    };


    /* =====================================================
       1. THEME
       The tiny inline script in <head> sets the saved theme
       BEFORE the page paints (no white flash). This module
       handles the button, the icon and saving the choice.
    ===================================================== */

    function initTheme() {
        const THEME_KEY = "theme";
        const buttons = $$(".theme-toggle, [data-theme-toggle]");
        const themeMeta = $('meta[name="theme-color"]');

        const currentTheme = () =>
            root.classList.contains("light-mode") ? "light" : "dark";

        function paint(theme) {
            root.classList.toggle("light-mode", theme === "light");
            root.dataset.theme = theme;
            document.body.classList.remove("light-mode"); // old markup safety

            if (themeMeta) {
                themeMeta.setAttribute("content", theme === "light" ? "#f5f7fa" : "#080d12");
            }

            buttons.forEach((button) => {
                const goingTo = theme === "light" ? "dark" : "light";
                button.setAttribute("aria-label", `Switch to ${goingTo} theme`);
                button.setAttribute("title", `Switch to ${goingTo} theme`);
                button.setAttribute("aria-pressed", String(theme === "light"));

                // Font Awesome: sun while dark (click → light), moon while light
                const icon = $("i", button);
                if (icon) {
                    icon.classList.remove("fa-sun", "fa-moon");
                    icon.classList.add(theme === "light" ? "fa-moon" : "fa-sun");
                }
            });
        }

        function setTheme(theme, { animate = true } = {}) {
            if (animate && !prefersReducedMotion) {
                root.classList.add("theme-transition");
                window.setTimeout(() => root.classList.remove("theme-transition"), 450);
            }
            paint(theme);
            store.set(THEME_KEY, theme);
        }

        paint(currentTheme());

        buttons.forEach((button) => {
            button.addEventListener("click", () =>
                setTheme(currentTheme() === "light" ? "dark" : "light")
            );
        });

        // Follow the device only if the visitor never chose manually
        window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", (event) => {
            if (!store.get(THEME_KEY)) paint(event.matches ? "light" : "dark");
        });
    }


    /* =====================================================
       2. HEADER — scrolled state + current-page link
    ===================================================== */

    function initHeader() {
        // Mark the link of the page you are on (works from / and /pages/)
        const normalise = (path) =>
            path.replace(/index\.html$/i, "").replace(/\.html$/i, "").replace(/\/+$/, "") || "/";

        const here = normalise(location.pathname);

        $$(".nav-link, .nav-links a, .desktop-nav a, .mobile-link").forEach((link) => {
            const href = link.getAttribute("href");
            if (!href || href.startsWith("#") || /^(mailto|tel|https?:)/i.test(href)) return;

            const target = normalise(new URL(href, location.href).pathname);
            const isCurrent = target === here;

            link.classList.toggle("active", isCurrent);
            if (isCurrent) link.setAttribute("aria-current", "page");
            else link.removeAttribute("aria-current");
        });
    }


    /* =====================================================
       3. MOBILE MENU
    ===================================================== */

    function initMobileMenu() {
        const toggle = document.getElementById("menuToggle") || $(".menu-toggle");
        const menu = document.getElementById("mobileMenu") || $(".mobile-menu");
        if (!toggle || !menu) return;

        toggle.setAttribute("aria-controls", menu.id || "mobileMenu");
        toggle.setAttribute("aria-expanded", "false");

        function setMenu(open, { returnFocus = false } = {}) {
            toggle.classList.toggle("active", open);
            menu.classList.toggle("open", open);
            document.body.classList.toggle("menu-open", open);
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
            if (!open && returnFocus) toggle.focus();
        }

        const isOpen = () => menu.classList.contains("open");

        toggle.addEventListener("click", () => setMenu(!isOpen()));

        // Close: link click, Escape, click outside, resize to desktop
        menu.addEventListener("click", (event) => {
            if (event.target.closest("a")) setMenu(false);
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && isOpen()) setMenu(false, { returnFocus: true });
        });

        document.addEventListener("click", (event) => {
            if (isOpen() && !menu.contains(event.target) && !toggle.contains(event.target)) {
                setMenu(false);
            }
        });

        window.matchMedia("(min-width: 960px)").addEventListener("change", (event) => {
            if (event.matches) setMenu(false);
        });
    }


    /* =====================================================
       4. SCROLL REVEAL
       Cards fade up one after another. Once an element has
       finished animating, the helper classes are removed so
       hover effects work normally and nothing is left behind.
    ===================================================== */

    function initReveal() {
        if (prefersReducedMotion || !("IntersectionObserver" in window)) return;

        const selector = [
            ".section-header", ".section-heading",
            ".detail-card", ".featured-project", ".project-featured",
            ".project-card", ".service-card", ".experience-item",
            ".experience-card", ".focus-card", ".value-card",
            ".education-item", ".contact-card", ".contact-form-wrapper",
            ".direction-box", ".cta-card", ".projects-cta-inner",
            ".about-photo-card", ".about-story-content"
        ].join(",");

        // Hero blocks are visible straight away
        const items = $$(selector).filter(
            (el) => !el.closest(".page-hero, .projects-hero, .about-page-hero, .services-hero, .contact-hero, .hero")
        );

        // Stagger: position of the element among its revealed siblings
        const siblingIndex = new Map();
        items.forEach((el) => {
            const group = items.filter((other) => other.parentElement === el.parentElement);
            siblingIndex.set(el, group.indexOf(el));
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) return;

                    const el = entry.target;
                    observer.unobserve(el);

                    el.style.transitionDelay = `${Math.min(siblingIndex.get(el) || 0, 4) * 90}ms`;
                    el.classList.add("revealed");

                    el.addEventListener("transitionend", function done(event) {
                        if (event.propertyName !== "opacity") return;
                        el.style.transitionDelay = "";
                        el.classList.remove("reveal", "revealed");
                        el.removeEventListener("transitionend", done);
                    });
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
        );

        items.forEach((el) => {
            el.classList.add("reveal");
            observer.observe(el);
        });
    }


    /* =====================================================
       5. SCROLL HANDLING — header shadow + back-to-top
       One passive listener, throttled with requestAnimationFrame.
    ===================================================== */

    function initScroll() {
        const header = $(".site-header");
        const topButton = document.getElementById("scrollTopBtn") || $(".scroll-top");

        let ticking = false;

        function update() {
            const y = window.scrollY;
            if (header) header.classList.toggle("scrolled", y > 12);
            if (topButton) topButton.classList.toggle("show", y > 500);
            ticking = false;
        }

        window.addEventListener(
            "scroll",
            () => {
                if (!ticking) {
                    window.requestAnimationFrame(update);
                    ticking = true;
                }
            },
            { passive: true }
        );

        update();

        if (topButton) {
            topButton.addEventListener("click", () =>
                window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" })
            );
        }
    }


    /* =====================================================
       6. PROJECT FILTER
       data-filter="web" on the buttons,
       data-category="web mobile" on the cards (space or comma separated).
    ===================================================== */

    function initProjectFilter() {
        const buttons = $$(".project-filter");
        const cards = $$(".project-card[data-category]");
        if (!buttons.length || !cards.length) return;

        const grid = cards[0].parentElement;
        const FADE_MS = 220;

        // "No results" message (created once)
        const empty = document.createElement("p");
        empty.className = "projects-empty";
        empty.textContent = "No projects in this category yet — more are on the way.";
        empty.hidden = true;
        grid.after(empty);

        const categoriesOf = (card) =>
            (card.dataset.category || "").toLowerCase().split(/[\s,]+/).filter(Boolean);

        function show(card) {
            window.clearTimeout(card._hideTimer);
            card.hidden = false;
            void card.offsetWidth; // restart the transition
            card.classList.remove("is-hiding");
        }

        function hide(card) {
            card.classList.add("is-hiding");
            card._hideTimer = window.setTimeout(() => { card.hidden = true; }, FADE_MS);
        }

        function apply(filter) {
            const wanted = filter.toLowerCase();
            let visible = 0;

            cards.forEach((card) => {
                const match = wanted === "all" || categoriesOf(card).includes(wanted);
                if (match) { visible += 1; show(card); } else { hide(card); }
            });

            empty.hidden = visible > 0;
        }

        buttons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.classList.contains("active")));

            button.addEventListener("click", () => {
                buttons.forEach((other) => {
                    const active = other === button;
                    other.classList.toggle("active", active);
                    other.setAttribute("aria-pressed", String(active));
                });
                apply(button.dataset.filter || "all");
            });
        });
    }


    /* =====================================================
       7. CONTACT FORM
       - friendly validation
       - spam protection: honeypot + "too fast" check + 30s cool-down
       - sends in the background (fetch) and shows a success pop-up
       - if JavaScript fails, the normal form submit still works
    ===================================================== */

    function initContactForm() {
        const form = $(".contact-form");
        if (!form) return;

        const submit = $('button[type="submit"], input[type="submit"]', form);
        const submitLabel = submit ? submit.innerHTML : "";
        const openedAt = Date.now();
        const COOLDOWN_MS = 30000;
        const MIN_FILL_MS = 2500;

        const messages = {
            valueMissing: "This field is required.",
            typeMismatch: "Please enter a valid value.",
            tooShort: "That looks too short."
        };

        /* ---------- validation ---------- */

        function fieldError(field) {
            let note = field.parentElement.querySelector(".field-error");
            if (!note) {
                note = document.createElement("p");
                note.className = "field-error";
                note.setAttribute("role", "alert");
                field.insertAdjacentElement("afterend", note);
            }
            return note;
        }

        function validate(field) {
            const group = field.closest(".form-group");
            const note = fieldError(field);

            if (field.checkValidity()) {
                note.textContent = "";
                field.removeAttribute("aria-invalid");
                if (group) group.classList.remove("has-error");
                return true;
            }

            const type = Object.keys(messages).find((key) => field.validity[key]);
            note.textContent =
                type === "typeMismatch" && field.type === "email"
                    ? "Please enter a valid email address."
                    : messages[type] || field.validationMessage;
            field.setAttribute("aria-invalid", "true");
            if (group) group.classList.add("has-error");
            return false;
        }

        const isTrap = (field) => ["_gotcha", "botcheck", "bot-field"].includes(field.name);

        const fields = $$("input:not([type=hidden]):not([type=submit]), textarea, select", form)
            .filter((field) => !isTrap(field));

        form.setAttribute("novalidate", "");

        fields.forEach((field) => {
            field.addEventListener("blur", () => { if (field.value) validate(field); });
            field.addEventListener("input", () => {
                if (field.getAttribute("aria-invalid")) validate(field);
            });
        });

        /* ---------- status message under the form ---------- */

        let status = $(".form-status", form);
        if (!status) {
            status = document.createElement("p");
            status.className = "form-status";
            status.setAttribute("role", "status");
            status.hidden = true;
            (submit || form.lastElementChild).insertAdjacentElement("beforebegin", status);
        }

        function showStatus(text, type) {
            status.textContent = text;
            status.className = `form-status ${type}`;
            status.hidden = false;
        }

        function setBusy(busy) {
            if (!submit) return;
            submit.disabled = busy;
            if (busy) {
                submit.setAttribute("aria-busy", "true");
                submit.textContent = "Sending…";
            } else {
                submit.removeAttribute("aria-busy");
                submit.innerHTML = submitLabel;
            }
        }

        /* ---------- success pop-up ---------- */

        function showSuccessModal() {
            const previouslyFocused = document.activeElement;

            const modal = document.createElement("div");
            modal.className = "modal";
            modal.setAttribute("role", "dialog");
            modal.setAttribute("aria-modal", "true");
            modal.setAttribute("aria-labelledby", "modalTitle");
            modal.innerHTML = `
                <div class="modal-backdrop" data-close></div>
                <div class="modal-card">
                    <div class="success-check" aria-hidden="true">
                        <svg viewBox="0 0 52 52" width="64" height="64">
                            <circle class="check-circle" cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="2"/>
                            <path class="check-mark" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" d="M15 27l8 8 14-16"/>
                        </svg>
                    </div>
                    <h2 id="modalTitle">Message sent!</h2>
                    <p>Thank you for reaching out. I'll reply as soon as possible, usually within 24 hours.</p>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-primary" data-close>Done</button>
                    </div>
                </div>`;

            document.body.appendChild(modal);
            document.body.classList.add("modal-open");

            const closeButton = $("button[data-close]", modal);
            closeButton.focus();

            function close() {
                modal.classList.add("closing");
                document.body.classList.remove("modal-open");
                document.removeEventListener("keydown", onKey);
                window.setTimeout(() => modal.remove(), prefersReducedMotion ? 0 : 250);
                if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
            }

            function onKey(event) {
                if (event.key === "Escape") close();
                if (event.key === "Tab") { // keep focus inside the pop-up
                    event.preventDefault();
                    closeButton.focus();
                }
            }

            modal.addEventListener("click", (event) => {
                if (event.target.closest("[data-close]")) close();
            });
            document.addEventListener("keydown", onKey);
        }

        /* ---------- submit ---------- */

        // Netlify Forms (data-netlify) posts to "/"; Formspree / Web3Forms post to their own https:// address
        const isNetlify = form.hasAttribute("data-netlify");
        const canSendInBackground = isNetlify || /^https?:\/\//i.test(form.getAttribute("action") || "");

        form.addEventListener("submit", async (event) => {
            // 1. Honeypot: real people never see or fill this field
            const trap = $('input[name="_gotcha"], input[name="botcheck"], input[name="bot-field"]', form);
            if (trap && trap.value) { event.preventDefault(); return; }

            // 2. Normal validation
            const invalid = fields.filter((field) => !validate(field));
            if (invalid.length) {
                event.preventDefault();
                invalid[0].focus();
                return;
            }

            // 3. Bots submit instantly; people need a few seconds
            if (Date.now() - openedAt < MIN_FILL_MS) {
                event.preventDefault();
                showStatus("Please take a moment to review your message, then send again.", "error");
                return;
            }

            // 4. Cool-down between messages
            const last = Number(store.get("lastContactSent") || 0);
            if (Date.now() - last < COOLDOWN_MS) {
                event.preventDefault();
                showStatus("Your message was just sent. Please wait a little before sending another.", "error");
                return;
            }

            // No JS-friendly endpoint? Let the browser submit normally.
            if (!canSendInBackground) { setBusy(true); return; }

            event.preventDefault();
            status.hidden = true;
            setBusy(true);

            try {
                const request = isNetlify
                    ? {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: new URLSearchParams(new FormData(form)).toString()
                    }
                    : {
                        method: "POST",
                        headers: { Accept: "application/json" },
                        body: new FormData(form)
                    };

                const response = await fetch(isNetlify ? "/" : form.action, request);

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                store.set("lastContactSent", String(Date.now()));
                form.reset();
                fields.forEach((field) => field.removeAttribute("aria-invalid"));
                showSuccessModal();
            } catch (error) {
                showStatus(
                    "Sorry, your message could not be sent. Please check your connection and try again, or contact me on WhatsApp or email.",
                    "error"
                );
            } finally {
                setBusy(false);
            }
        });

        // Browser "back" button restores the page — reset the button
        window.addEventListener("pageshow", () => setBusy(false));
    }


    /* =====================================================
       8. SMALL UTILITIES
    ===================================================== */

    function initUtilities() {
        const year = document.getElementById("currentYear");
        if (year) year.textContent = String(new Date().getFullYear());

        // Safer external links
        $$('a[target="_blank"]').forEach((link) => {
            link.rel = [...new Set([...(link.rel || "").split(" "), "noopener", "noreferrer"])]
                .filter(Boolean)
                .join(" ");
        });
    }


    /* ---------- start ---------- */

    function init() {
        initTheme();
        initHeader();
        initMobileMenu();
        initScroll();
        initReveal();
        initProjectFilter();
        initContactForm();
        initUtilities();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();