/* Runs in <head> BEFORE the page paints, so there is no flash of the wrong theme.
   Keep this file tiny and load it WITHOUT defer/async. It is a separate file
   (not inline) so a strict Content-Security-Policy can stay in place. */
(function () {
    try {
        if (localStorage.getItem("theme") === "light") {
            document.documentElement.classList.add("light-mode");
        }
    } catch (e) { /* storage blocked: stay on the dark default */ }
})();
