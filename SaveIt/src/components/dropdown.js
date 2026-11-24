// Stylized custom folder dropdown with inline new folder creation

import { escapeHtml } from '../utils/sanitize.js'
import { createFolder } from '../core/folders.js'

export function createFolderDropdown({ container, folders, selectedId, onChange }) {
  let currentFolders = [...folders]
  let currentSelectedId = selectedId || (currentFolders[0] ? currentFolders[0].id : '')
  let isOpen = false

  container.classList.add('custom-dropdown-container')

  function render() {
    const selected = currentFolders.find(f => f.id === currentSelectedId) || currentFolders[0]
    const label = selected ? selected.name : 'Select Folder'
    const color = selected ? selected.color || '#6366f1' : '#6366f1'

    container.innerHTML = `
      <button type="button" class="dropdown-trigger" aria-haspopup="listbox">
        <div class="trigger-left">
          <span class="folder-dot" style="background-color: ${color}"></span>
          <span class="trigger-label">${escapeHtml(label)}</span>
        </div>
        <span class="trigger-arrow">&#9662;</span>
      </button>

      <div class="dropdown-menu ${isOpen ? 'open' : ''}" role="listbox">
        <div class="dropdown-list">
          ${currentFolders.map(f => {
            const isSel = f.id === currentSelectedId
            const indent = f.parentId ? 'padding-left: 24px;' : ''
            return `
              <div class="dropdown-item ${isSel ? 'selected' : ''}" data-id="${f.id}" style="${indent}">
                <span class="folder-dot" style="background-color: ${f.color || '#6366f1'}"></span>
                <span class="item-text">${escapeHtml(f.name)}</span>
                ${isSel ? '<span class="item-check">&#10003;</span>' : ''}
              </div>
            `
          }).join('')}
        </div>
        <div class="dropdown-create-row">
          <input type="text" class="new-folder-input" placeholder="+ New folder name..." maxlength="30">
          <button type="button" class="btn-create-folder">Add</button>
        </div>
      </div>
    `
    bindEvents()
  }

  function bindEvents() {
    const trigger = container.querySelector('.dropdown-trigger')
    const menu = container.querySelector('.dropdown-menu')
    const createInput = container.querySelector('.new-folder-input')
    const createBtn = container.querySelector('.btn-create-folder')

    trigger.addEventListener('click', (e) => {
      e.stopPropagation()
      toggleMenu()
    })

    container.querySelectorAll('.dropdown-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation()
        const id = item.getAttribute('data-id')
        currentSelectedId = id
        closeMenu()
        render()
        if (onChange) onChange(id)
      })
    })

    async function handleCreate() {
      const name = createInput.value.trim()
      if (!name) return
      try {
        const created = await createFolder(name)
        currentFolders.push(created)
        currentSelectedId = created.id
        closeMenu()
        render()
        if (onChange) onChange(created.id)
      } catch (err) {
        console.error('Failed to create folder:', err)
      }
    }

    createBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      handleCreate()
    })

    createInput.addEventListener('keydown', (e) => {
      e.stopPropagation()
      if (e.key === 'Enter') {
        e.preventDefault()
        handleCreate()
      }
    })

    createInput.addEventListener('click', (e) => e.stopPropagation())
  }

  function toggleMenu() {
    isOpen = !isOpen
    const menu = container.querySelector('.dropdown-menu')
    if (menu) menu.classList.toggle('open', isOpen)
    if (isOpen) {
      setTimeout(() => {
        const inp = container.querySelector('.new-folder-input')
        if (inp) inp.focus()
      }, 50)
    }
  }

  function closeMenu() {
    isOpen = false
    const menu = container.querySelector('.dropdown-menu')
    if (menu) menu.classList.remove('open')
  }

  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) closeMenu()
  })

  render()

  return {
    getValue: () => currentSelectedId,
    setValue: (id) => {
      currentSelectedId = id
      render()
    },
    updateFolders: (newFolders) => {
      currentFolders = [...newFolders]
      render()
    }
  }
}
