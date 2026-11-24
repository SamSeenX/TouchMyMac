// Local branded canvas card generator for pages without preview images

import { getFaviconUrl } from './capture.js'

export async function generateBrandedCard(bookmark) {
  const width = 480
  const height = 270
  const domain = extractDomain(bookmark.url)
  const faviconUrl = bookmark.favicon || getFaviconUrl(bookmark.url)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')

  // Aesthetic dark gradient background based on domain name hash
  const colors = getDomainColors(domain)
  const grad = ctx.createLinearGradient(0, 0, width, height)
  grad.addColorStop(0, colors[0])
  grad.addColorStop(1, colors[1])
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, width, height)

  // Inner subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  ctx.lineWidth = 2
  ctx.strokeRect(12, 12, width - 24, height - 24)

  // Center card plate
  const plateW = 100
  const plateH = 100
  const plateX = (width - plateW) / 2
  const plateY = 60
  ctx.fillStyle = 'rgba(15, 23, 42, 0.65)'
  ctx.beginPath()
  ctx.roundRect(plateX, plateY, plateW, plateH, 20)
  ctx.fill()

  // Draw favicon or domain monogram
  if (faviconUrl) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise((resolve) => {
        const t = setTimeout(resolve, 1500)
        img.onload = () => { clearTimeout(t); resolve() }
        img.onerror = () => { clearTimeout(t); resolve() }
        img.src = faviconUrl
      })

      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, plateX + 26, plateY + 26, 48, 48)
      } else {
        drawMonogram(ctx, domain, plateX, plateY, plateW, plateH)
      }
    } catch {
      drawMonogram(ctx, domain, plateX, plateY, plateW, plateH)
    }
  } else {
    drawMonogram(ctx, domain, plateX, plateY, plateW, plateH)
  }

  // Draw clean domain text badge below
  ctx.font = '600 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = '#f8fafc'
  ctx.textAlign = 'center'
  ctx.fillText(domain, width / 2, 195)

  // Draw category or web marker
  ctx.font = '500 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.fillText('BOOKMARK PREVIEW', width / 2, 218)

  return canvas.toDataURL('image/webp', 0.8)
}

function drawMonogram(ctx, domain, px, py, pw, ph) {
  ctx.font = '700 36px -apple-system, BlinkMacSystemFont, sans-serif'
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(domain.slice(0, 2).toUpperCase(), px + pw / 2, py + ph / 2)
}

function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Web'
  }
}

function getDomainColors(domain) {
  let hash = 0
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash)
  }
  const palettes = [
    ['#1e1b4b', '#312e81'],
    ['#0f172a', '#1e293b'],
    ['#064e3b', '#065f46'],
    ['#1e293b', '#334155'],
    ['#311042', '#4c1d95'],
    ['#172554', '#1e40af']
  ]
  const idx = Math.abs(hash) % palettes.length
  return palettes[idx]
}
