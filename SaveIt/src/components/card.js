// Card component rendering visual bookmark cards with drag-to-organize and thumbnail refresh

import { escapeHtml, sanitizeUrl } from '../utils/sanitize.js'

export function renderCard(bookmark, folderName = '', showFolder = false) {
  const card = document.createElement('article')
  card.className = 'bookmark-card'
  card.setAttribute('data-id', bookmark.id)
  card.setAttribute('draggable', 'true')

  const domain = extractDomain(bookmark.url)
  const safeUrl = sanitizeUrl(bookmark.url)
  const safeTitle = escapeHtml(bookmark.title || domain)
  const pinBadge = bookmark.pinned ? '<span class="card-pin-badge">&#9733;</span>' : ''

  const thumbnailHtml = bookmark.thumbnail
    ? `<img src="${bookmark.thumbnail}" alt="${safeTitle}" class="card-thumbnail" loading="lazy" draggable="false">`
    : `<div class="card-thumbnail-fallback" draggable="false">${escapeHtml(domain.slice(0, 2))}</div>`

  const faviconHtml = bookmark.favicon
    ? `<img src="${bookmark.favicon}" alt="" class="card-favicon" draggable="false">`
    : ''

  const folderBadgeHtml = (showFolder && folderName)
    ? `<button type="button" class="card-folder-badge" data-action="filter-folder" data-folder-id="${bookmark.folderId}" title="Folder: ${escapeHtml(folderName)}">&#128193; ${escapeHtml(folderName)}</button>`
    : ''

  card.innerHTML = `
    <div class="card-thumbnail-wrap" data-action="open" title="Open: ${safeTitle}" draggable="false">
      ${thumbnailHtml}
      ${pinBadge}
    </div>
    <div class="card-body">
      <div class="card-header-row">
        ${faviconHtml}
        <span class="card-domain">${escapeHtml(domain)}</span>
        ${folderBadgeHtml}
      </div>
      <div class="card-title-link" data-action="open" title="Open: ${safeTitle}">
        <h3 class="card-title" title="${safeTitle}">${safeTitle}</h3>
      </div>
    </div>
    <div class="card-footer">
      <span class="card-date">${formatDate(bookmark.createdAt)}</span>
      <div class="card-actions">
        <button type="button" class="card-action-btn" data-action="refresh" title="Silent Refresh (Banner)">&#128260;</button>
        <button type="button" class="card-action-btn" data-action="snap" title="Interactive Snapshot (Opens tab for 2.5s to bypass age gates)">&#128247;</button>
        <button type="button" class="card-action-btn" data-action="copy" title="Copy Link">&#128203;</button>
        <button type="button" class="card-action-btn" data-action="edit" title="Edit">&#9998;</button>
        <button type="button" class="card-action-btn" data-action="delete" title="Delete">&#128465;</button>
      </div>
    </div>
  `

  // Programmatic favicon error handler to avoid CSP inline handler violations
  const favImg = card.querySelector('.card-favicon')
  if (favImg) {
    favImg.addEventListener('error', () => {
      favImg.style.display = 'none'
    })
  }

  card.addEventListener('dragstart', (e) => {
    const el = e.target.nodeType === 1 ? e.target : e.target.parentElement
    if (el && el.closest('.card-actions')) {
      e.preventDefault()
      return
    }
    e.dataTransfer.setData('text/plain', bookmark.id)
    e.dataTransfer.setData('text/uri-list', bookmark.url)
    e.dataTransfer.effectAllowed = 'move'
    card.classList.add('dragging')
  })

  card.addEventListener('dragend', () => {
    card.classList.remove('dragging')
  })

  return card
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url || 'unknown'
  }
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
