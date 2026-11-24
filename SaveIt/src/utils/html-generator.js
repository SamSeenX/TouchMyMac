// Generator for standard Netscape Bookmark HTML files

import { escapeHtml } from './sanitize.js'

export function generateNetscapeHtml(folders, bookmarks) {
  const lines = [
    '<!DOCTYPE NETSCAPE-Bookmark-file-1>',
    '<!-- This is an automatically generated file. It will be read and overwritten. Do Not Edit! -->',
    '<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">',
    '<TITLE>Bookmarks</TITLE>',
    '<H1>Bookmarks</H1>',
    '<DL><p>'
  ]

  // Group bookmarks by folderId
  const folderMap = new Map()
  folders.forEach(f => folderMap.set(f.id, f))

  const grouped = new Map()
  bookmarks.forEach(bm => {
    const fid = bm.folderId || 'folder_general'
    if (!grouped.has(fid)) grouped.set(fid, [])
    grouped.get(fid).push(bm)
  })

  // Write folders and items
  for (const [folderId, bms] of grouped.entries()) {
    const folder = folderMap.get(folderId)
    const folderName = folder ? folder.name : 'General'

    lines.push(`    <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}">${escapeHtml(folderName)}</H3>`)
    lines.push('    <DL><p>')

    for (const bm of bms) {
      const addDate = Math.floor((bm.createdAt || Date.now()) / 1000)
      const iconAttr = bm.favicon && bm.favicon.startsWith('data:image') ? ` ICON="${bm.favicon}"` : ''
      lines.push(`        <DT><A HREF="${escapeHtml(bm.url)}" ADD_DATE="${addDate}"${iconAttr}>${escapeHtml(bm.title || bm.url)}</A>`)
    }

    lines.push('    </DL><p>')
  }

  lines.push('</DL><p>')
  return lines.join('\n')
}
