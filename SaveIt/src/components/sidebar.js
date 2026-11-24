// Sidebar component managing folder tree, smart views and drag-drop re-filing

import { escapeHtml } from '../utils/sanitize.js'

export function setupSidebar({ folderListEl, onSelectFolder, onDropBookmark }) {
  let activeFolderId = 'folder_all'

  function render(folders, bookmarks) {
    folderListEl.innerHTML = ''

    // 1. Smart Folders (All Bookmarks & Recently Added)
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    const recentCount = bookmarks.filter(b => (b.createdAt || 0) >= sevenDaysAgo).length

    appendFolderItem({
      id: 'folder_all',
      name: 'All Bookmarks',
      icon: '&#128193;',
      count: bookmarks.length,
      isSystem: true
    })

    appendFolderItem({
      id: 'folder_recent',
      name: 'Recently Added',
      icon: '&#9200;',
      count: recentCount,
      isSystem: true
    })

    // 2. Hierarchical User Folders
    const rootFolders = folders.filter(f => !f.parentId)
    const childMap = new Map()
    folders.forEach(f => {
      if (f.parentId) {
        if (!childMap.has(f.parentId)) childMap.set(f.parentId, [])
        childMap.get(f.parentId).push(f)
      }
    })

    rootFolders.forEach(rf => {
      renderFolderTree(rf, childMap, bookmarks, 0)
    })
  }

  function renderFolderTree(folder, childMap, bookmarks, level) {
    const count = bookmarks.filter(b => b.folderId === folder.id).length
    appendFolderItem({
      id: folder.id,
      name: folder.name,
      icon: '&#128194;',
      count,
      color: folder.color || '#6366f1',
      level
    })

    const children = childMap.get(folder.id) || []
    children.forEach(child => {
      renderFolderTree(child, childMap, bookmarks, level + 1)
    })
  }

  function appendFolderItem({ id, name, icon, count, color, level = 0, isSystem = false }) {
    const li = document.createElement('li')
    const isActive = activeFolderId === id
    li.className = `sidebar-item ${isActive ? 'active' : ''}`
    li.setAttribute('data-id', id)
    if (level > 0) li.style.paddingLeft = `${10 + level * 16}px`

    const colorStyle = color ? `style="color: ${color}"` : ''
    li.innerHTML = `
      <div class="item-left">
        <span class="item-icon" ${colorStyle}>${icon}</span>
        <span class="item-name">${escapeHtml(name)}</span>
      </div>
      <span class="item-badge">${count}</span>
    `

    // Drag-over drop target listeners
    if (!isSystem || id !== 'folder_all') {
      li.addEventListener('dragover', (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        li.classList.add('drag-over')
      })

      li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over')
      })

      li.addEventListener('drop', (e) => {
        e.preventDefault()
        li.classList.remove('drag-over')
        const bookmarkId = e.dataTransfer.getData('text/plain')
        if (bookmarkId && onDropBookmark) {
          onDropBookmark(bookmarkId, id)
        }
      })
    }

    folderListEl.appendChild(li)
  }

  folderListEl.addEventListener('click', (e) => {
    const item = e.target.closest('.sidebar-item')
    if (item) {
      activeFolderId = item.getAttribute('data-id')
      onSelectFolder(activeFolderId)
    }
  })

  return {
    update(folders, bookmarks) {
      render(folders, bookmarks)
    },
    getActive() {
      return activeFolderId
    }
  }
}
