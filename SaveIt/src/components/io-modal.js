// Import and Export modal dialog controller

import { parseNetscapeHtml } from '../utils/html-parser.js'
import { generateNetscapeHtml } from '../utils/html-generator.js'
import { exportJsonSnapshot, parseJsonSnapshot } from '../utils/json-io.js'
import { saveBookmark } from '../core/bookmarks.js'
import { createFolder } from '../core/folders.js'
import { bus } from '../core/bus.js'

export function setupIoModal({ modalEl, foldersProvider, bookmarksProvider }) {
  modalEl.innerHTML = `
    <div class="modal-window">
      <div class="modal-header">
        <h3 class="modal-title">Import & Export Bookmarks</h3>
        <button id="closeIoModal" class="modal-close-btn">&times;</button>
      </div>
      <div class="modal-body">
        <div>
          <label class="sidebar-section-title">Import from Browser or Backup</label>
          <input type="file" id="importFileInput" accept=".html,.htm,.json" class="input-field">
          <p id="importStatus" style="font-size:12px;color:var(--text-dim);margin-top:6px;">
            Supports HTML exports from Chrome, Safari, Firefox, Edge, and SaveIt JSON files.
          </p>
        </div>
        <hr style="border:none;border-top:1px solid var(--border-subtle);margin:6px 0;">
        <div>
          <label class="sidebar-section-title">Export Bookmarks</label>
          <div style="display:flex;gap:10px;margin-top:8px;">
            <button id="exportHtmlBtn" class="btn btn-ghost" style="flex:1;">Export as HTML</button>
            <button id="exportJsonBtn" class="btn btn-ghost" style="flex:1;">Full JSON Backup</button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button id="doneIoBtn" class="btn btn-primary">Done</button>
      </div>
    </div>
  `

  const importFileInput = modalEl.querySelector('#importFileInput')
  const importStatus = modalEl.querySelector('#importStatus')
  const exportHtmlBtn = modalEl.querySelector('#exportHtmlBtn')
  const exportJsonBtn = modalEl.querySelector('#exportJsonBtn')
  const closeBtn = modalEl.querySelector('#closeIoModal')
  const doneBtn = modalEl.querySelector('#doneIoBtn')

  function open() { modalEl.classList.add('open') }
  function close() { modalEl.classList.remove('open') }

  closeBtn.addEventListener('click', close)
  doneBtn.addEventListener('click', close)

  importFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return

    importStatus.textContent = 'Reading file...'
    try {
      const text = await file.text()
      const isJson = file.name.endsWith('.json') || text.trim().startsWith('{')
      let count = 0

      if (isJson) {
        const { folders, bookmarks } = parseJsonSnapshot(text)
        for (const f of folders) {
          try { await createFolder(f.name, f.parentId, f.color) } catch {}
        }
        for (const bm of bookmarks) {
          await saveBookmark(bm)
          count++
        }
      } else {
        const { folderNames, bookmarks } = parseNetscapeHtml(text)
        const currentFolders = foldersProvider()
        const folderNameToId = new Map()

        currentFolders.forEach(f => folderNameToId.set(f.name.toLowerCase(), f.id))

        for (const fname of folderNames) {
          const lower = fname.toLowerCase()
          if (!folderNameToId.has(lower)) {
            const created = await createFolder(fname)
            folderNameToId.set(lower, created.id)
          }
        }

        for (const bm of bookmarks) {
          const folderId = folderNameToId.get((bm.folderName || '').toLowerCase()) || 'folder_general'
          await saveBookmark({ ...bm, folderId })
          count++
        }
      }

      importStatus.textContent = `Successfully imported ${count} bookmarks!`
      importStatus.style.color = 'var(--success)'
      bus.emit('bookmarks:changed')
      bus.emit('folders:changed')
    } catch (err) {
      importStatus.textContent = `Import failed: ${err.message}`
      importStatus.style.color = 'var(--danger)'
    }
  })

  exportHtmlBtn.addEventListener('click', () => {
    const folders = foldersProvider()
    const bookmarks = bookmarksProvider()
    const html = generateNetscapeHtml(folders, bookmarks)
    downloadFile(html, 'saveit-bookmarks.html', 'text/html')
  })

  exportJsonBtn.addEventListener('click', () => {
    const folders = foldersProvider()
    const bookmarks = bookmarksProvider()
    const json = exportJsonSnapshot(folders, bookmarks)
    downloadFile(json, 'saveit-backup.json', 'application/json')
  })

  return { open, close }
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
