// Micro HTML sanitizer to prevent XSS in Vanilla DOM rendering

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str).replace(/[&<>"'/]/g, (char) => ESCAPE_MAP[char])
}

export function sanitizeUrl(url) {
  if (!url) return 'about:blank'
  const trimmed = String(url).trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  return 'about:blank'
}
