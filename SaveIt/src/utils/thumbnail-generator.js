// 100% Local direct thumbnail extractor and batch processor

import { compressThumbnail } from './capture.js'
import { updateBookmark } from '../core/bookmarks.js'

export async function fetchExternalThumbnail(url) {
  if (!url || !url.startsWith('http')) return null

  // 1. Check if the page is currently active in any open Chrome tab
  try {
    const tabs = await chrome.tabs.query({})
    const match = tabs.find(t => t.url && normalizeUrl(t.url) === normalizeUrl(url))
    if (match && match.active) {
      const snap = await chrome.tabs.captureVisibleTab(match.windowId, { format: 'jpeg', quality: 75 })
      const compressed = await compressThumbnail(snap, 480, 270)
      if (compressed) return compressed
    }
  } catch {
    // Continue to direct HTML fetch
  }

  // 2. Direct HTML fetch for OpenGraph and Twitter preview banners
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6500)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'text/html,application/xhtml+xml' }
    })
    clearTimeout(timer)

    if (res.ok) {
      const html = await res.text()
      const imgUrl = extractOgImage(html, url)
      if (imgUrl) {
        const imgRes = await fetch(imgUrl)
        if (imgRes.ok) {
          const blob = await imgRes.blob()
          const dataUrl = await blobToDataUrl(blob)
          const compressed = await compressThumbnail(dataUrl, 480, 270)
          if (compressed) return compressed
        }
      }
    }
  } catch (err) {
    console.warn(`Direct thumbnail extraction for ${url}:`, err.message)
  }

  return null
}

function extractOgImage(html, baseUrl) {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html.slice(0, 50000), 'text/html')

    const meta = doc.querySelector(
      'meta[property="og:image"], meta[name="twitter:image"], meta[property="og:image:secure_url"], meta[name="twitter:image:src"], link[rel="image_src"]'
    )

    if (meta) {
      const content = meta.getAttribute('content') || meta.getAttribute('href')
      if (content && !content.startsWith('data:')) {
        return new URL(content, baseUrl).href
      }
    }
  } catch {}
  return null
}

function blobToDataUrl(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
}

function normalizeUrl(u) {
  return String(u).replace(/#.*$/, '').replace(/\/$/, '').toLowerCase()
}

export class BatchThumbnailQueue {
  constructor({ onProgress, onComplete }) {
    this.onProgress = onProgress
    this.onComplete = onComplete
    this.isRunning = false
  }

  async start(bookmarks) {
    if (!bookmarks || bookmarks.length === 0) {
      if (this.onComplete) this.onComplete(0)
      return
    }

    this.isRunning = true
    const total = bookmarks.length
    let completed = 0
    let index = 0
    const concurrency = 3

    const worker = async () => {
      while (index < bookmarks.length && this.isRunning) {
        const current = bookmarks[index++]
        try {
          const thumbnail = await fetchExternalThumbnail(current.url)
          if (thumbnail) {
            await updateBookmark(current.id, { thumbnail })
          }
        } catch {}
        completed++
        if (this.onProgress) {
          this.onProgress({ completed, total, currentUrl: current.url })
        }
      }
    }

    const workers = []
    for (let i = 0; i < Math.min(concurrency, bookmarks.length); i++) {
      workers.push(worker())
    }

    await Promise.all(workers)
    this.isRunning = false
    if (this.onComplete) this.onComplete(completed)
  }

  stop() {
    this.isRunning = false
  }
}
