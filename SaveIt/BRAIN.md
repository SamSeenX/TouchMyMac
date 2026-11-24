# BRAIN: Architectural Record and Philosophy

## Philosophy and Core Tenets

* **Privacy First**: All bookmarks, thumbnails, and labels remain 100% on the user device in IndexedDB.
* **Zero Dependencies**: Pure standard Web APIs (ES6 modules, CSS Custom Properties, OffscreenCanvas, IndexedDB).
* **Speed and Efficiency**: Thumbnails are compressed to WebP blobs under 20KB each, allowing thousands of bookmarks to load instantly without memory strain.
* **Strict Modularity**: Every JavaScript and CSS file is capped strictly under 200 lines to ensure clean cognitive boundaries and high maintainability.

## Data Layer Architecture

* **Database Name**: `saveit_db` (Version 1)
* **Object Stores**:
  * `bookmarks`: Indexed by `id`, `url`, `folderId`, `createdAt`. Stores titles, descriptions, URLs, favicon, tags array, and WebP thumbnail blob.
  * `folders`: Indexed by `id`, `name`, `parentId`. Stores folder hierarchy and custom colors.
  * `settings`: Stores user theme (light/dark/system), sort preferences, and layout mode (grid/list).
