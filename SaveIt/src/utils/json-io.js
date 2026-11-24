// JSON snapshot backup and restoration service

export function exportJsonSnapshot(folders, bookmarks) {
  const snapshot = {
    app: 'SaveIt',
    version: 1,
    exportedAt: new Date().toISOString(),
    folders,
    bookmarks
  }
  return JSON.stringify(snapshot, null, 2)
}

export function parseJsonSnapshot(jsonString) {
  try {
    const data = JSON.parse(jsonString)
    if (!data || typeof data !== 'object') throw new Error('Invalid JSON format')
    if (!Array.isArray(data.bookmarks)) throw new Error('Snapshot missing bookmarks array')

    return {
      folders: Array.isArray(data.folders) ? data.folders : [],
      bookmarks: data.bookmarks
    }
  } catch (err) {
    throw new Error(`Failed to parse SaveIt backup: ${err.message}`)
  }
}
