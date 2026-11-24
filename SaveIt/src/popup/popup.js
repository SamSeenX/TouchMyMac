// Popup controller for capturing, reviewing and saving bookmarks

import { saveBookmark, findBookmarkByUrl } from '../core/bookmarks.js'
import { getFolders, createFolder } from '../core/folders.js'
import { compressThumbnail, getFaviconUrl } from '../utils/capture.js'
import { escapeHtml } from '../utils/sanitize.js'

let activeTab = null
let currentThumbnail = null
const currentTags = new Set()

const elements = {
  statusBadge: document.getElementById('saveStatus'),
  previewImg: document.getElementById('previewImg'),
  previewPlaceholder: document.getElementById('previewPlaceholder'),
  titleInput: document.getElementById('bookmarkTitle'),
  folderSelect: document.getElementById('folderSelect'),
  tagsContainer: document.getElementById('tagsContainer'),
  tagInput: document.getElementById('tagInput'),
  saveBtn: document.getElementById('saveBtn'),
  viewAllBtn: document.getElementById('viewAllBtn')
}

async function initPopup() {
  setupEventListeners()
  await populateFolders()

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
    if (existing.folderId) elements.folderSelect.value = existing.folderId
    if (Array.isArray(existing.labels)) {
      existing.labels.forEach(t => currentTags.add(t))
      renderTags()
    }
    if (existing.thumbnail) {
      displayThumbnail(existing.thumbnail)
    }
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

async function populateFolders() {
  const folders = await getFolders()
  elements.folderSelect.innerHTML = ''
  folders.forEach(f => {
    const opt = document.createElement('option')
    opt.value = f.id
    opt.textContent = f.name
    elements.folderSelect.appendChild(opt)
  })
}

function renderTags() {
  const existingChips = elements.tagsContainer.querySelectorAll('.tag-chip')
  existingChips.forEach(c => c.remove())

  currentTags.forEach(tag => {
    const chip = document.createElement('span')
    chip.className = 'tag-chip'
    chip.innerHTML = `${escapeHtml(tag)} <span class="tag-remove" data-tag="${escapeHtml(tag)}">&times;</span>`
    elements.tagsContainer.insertBefore(chip, elements.tagInput)
  })
}

function setupEventListeners() {
  elements.tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      const val = elements.tagInput.value.trim().replace(/^#/, '')
      if (val && !currentTags.has(val)) {
        currentTags.add(val)
        renderTags()
        elements.tagInput.value = ''
      }
    }
  })

  elements.tagsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.tag-remove')
    if (removeBtn) {
      const tag = removeBtn.getAttribute('data-tag')
      currentTags.delete(tag)
      renderTags()
    }
  })

  elements.saveBtn.addEventListener('click', async () => {
    if (!activeTab) return
    elements.saveBtn.disabled = true
    elements.saveBtn.textContent = 'Saving...'

    await saveBookmark({
      url: activeTab.url,
      title: elements.titleInput.value.trim() || activeTab.title || activeTab.url,
      thumbnail: currentThumbnail,
      favicon: getFaviconUrl(activeTab.url, activeTab.favIconUrl),
      folderId: elements.folderSelect.value || 'folder_general',
      labels: Array.from(currentTags)
    })

    elements.saveBtn.textContent = 'Saved!'
    elements.saveBtn.style.backgroundColor = 'var(--success)'
    setTimeout(() => window.close(), 700)
  })

  elements.viewAllBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') })
  })
}

document.addEventListener('DOMContentLoaded', initPopup)
