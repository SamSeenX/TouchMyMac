// Bookmarks CRUD, indexing and search service

import { getAll, get, put, del } from './idb.js'
import { bus } from './bus.js'

export async function getBookmarks() {
  const list = await getAll('bookmarks')
  return list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export async function getBookmark(id) {
  return get('bookmarks', id)
}

export async function findBookmarkByUrl(url) {
  if (!url) return null
  const all = await getAll('bookmarks')
  const normalized = normalizeUrl(url)
  return all.find(b => normalizeUrl(b.url) === normalized) || null
}

export async function saveBookmark(data) {
  if (!data.url) throw new Error('Bookmark URL is required')

  const existing = await findBookmarkByUrl(data.url)
  const id = existing ? existing.id : `bm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
  const now = Date.now()

  const bookmark = {
    id,
    url: data.url,
    title: (data.title || data.url).trim(),
    description: (data.description || '').trim(),
    thumbnail: data.thumbnail || (existing ? existing.thumbnail : null),
    favicon: data.favicon || (existing ? existing.favicon : null),
    folderId: data.folderId || (existing ? existing.folderId : 'folder_general'),
    labels: Array.isArray(data.labels) ? data.labels : [],
    pinned: data.pinned !== undefined ? data.pinned : (existing ? existing.pinned : false),
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now
  }

  await put('bookmarks', bookmark)
  bus.emit('bookmarks:changed', { action: existing ? 'update' : 'create', bookmark })
  return bookmark
}

export async function updateBookmark(id, updates) {
  const current = await get('bookmarks', id)
  if (!current) throw new Error('Bookmark not found')

  const updated = {
    ...current,
    ...updates,
    updatedAt: Date.now()
  }

  await put('bookmarks', updated)
  bus.emit('bookmarks:changed', { action: 'update', bookmark: updated })
  return updated
}

export async function deleteBookmark(id) {
  const current = await get('bookmarks', id)
  if (!current) return false

  await del('bookmarks', id)
  bus.emit('bookmarks:changed', { action: 'delete', id })
  return true
}

export function filterBookmarks(list, { query = '', folderId = null, sort = 'newest' }) {
  let filtered = [...list]

  if (folderId === 'folder_recent') {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)
    filtered = filtered.filter(b => (b.createdAt || 0) >= sevenDaysAgo)
    if (filtered.length < 5) {
      filtered = [...list].slice(0, 15)
    }
  } else if (folderId && folderId !== 'folder_all') {
    filtered = filtered.filter(b => b.folderId === folderId)
  }

  if (query && query.trim()) {
    const q = query.toLowerCase().trim()
    filtered = filtered.filter(b => {
      const matchTitle = (b.title || '').toLowerCase().includes(q)
      const matchUrl = (b.url || '').toLowerCase().includes(q)
      const matchDesc = (b.description || '').toLowerCase().includes(q)
      const matchLabels = Array.isArray(b.labels) && b.labels.some(l => l.toLowerCase().includes(q))
      return matchTitle || matchUrl || matchDesc || matchLabels
    })
  }

  filtered.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    if (sort === 'oldest') return (a.createdAt || 0) - (b.createdAt || 0)
    if (sort === 'a-z') return (a.title || '').localeCompare(b.title || '')
    if (sort === 'z-a') return (b.title || '').localeCompare(a.title || '')
    return (b.createdAt || 0) - (a.createdAt || 0)
  })

  return filtered
}

function normalizeUrl(url) {
  try {
    const u = new URL(url)
    return `${u.origin}${u.pathname}`.replace(/\/$/, '')
  } catch {
    return url.replace(/\/$/, '')
  }
}
