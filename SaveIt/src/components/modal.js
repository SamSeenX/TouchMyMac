// Modal controllers for bookmark editing and folder creation

import { updateBookmark } from '../core/bookmarks.js'
import { createFolder } from '../core/folders.js'

export function setupModals({ editModal, folderModal, foldersProvider }) {
  const editTitle = document.getElementById('editTitle')
  const editUrl = document.getElementById('editUrl')
  const editFolder = document.getElementById('editFolder')
  const editLabels = document.getElementById('editLabels')
  const editBookmarkId = document.getElementById('editBookmarkId')
  const saveEditBtn = document.getElementById('saveEditBtn')
  const newFolderName = document.getElementById('newFolderName')
  const createFolderSubmit = document.getElementById('createFolderSubmit')

  function openEdit(bookmark) {
    editBookmarkId.value = bookmark.id
    editTitle.value = bookmark.title || ''
    editUrl.value = bookmark.url || ''
    editLabels.value = (bookmark.labels || []).join(', ')

    const folders = foldersProvider()
    editFolder.innerHTML = ''
    folders.forEach(f => {
      const opt = document.createElement('option')
      opt.value = f.id
      opt.textContent = f.name
      if (f.id === bookmark.folderId) opt.selected = true
      editFolder.appendChild(opt)
    })

    editModal.classList.add('open')
  }

  function closeEdit() {
    editModal.classList.remove('open')
  }

  function openFolder() {
    newFolderName.value = ''
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
    const labels = editLabels.value
      .split(',')
      .map(s => s.trim().replace(/^#/, ''))
      .filter(Boolean)

    await updateBookmark(id, {
      title: editTitle.value.trim(),
      url: editUrl.value.trim(),
      folderId: editFolder.value,
      labels
    })
    closeEdit()
  })

  createFolderSubmit.addEventListener('click', async () => {
    const name = newFolderName.value.trim()
    if (!name) return
    await createFolder(name)
    closeFolder()
  })

  // Close modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeEdit()
      closeFolder()
    }
  })

  return { openEdit, closeEdit, openFolder, closeFolder }
}
