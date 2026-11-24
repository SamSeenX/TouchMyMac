# Chrome Web Store Listing Metadata

## Basic Information
* **Name**: SaveIt - Visual Bookmark Manager
* **Summary**: Save bookmarks with visual preview thumbnails, organize into folders, and import or export anywhere.
* **Category**: Productivity / Workflow

## Detailed Description
SaveIt is a clean, visual bookmark manager for your browser. Instead of boring text lists, SaveIt captures a visual preview thumbnail of every page you bookmark, making it effortless to find your favorite articles, designs, recipes, and research.

### Features
* Visual preview thumbnails captured automatically when saving
* Quick-save popup to edit titles and select folders
* Fullscreen dashboard with clean grid view and dark mode
* Multi-density layout support including compact list view
* Folder organization and drag-and-drop re-filing
* Universal import and export supporting all major browsers
* 100% private and offline-first with zero tracking

## Permissions Justification
* `tabs`: Required to read the active tab URL and title when you choose to bookmark a page.
* `activeTab`: Required to capture the visible tab viewport thumbnail when saving a bookmark.
* `storage`: Required to save user preferences such as theme and sort order.
* `unlimitedStorage`: Required to persist thumbnail images locally in IndexedDB without quota rejection.
* `contextMenus`: Required to provide right-click options for saving any page or link directly.
* `host_permissions` (`http://*/*`, `https://*/*`): Required to directly fetch webpage OpenGraph preview images locally without third-party proxy services.
