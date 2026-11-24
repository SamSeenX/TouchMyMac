// Card component rendering visual bookmark cards with drag-to-organize support

import { escapeHtml, sanitizeUrl } from '../utils/sanitize.js'

export function renderCard(bookmark) {
  const card = document.createElement('article')
  card.className = 'bookmark-card'
  card.setAttribute('data-id', bookmark.id)
  card.setAttribute('draggable', 'true')

  const domain = extractDomain(bookmark.url)
  const safeUrl = sanitizeUrl(bookmark.url)
  const safeTitle = escapeHtml(bookmark.title || domain)
  const pinBadge = bookmark.pinned ? '<span class="card-pin-badge">&#9733;</span>' : ''

  const thumbnailHtml = bookmark.thumbnail
    ? `<img src="${bookmark.thumbnail}" alt="${safeTitle}" class="card-thumbnail" loading="lazy">`
    : `<div class="card-thumbnail-fallback">${escapeHtml(domain.slice(0, 2))}</div>`

  const faviconHtml = bookmark.favicon
    ? `<img src="${bookmark.favicon}" alt="" class="card-favicon" onerror="this.style.display='none'">`
    : ''

  card.innerHTML = `
    <div class="card-thumbnail-wrap" data-action="open" title="Open: ${safeTitle}">
      ${thumbnailHtml}
      ${pinBadge}
    </div>
    <div class="card-body">
      <div class="card-header-row">
        ${faviconHtml}
        <span class="card-domain">${escapeHtml(domain)}</span>
      </div>
      <h3 class="card-title" data-action="open" title="${safeTitle}">${safeTitle}</h3>
    </div>
    <div class="card-footer">
      <span class="card-date">${formatDate(bookmark.createdAt)}</span>
      <div class="card-actions">
        <button class="card-action-btn" data-action="copy" title="Copy Link">&#128203;</button>
        <button class="card-action-btn" data-action="edit" title="Edit">&#9998;</button>
        <button class="card-action-btn" data-action="delete" title="Delete">&#128465;</button>
      </div>
    </div>
  `

  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', bookmark.id)
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
