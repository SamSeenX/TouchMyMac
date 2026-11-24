// Dashboard main orchestrator with drag-drop, density, batch and single thumbnail refresh

import { getBookmarks, filterBookmarks, updateBookmark, deleteBookmark } from './core/bookmarks.js'
import { getFolders } from './core/folders.js'
import { bus } from './core/bus.js'
import { renderCard } from './components/card.js'
import { setupSidebar } from './components/sidebar.js'
import { setupToolbar } from './components/toolbar.js'
import { setupModals } from './components/modal.js'
import { setupIoModal } from './components/io-modal.js'
import { setupBatchController } from './components/batch-controller.js'
import { fetchExternalThumbnail } from './utils/thumbnail-generator.js'

let allBookmarks = []
let allFolders = []
let activeState = { query: '', folderId: 'folder_all', sort: 'newest', density: 'lg' }

const elements = {
  grid: document.getElementById('bookmarkGrid'),
  emptyState: document.getElementById('emptyState'),
  viewTitle: document.getElementById('viewTitle'),
  viewCount: document.getElementById('viewCount'),
  searchInput: document.getElementById('searchInput'),
  densitySelect: document.getElementById('densitySelect'),
  sortSelect: document.getElementById('sortSelect'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  folderList: document.getElementById('folderList'),
  addFolderBtn: document.getElementById('addFolderBtn'),
  editModal: document.getElementById('editModal'),
  folderModal: document.getElementById('folderModal'),
  ioBtn: document.getElementById('ioBtn'),
  batchBtn: document.getElementById('batchThumbnailsBtn'),
  batchBanner: document.getElementById('batchProgressBanner'),
  batchText: document.getElementById('batchProgressText'),
  batchBar: document.getElementById('batchProgressBar'),
  cancelBatch: document.getElementById('cancelBatchBtn')
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
    onSelectFolder: (id) => { activeState.folderId = id; updateView() },
    onDropBookmark: async (bmId, folderId) => { await updateBookmark(bmId, { folderId }) }
  })

  const toolbar = setupToolbar({
    searchInput: elements.searchInput,
    densitySelect: elements.densitySelect,
    sortSelect: elements.sortSelect,
    themeToggleBtn: elements.themeToggleBtn,
    onSearch: (q) => { activeState.query = q; updateView() },
    onDensity: (d) => { activeState.density = d; applyDensity() },
    onSort: (s) => { activeState.sort = s; updateView() }
  })

  activeState.density = toolbar.currentDensity || 'lg'
  applyDensity()

  elements.addFolderBtn.addEventListener('click', () => modalController.openFolder())

  const ioModal = setupIoModal({
    modalEl: document.getElementById('ioModal'),
    foldersProvider: () => allFolders,
    bookmarksProvider: () => allBookmarks
  })
  elements.ioBtn.addEventListener('click', () => ioModal.open())

  setupBatchController({
    triggerBtn: elements.batchBtn,
    bannerEl: elements.batchBanner,
    textEl: elements.batchText,
    barEl: elements.batchBar,
    cancelBtn: elements.cancelBatch,
    bookmarksProvider: () => allBookmarks
  })

  setupGridActions()
  setupEventBusListeners()
  updateView()
}

function applyDensity() {
  elements.grid.classList.remove('density-lg', 'density-md', 'density-sm', 'density-list')
  elements.grid.classList.add(`density-${activeState.density}`)
}

function updateView() {
  const filtered = filterBookmarks(allBookmarks, activeState)
  sidebarController.update(allFolders, allBookmarks)

  let title = 'All Bookmarks'
  if (activeState.folderId === 'folder_recent') {
    title = 'Recently Added'
  } else if (activeState.folderId !== 'folder_all') {
    const f = allFolders.find(x => x.id === activeState.folderId)
    if (f) title = f.name
  }
  elements.viewTitle.textContent = title
  elements.viewCount.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`

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

    const refreshBtn = e.target.closest('[data-action="refresh"]')
    const copyBtn = e.target.closest('[data-action="copy"]')
    const editBtn = e.target.closest('[data-action="edit"]')
    const deleteBtn = e.target.closest('[data-action="delete"]')

    if (refreshBtn) {
      e.preventDefault()
      e.stopPropagation()
      refreshBtn.innerHTML = '&#9203;'
      const newThumb = await fetchExternalThumbnail(bookmark.url)
      if (newThumb) {
        await updateBookmark(id, { thumbnail: newThumb })
      }
      refreshBtn.innerHTML = '&#128260;'
    } else if (copyBtn) {
      e.preventDefault()
      e.stopPropagation()
      await navigator.clipboard.writeText(bookmark.url)
      copyBtn.innerHTML = '&#10003;'
      setTimeout(() => { copyBtn.innerHTML = '&#128203;' }, 1200)
    } else if (editBtn) {
      e.preventDefault()
      e.stopPropagation()
      modalController.openEdit(bookmark)
    } else if (deleteBtn) {
      e.preventDefault()
      e.stopPropagation()
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
