// Folder and Label management for SaveIt

import { getAll, put, del, get } from './idb.js'
import { bus } from './bus.js'

export const DEFAULT_FOLDERS = [
  { id: 'folder_all', name: 'All Bookmarks', icon: 'layers', color: '#6366f1', system: true },
  { id: 'folder_general', name: 'General', icon: 'folder', color: '#10b981', system: true },
  { id: 'folder_reading', name: 'Reading List', icon: 'book-open', color: '#f59e0b', system: false },
  { id: 'folder_work', name: 'Work & Projects', icon: 'briefcase', color: '#3b82f6', system: false },
  { id: 'folder_dev', name: 'Dev & Design', icon: 'code', color: '#ec4899', system: false }
]

export async function initFolders() {
  const existing = await getAll('folders')
  if (existing.length === 0) {
    for (const folder of DEFAULT_FOLDERS) {
      if (folder.id !== 'folder_all') {
        await put('folders', {
          ...folder,
          createdAt: Date.now()
        })
      }
    }
    return DEFAULT_FOLDERS.filter(f => f.id !== 'folder_all')
  }
  return existing
}

export async function getFolders() {
  const folders = await getAll('folders')
  if (!folders || folders.length === 0) {
    return initFolders()
  }
  return folders.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
}

export async function createFolder(name, parentId = null, color = '#6366f1') {
  if (!name || !name.trim()) throw new Error('Folder name is required')
  const folder = {
    id: `folder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    parentId,
    color,
    icon: 'folder',
    system: false,
    createdAt: Date.now()
  }
  await put('folders', folder)
  bus.emit('folders:changed', { action: 'create', folder })
  return folder
}

export async function updateFolder(id, updates) {
  const folder = await get('folders', id)
  if (!folder) throw new Error('Folder not found')
  const updated = { ...folder, ...updates, updatedAt: Date.now() }
  await put('folders', updated)
  bus.emit('folders:changed', { action: 'update', folder: updated })
  return updated
}

export async function deleteFolder(id) {
  const folder = await get('folders', id)
  if (!folder) return false
  if (folder.system || folder.id === 'folder_general') {
    throw new Error('Cannot delete system folders')
  }

  // Safely reassign bookmarks in this folder to General
  const bookmarks = await getAll('bookmarks')
  for (const bm of bookmarks) {
    if (bm.folderId === id) {
      await put('bookmarks', { ...bm, folderId: 'folder_general', updatedAt: Date.now() })
    }
  }

  // Reassign any subfolders to top-level
  const allFolders = await getAll('folders')
  for (const f of allFolders) {
    if (f.parentId === id) {
      await put('folders', { ...f, parentId: null, updatedAt: Date.now() })
    }
  }

  await del('folders', id)
  bus.emit('bookmarks:changed', { action: 'update' })
  bus.emit('folders:changed', { action: 'delete', id })
  return true
}

export function extractLabels(bookmarks) {
  const labelCounts = new Map()
  for (const bm of bookmarks) {
    if (Array.isArray(bm.labels)) {
      for (const label of bm.labels) {
        const clean = label.trim().toLowerCase()
        if (clean) {
          labelCounts.set(clean, (labelCounts.get(clean) || 0) + 1)
        }
      }
    }
  }
  return Array.from(labelCounts.entries()).map(([name, count]) => ({ name, count }))
}
