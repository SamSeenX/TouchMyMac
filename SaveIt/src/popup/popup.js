// Popup controller for capturing, reviewing and saving bookmarks

import { saveBookmark, findBookmarkByUrl } from '../core/bookmarks.js'
import { getFolders } from '../core/folders.js'
import { compressThumbnail, getFaviconUrl } from '../utils/capture.js'
import { createFolderDropdown } from '../components/dropdown.js'

let activeTab = null
let currentThumbnail = null
let folderDropdown = null

const elements = {
  statusBadge: document.getElementById('saveStatus'),
  previewImg: document.getElementById('previewImg'),
  previewPlaceholder: document.getElementById('previewPlaceholder'),
  titleInput: document.getElementById('bookmarkTitle'),
  folderContainer: document.getElementById('folderDropdownContainer'),
  saveBtn: document.getElementById('saveBtn'),
  viewAllBtn: document.getElementById('viewAllBtn')
}

async function initPopup() {
  setupEventListeners()
  const folders = await getFolders()

  folderDropdown = createFolderDropdown({
    container: elements.folderContainer,
    folders,
    selectedId: 'folder_general'
  })

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab || !tab.url) {
    elements.previewPlaceholder.textContent = 'Cannot bookmark this page'
    elements.saveBtn.disabled = true
    return
  }
  activeTab = tab
  elements.titleInput.value = tab.title || tab.url

  // Check if existing bookmark exists
  const existing = await findBookmarkByUrl(tab.url)
  if (existing) {
    elements.statusBadge.textContent = 'Already Saved'
    elements.titleInput.value = existing.title
    if (existing.folderId) folderDropdown.setValue(existing.folderId)
    if (existing.thumbnail) displayThumbnail(existing.thumbnail)
  }

  // Capture fresh viewport screenshot
  try {
    const rawCapture = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 75 })
    const compressed = await compressThumbnail(rawCapture, 480, 270)
    if (compressed) {
      currentThumbnail = compressed
      displayThumbnail(compressed)
    }
  } catch (err) {
    console.warn('Tab capture unavailable:', err)
    if (!currentThumbnail) {
      elements.previewPlaceholder.textContent = 'No preview available'
    }
  }
}

function displayThumbnail(src) {
  currentThumbnail = src
  elements.previewImg.src = src
  elements.previewImg.style.display = 'block'
  elements.previewPlaceholder.style.display = 'none'
}

function setupEventListeners() {
  elements.saveBtn.addEventListener('click', async () => {
    if (!activeTab) return
    elements.saveBtn.disabled = true
    elements.saveBtn.textContent = 'Saving...'

    await saveBookmark({
      url: activeTab.url,
      title: elements.titleInput.value.trim() || activeTab.title || activeTab.url,
      thumbnail: currentThumbnail,
      favicon: getFaviconUrl(activeTab.url, activeTab.favIconUrl),
      folderId: folderDropdown.getValue() || 'folder_general'
    })

    elements.saveBtn.textContent = 'Saved!'
    elements.saveBtn.style.backgroundColor = 'var(--success)'
    setTimeout(() => window.close(), 650)
  })

  elements.viewAllBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })
  })
}

document.addEventListener('DOMContentLoaded', initPopup)
