// assets/js/theme.js

// 1. Immediately apply saved theme before DOM renders (prevents white flash)
(function () {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.documentElement.setAttribute("data-theme", savedTheme);
    }
})();

// 2. Global theme switcher
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const isDark = currentTheme === "dark" ||
        (!currentTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const newTheme = isDark ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateToggleIcon();
}

// 3. Auto-inject circular toggle button and update icon when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    injectThemeButton();
    updateToggleIcon();
});

// Helper: Auto-create and insert the button directly into body
function injectThemeButton() {
    if (document.getElementById("theme-toggle-btn")) return;

    const btn = document.createElement("button");
    btn.id = "theme-toggle-btn";
    btn.className = "theme-btn";
    btn.type = "button";
    btn.setAttribute("aria-label", "Toggle dark/light mode");
    btn.addEventListener("click", toggleTheme);

    document.body.appendChild(btn);
}

// Helper: Update emoji icon inside the circle
function updateToggleIcon() {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;

    const currentTheme = document.documentElement.getAttribute("data-theme");
    const isDark = currentTheme === "dark" ||
        (!currentTheme && window.matchMedia("(prefers-color-scheme: dark)").matches);

    btn.textContent = isDark ? "☀️" : "🌙";
}