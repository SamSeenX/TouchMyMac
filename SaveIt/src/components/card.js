// Card component rendering visual bookmark cards with drag-to-organize and thumbnail refresh

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
    ? `<img src="${bookmark.thumbnail}" alt="${safeTitle}" class="card-thumbnail" loading="lazy" draggable="false">`
    : `<div class="card-thumbnail-fallback" draggable="false">${escapeHtml(domain.slice(0, 2))}</div>`

  const faviconHtml = bookmark.favicon
    ? `<img src="${bookmark.favicon}" alt="" class="card-favicon" draggable="false" onerror="this.style.display='none'">`
    : ''

  card.innerHTML = `
    <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="card-thumbnail-wrap" title="Open: ${safeTitle}" draggable="false">
      ${thumbnailHtml}
      ${pinBadge}
    </a>
    <div class="card-body">
      <div class="card-header-row">
        ${faviconHtml}
        <span class="card-domain">${escapeHtml(domain)}</span>
      </div>
      <a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="card-title-link" draggable="false">
        <h3 class="card-title" title="${safeTitle}">${safeTitle}</h3>
      </a>
    </div>
    <div class="card-footer">
      <span class="card-date">${formatDate(bookmark.createdAt)}</span>
      <div class="card-actions">
        <button class="card-action-btn" data-action="refresh" title="Refresh Thumbnail">&#128260;</button>
        <button class="card-action-btn" data-action="copy" title="Copy Link">&#128203;</button>
        <button class="card-action-btn" data-action="edit" title="Edit">&#9998;</button>
        <button class="card-action-btn" data-action="delete" title="Delete">&#128465;</button>
      </div>
    </div>
  `

  card.addEventListener('dragstart', (e) => {
    if (e.target.closest('.card-actions')) {
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
