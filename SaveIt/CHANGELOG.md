# CHANGELOG

## [Unreleased] - 2026-11-24

### Added
* Batch thumbnail generator queue with live progress bar and stop control
* Force regenerate option to re-fetch all thumbnails across imported bookmarks
* Single-item thumbnail refresh button on every bookmark card
* Pre-warm rendering delay ensuring mshots delivers full screenshots instead of placeholder logos
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
* Added missing `contextMenus` permission to `manifest.json` for right-click saving
* Fixed inner anchor and image drag collision in `card.js` using `draggable="false"`
* Fixed mshots URL formatting by ensuring trailing slash and raw URL format to avoid 403 errors
