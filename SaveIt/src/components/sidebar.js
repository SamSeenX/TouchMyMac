// Sidebar component managing folders list, tag cloud and active selection

import { escapeHtml } from '../utils/sanitize.js'
import { extractLabels } from '../core/folders.js'

export function setupSidebar({ folderListEl, tagCloudEl, onSelectFolder, onSelectTag }) {
  let activeFolderId = 'folder_all'
  let activeTag = null

  function renderFolders(folders, bookmarks) {
    folderListEl.innerHTML = ''

    // All Bookmarks entry
    const allItem = document.createElement('li')
    allItem.className = `sidebar-item ${activeFolderId === 'folder_all' && !activeTag ? 'active' : ''}`
    allItem.setAttribute('data-id', 'folder_all')
    allItem.innerHTML = `
      <div class="item-left">
        <span>&#128193;</span>
        <span>All Bookmarks</span>
      </div>
      <span class="item-badge">${bookmarks.length}</span>
    `
    folderListEl.appendChild(allItem)

    // User folders
    folders.forEach(folder => {
      const count = bookmarks.filter(b => b.folderId === folder.id).length
      const li = document.createElement('li')
      li.className = `sidebar-item ${activeFolderId === folder.id && !activeTag ? 'active' : ''}`
      li.setAttribute('data-id', folder.id)
      li.innerHTML = `
        <div class="item-left">
          <span style="color: ${folder.color || 'var(--primary)'}">&#128194;</span>
          <span>${escapeHtml(folder.name)}</span>
        </div>
        <span class="item-badge">${count}</span>
      `
      folderListEl.appendChild(li)
    })
  }

  function renderTags(bookmarks) {
    tagCloudEl.innerHTML = ''
    const tags = extractLabels(bookmarks)

    if (tags.length === 0) {
      tagCloudEl.innerHTML = '<span style="font-size:11px;color:var(--text-dim)">No tags yet</span>'
      return
    }

    tags.forEach(t => {
      const chip = document.createElement('span')
      chip.className = `tag-filter-chip ${activeTag === t.name ? 'active' : ''}`
      chip.setAttribute('data-tag', t.name)
      chip.textContent = `#${t.name} (${t.count})`
      tagCloudEl.appendChild(chip)
    })
  }

  // Event delegation
  folderListEl.addEventListener('click', (e) => {
    const item = e.target.closest('.sidebar-item')
    if (item) {
      activeFolderId = item.getAttribute('data-id')
      activeTag = null
      onSelectFolder(activeFolderId)
    }
  })

  tagCloudEl.addEventListener('click', (e) => {
    const chip = e.target.closest('.tag-filter-chip')
    if (chip) {
      const tag = chip.getAttribute('data-tag')
      activeTag = activeTag === tag ? null : tag
      onSelectTag(activeTag)
    }
  })

  return {
    update(folders, bookmarks) {
      renderFolders(folders, bookmarks)
      renderTags(bookmarks)
    },
    getActive() {
      return { activeFolderId, activeTag }
    }
  }
}
