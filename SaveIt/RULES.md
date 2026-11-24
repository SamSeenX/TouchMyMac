# RULES: Project Specific Constraints

* **Strict 200-Line Limit**: Every single code file must remain under 200 lines. Split files proactively at ~180 lines.
* **Zero Third-Party Bloat**: No npm runtime dependencies, no frameworks, no Tailwind CSS.
* **Pure Vanilla Standards**: Standard ES6 modules, CSS variables, native IndexedDB with Promise wrappers.
* **Manifest V3 Rules**:
  * No eval or inline scripts in extension pages.
  * Use `chrome.action` and standard modern extension APIs.
  * OffscreenCanvas for image resizing.
  * Real image files for icons (16px, 48px, 128px).
* **Text Writing Standards**: Never use semicolons in text writing and avoid mdashes.
