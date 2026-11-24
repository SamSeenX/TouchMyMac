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

const el = {
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
    editModal: el.editModal,
    folderModal: el.folderModal,
    foldersProvider: () => allFolders
  })

  sidebarController = setupSidebar({
    folderListEl: el.folderList,
    onSelectFolder: (id) => { activeState.folderId = id; updateView() },
    onDropBookmark: async (bmId, folderId) => { await updateBookmark(bmId, { folderId }) }
  })

  const toolbar = setupToolbar({
    searchInput: el.searchInput,
    densitySelect: el.densitySelect,
    sortSelect: el.sortSelect,
    themeToggleBtn: el.themeToggleBtn,
    onSearch: (q) => { activeState.query = q; updateView() },
    onDensity: (d) => { activeState.density = d; applyDensity() },
    onSort: (s) => { activeState.sort = s; updateView() }
  })

  activeState.density = toolbar.currentDensity || 'lg'
  applyDensity()

  el.addFolderBtn.addEventListener('click', () => modalController.openFolder())

  const ioModal = setupIoModal({
    modalEl: document.getElementById('ioModal'),
    foldersProvider: () => allFolders,
    bookmarksProvider: () => allBookmarks
  })
  el.ioBtn.addEventListener('click', () => ioModal.open())

  setupBatchController({
    triggerBtn: el.batchBtn,
    bannerEl: el.batchBanner,
    textEl: el.batchText,
    barEl: el.batchBar,
    cancelBtn: el.cancelBatch,
    bookmarksProvider: () => allBookmarks
  })

  setupGridActions()
  bus.on('bookmarks:changed', async () => { allBookmarks = await getBookmarks(); updateView() })
  bus.on('folders:changed', async () => { allFolders = await getFolders(); updateView() })
  updateView()
}

function applyDensity() {
  el.grid.className = `bookmarks-grid density-${activeState.density}`
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
  el.viewTitle.textContent = title
  el.viewCount.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`

  el.grid.innerHTML = ''
  if (filtered.length === 0) {
    el.emptyState.style.display = 'block'
  } else {
    el.emptyState.style.display = 'none'
    const fragment = document.createDocumentFragment()
    filtered.forEach(bm => fragment.appendChild(renderCard(bm)))
    el.grid.appendChild(fragment)
  }
}

function setupGridActions() {
  el.grid.addEventListener('click', async (e) => {
    const card = e.target.closest('.bookmark-card')
    if (!card) return
    const id = card.getAttribute('data-id')
    const bm = allBookmarks.find(b => b.id === id)
    if (!bm) return

    const openTrigger = e.target.closest('[data-action="open"]')
    const refreshBtn = e.target.closest('[data-action="refresh"]')
    const copyBtn = e.target.closest('[data-action="copy"]')
    const editBtn = e.target.closest('[data-action="edit"]')
    const deleteBtn = e.target.closest('[data-action="delete"]')

    if (openTrigger) {
      window.open(bm.url, '_blank')
    } else if (refreshBtn) {
      refreshBtn.innerHTML = '&#9203;'
      const thumb = await fetchExternalThumbnail(bm.url)
      if (thumb) await updateBookmark(id, { thumbnail: thumb })
      refreshBtn.innerHTML = '&#128260;'
    } else if (copyBtn) {
      await navigator.clipboard.writeText(bm.url)
      copyBtn.innerHTML = '&#10003;'
      setTimeout(() => { copyBtn.innerHTML = '&#128203;' }, 1200)
    } else if (editBtn) {
      modalController.openEdit(bm)
    } else if (deleteBtn && confirm(`Delete "${bm.title}"?`)) {
      await deleteBookmark(id)
    }
  })
}

document.addEventListener('DOMContentLoaded', init)
