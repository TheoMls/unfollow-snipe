// assets/js/theme.js

// 1. Instantly apply theme (from localStorage or OS system preference) before page renders
(function () {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.documentElement.setAttribute("data-theme", savedTheme);
    } else {
        // Fallback to system OS preference and set explicit data-theme
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.setAttribute("data-theme", systemDark ? "dark" : "light");
    }
})();

// 2. Theme switcher function
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateToggleIcon();
}

// 3. Inject button & set correct icon on load
document.addEventListener("DOMContentLoaded", () => {
    injectThemeButton();
    updateToggleIcon();
});

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

function updateToggleIcon() {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;

    const isDark = document.documentElement.getAttribute("data-theme") === "dark";

    // Show Sun icon in Dark Mode (click to switch to Light)
    // Show Moon icon in Light Mode (click to switch to Dark)
    btn.innerHTML = isDark
        ? '<img src="assets/img/sun.svg" alt="Switch to Light Mode" class="theme-icon">'
        : '<img src="assets/img/moon.svg" alt="Switch to Dark Mode" class="theme-icon">';
}