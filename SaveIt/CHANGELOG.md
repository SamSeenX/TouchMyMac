# CHANGELOG

## [Unreleased] - 2026-11-24

### Added
* Quick-tab session capture for card refreshes using real browser session, cookies, and Cloudflare clearance with automatic focus restoration
* Real visual webpage screenshot capture engine via headless rendering with automatic pre-warm retry
* Button state locking and busy spinner during single card thumbnail refreshes
* 100% Silent headless thumbnail engine: zero window popups or flashing windows
* In-memory background service worker banner extraction with chunked base64 conversion
* Automatic branded card generator on local canvas for websites without preview banners
* Batch thumbnail generator queue with live progress bar and stop control
* Force regenerate option to re-fetch all thumbnails across imported bookmarks
* Single-item thumbnail refresh button on every bookmark card
* Native anchor link integration for middle-click and right-click browser navigation
* External drag-and-drop support with URI list payloads
* Custom stylized folder dropdown component with inline "+ Create Folder" input
* Drag and drop organization: drag bookmark cards directly onto sidebar folders to re-file
* Smart "Recently Added" view in sidebar filtering bookmarks saved within the last 7 days
* Four view density modes: Large previews, Medium previews, Small previews, and List view with tiny thumbnails
* Full nested subfolder hierarchy import preservation from browser Netscape HTML files
* Pure folder-centric architecture with tags removed for a cleaner workflow
* Strict sub-200-line modular architecture across all JavaScript and CSS files

### Fixed
* Removed all `chrome.windows.create` popups to eliminate window flashing
* Removed inline `onerror` attribute in `card.js` to eliminate Manifest V3 CSP violation errors
* Added `host_permissions` in `manifest.json` for origin web requests
* Added missing `contextMenus` permission to `manifest.json` for right-click saving
* Fixed inner anchor and image drag collision in `card.js` using `draggable="false"`
