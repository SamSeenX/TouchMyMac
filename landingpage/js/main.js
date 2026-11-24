// main.js - Theme toggle & interactive listeners for TouchMyMac landing page

class ThemeManager {
  constructor() {
    this.key = "vanilla_app_theme";
    this.theme = "dark";
  }

  init() {
    const saved = localStorage.getItem(this.key);
    this.theme = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    this.apply(this.theme);
    this.bind();
  }

  apply(t) {
    this.theme = t;
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(this.key, t);
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      btn.innerHTML = t === "dark" ? "☀️" : "🌙";
      btn.setAttribute("aria-label", `Switch to ${t === "dark" ? "light" : "dark"} mode`);
    }
  }

  toggle() {
    this.apply(this.theme === "dark" ? "light" : "dark");
  }

  bind() {
    const btn = document.getElementById("themeToggleBtn");
    if (btn) btn.addEventListener("click", () => this.toggle());
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ThemeManager().init();
});
