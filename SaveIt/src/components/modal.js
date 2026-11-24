// Modal controllers for bookmark editing and folder creation

import { updateBookmark } from '../core/bookmarks.js'
import { createFolder } from '../core/folders.js'
import { createFolderDropdown } from './dropdown.js'

export function setupModals({ editModal, folderModal, foldersProvider }) {
  const editTitle = document.getElementById('editTitle')
  const editUrl = document.getElementById('editUrl')
  const editFolderContainer = document.getElementById('editFolderContainer')
  const editBookmarkId = document.getElementById('editBookmarkId')
  const saveEditBtn = document.getElementById('saveEditBtn')
  const newFolderName = document.getElementById('newFolderName')
  const newFolderParent = document.getElementById('newFolderParent')
  const createFolderSubmit = document.getElementById('createFolderSubmit')

  let folderDropdown = null

  function openEdit(bookmark) {
    editBookmarkId.value = bookmark.id
    editTitle.value = bookmark.title || ''
    editUrl.value = bookmark.url || ''

    const folders = foldersProvider()
    folderDropdown = createFolderDropdown({
      container: editFolderContainer,
      folders,
      selectedId: bookmark.folderId || 'folder_general'
    })

    editModal.classList.add('open')
  }

  function closeEdit() {
    editModal.classList.remove('open')
  }

  function openFolder(presetParentId = null) {
    newFolderName.value = ''
    if (newFolderParent) {
      newFolderParent.innerHTML = '<option value="">(None - Top Level)</option>'
      const folders = foldersProvider()
      folders.forEach(f => {
        if (!f.system || f.id === 'folder_general') {
          const opt = document.createElement('option')
          opt.value = f.id
          opt.textContent = f.name
          if (f.id === presetParentId) opt.selected = true
          newFolderParent.appendChild(opt)
        }
      })
    }
    folderModal.classList.add('open')
    setTimeout(() => newFolderName.focus(), 50)
  }

  function closeFolder() {
    folderModal.classList.remove('open')
  }

  document.getElementById('closeEditModal').addEventListener('click', closeEdit)
  document.getElementById('cancelEditBtn').addEventListener('click', closeEdit)
  document.getElementById('closeFolderModal').addEventListener('click', closeFolder)
  document.getElementById('cancelFolderBtn').addEventListener('click', closeFolder)

  saveEditBtn.addEventListener('click', async () => {
    const id = editBookmarkId.value
    if (!id) return

    await updateBookmark(id, {
      title: editTitle.value.trim(),
      url: editUrl.value.trim(),
      folderId: folderDropdown ? folderDropdown.getValue() : 'folder_general'
    })
    closeEdit()
  })

  createFolderSubmit.addEventListener('click', async () => {
    const name = newFolderName.value.trim()
    if (!name) return
    const parentId = newFolderParent ? (newFolderParent.value || null) : null
    await createFolder(name, parentId)
    closeFolder()
  })

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEdit()
      closeFolder()
    }
  })

  return { openEdit, closeEdit, openFolder, closeFolder }
}
