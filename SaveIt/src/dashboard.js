// Dashboard main orchestrator

import { getBookmarks, filterBookmarks, deleteBookmark } from './core/bookmarks.js'
import { getFolders } from './core/folders.js'
import { bus } from './core/bus.js'
import { renderCard } from './components/card.js'
import { setupSidebar } from './components/sidebar.js'
import { setupToolbar } from './components/toolbar.js'
import { setupModals } from './components/modal.js'
import { setupIoModal } from './components/io-modal.js'

let allBookmarks = []
let allFolders = []
let activeState = {
  query: '',
  folderId: 'folder_all',
  label: null,
  sort: 'newest'
}

const elements = {
  grid: document.getElementById('bookmarkGrid'),
  emptyState: document.getElementById('emptyState'),
  viewTitle: document.getElementById('viewTitle'),
  viewCount: document.getElementById('viewCount'),
  searchInput: document.getElementById('searchInput'),
  sortSelect: document.getElementById('sortSelect'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  folderList: document.getElementById('folderList'),
  tagCloud: document.getElementById('tagCloud'),
  addFolderBtn: document.getElementById('addFolderBtn'),
  editModal: document.getElementById('editModal'),
  folderModal: document.getElementById('folderModal'),
  ioBtn: document.getElementById('ioBtn')
}

let sidebarController = null
let modalController = null

async function init() {
  allFolders = await getFolders()
  allBookmarks = await getBookmarks()

  modalController = setupModals({
    editModal: elements.editModal,
    folderModal: elements.folderModal,
    foldersProvider: () => allFolders
  })

  sidebarController = setupSidebar({
    folderListEl: elements.folderList,
    tagCloudEl: elements.tagCloud,
    onSelectFolder: (folderId) => {
      activeState.folderId = folderId
      activeState.label = null
      updateView()
    },
    onSelectTag: (tag) => {
      activeState.label = tag
      updateView()
    }
  })

  setupToolbar({
    searchInput: elements.searchInput,
    sortSelect: elements.sortSelect,
    themeToggleBtn: elements.themeToggleBtn,
    onSearch: (q) => {
      activeState.query = q
      updateView()
    },
    onSort: (s) => {
      activeState.sort = s
      updateView()
    }
  })

  elements.addFolderBtn.addEventListener('click', () => modalController.openFolder())

  const ioModalController = setupIoModal({
    modalEl: document.getElementById('ioModal'),
    foldersProvider: () => allFolders,
    bookmarksProvider: () => allBookmarks
  })
  elements.ioBtn.addEventListener('click', () => ioModalController.open())
  setupGridActions()
  setupEventBusListeners()
  updateView()
}

function updateView() {
  const filtered = filterBookmarks(allBookmarks, activeState)
  sidebarController.update(allFolders, allBookmarks)

  // Title update
  let title = 'All Bookmarks'
  if (activeState.label) {
    title = `#${activeState.label}`
  } else if (activeState.folderId !== 'folder_all') {
    const f = allFolders.find(x => x.id === activeState.folderId)
    if (f) title = f.name
  }
  elements.viewTitle.textContent = title
  elements.viewCount.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`

  // Render cards
  elements.grid.innerHTML = ''
  if (filtered.length === 0) {
    elements.emptyState.style.display = 'block'
  } else {
    elements.emptyState.style.display = 'none'
    const fragment = document.createDocumentFragment()
    filtered.forEach(bm => fragment.appendChild(renderCard(bm)))
    elements.grid.appendChild(fragment)
  }
}

function setupGridActions() {
  elements.grid.addEventListener('click', async (e) => {
    const card = e.target.closest('.bookmark-card')
    if (!card) return
    const id = card.getAttribute('data-id')
    const bookmark = allBookmarks.find(b => b.id === id)
    if (!bookmark) return

    const openTrigger = e.target.closest('[data-action="open"]')
    const copyBtn = e.target.closest('[data-action="copy"]')
    const editBtn = e.target.closest('[data-action="edit"]')
    const deleteBtn = e.target.closest('[data-action="delete"]')

    if (openTrigger) {
      window.open(bookmark.url, '_blank')
    } else if (copyBtn) {
      await navigator.clipboard.writeText(bookmark.url)
      copyBtn.innerHTML = '&#10003;'
      setTimeout(() => { copyBtn.innerHTML = '&#128203;' }, 1200)
    } else if (editBtn) {
      modalController.openEdit(bookmark)
    } else if (deleteBtn) {
      if (confirm(`Delete "${bookmark.title}"?`)) {
        await deleteBookmark(id)
      }
    }
  })
}

function setupEventBusListeners() {
  bus.on('bookmarks:changed', async () => {
    allBookmarks = await getBookmarks()
    updateView()
  })

  bus.on('folders:changed', async () => {
    allFolders = await getFolders()
    updateView()
  })
}

document.addEventListener('DOMContentLoaded', init)
