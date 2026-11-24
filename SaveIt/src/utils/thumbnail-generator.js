// Headless thumbnail generator with local tab capture, OpenGraph extractor, and fallbacks

import { compressThumbnail, captureViaBackgroundTab } from './capture.js'
import { generateBrandedCard } from './branded-card.js'
import { updateBookmark } from '../core/bookmarks.js'

export async function generateSilentThumbnail(bookmark) {
  const url = bookmark.url
  if (!url || !url.startsWith('http')) return null

  // 1. Instant local capture if tab is currently open and active in Chrome
  const localSnap = await findActiveTabScreenshot(url)
  if (localSnap) {
    const compressed = await compressThumbnail(localSnap, 480, 270)
    if (compressed) return compressed
  }

  // 2. Extract genuine OpenGraph or Twitter preview banner (strictly rejecting icons)
  try {
    const swResult = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'extract_preview', url }, (res) => {
        if (chrome.runtime.lastError) {
          resolve(null)
          return
        }
        resolve(res || null)
      })
    })

    if (swResult) {
      const compressed = await compressThumbnail(swResult, 480, 270)
      if (compressed) return compressed
    }
  } catch {}

  // 3. Secret background tab capture via debugger API (active: false, user stays on dashboard)
  try {
    const bgSnap = await captureViaBackgroundTab(url)
    if (bgSnap) return bgSnap
  } catch {}

  // 4. Headless cloud screenshot fallback for public pages
  const mshotSnap = await fetchMshotsScreenshot(url)
  if (mshotSnap) {
    const compressed = await compressThumbnail(mshotSnap, 480, 270)
    if (compressed) return compressed
  }

  // 5. Final fallback: local branded canvas card (zero network errors)
  return await generateBrandedCard(bookmark)
}

async function findActiveTabScreenshot(url) {
  try {
    if (!chrome?.tabs?.query) return null
    const tabs = await chrome.tabs.query({ active: true })
    const norm = (u) => String(u || '').replace(/#.*$/, '').replace(/\/$/, '').toLowerCase()
    const targetNorm = norm(url)
    const match = tabs.find(t => t.url && norm(t.url) === targetNorm)
    if (match && match.windowId) {
      return await chrome.tabs.captureVisibleTab(match.windowId, { format: 'jpeg', quality: 80 })
    }
  } catch {}
  return null
}

async function fetchMshotsScreenshot(url) {
  try {
    const cleanUrl = url.replace(/\/$/, '')
    const target = `https://s0.wp.com/mshots/v1/${cleanUrl}?w=640`

    for (let attempt = 0; attempt < 3; attempt++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 6500)

      const res = await fetch(target, {
        signal: controller.signal,
        headers: { 'Accept': 'image/jpeg,image/*' }
      })
      clearTimeout(timer)

      const contentType = res.headers.get('content-type') || ''
      const isPlaceholder = res.url.includes('/default') || contentType.includes('gif')

      if (res.ok && contentType.includes('jpeg') && !isPlaceholder) {
        const blob = await res.blob()
        return await blobToDataUrl(blob)
      }

      // Pre-warm delay for headless rendering on first visit
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, 2600))
      }
    }
  } catch (err) {
    console.warn('Screenshot fetch error:', err.message)
  }
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

export const fetchExternalThumbnail = (url, bookmarkObj) => {
  return generateSilentThumbnail(bookmarkObj || { url })
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

    for (let i = 0; i < bookmarks.length && this.isRunning; i++) {
      const current = bookmarks[i]
      try {
        const thumbnail = await generateSilentThumbnail(current)
        if (thumbnail) {
          await updateBookmark(current.id, { thumbnail })
        }
      } catch (err) {
        console.warn('Batch generation skipped:', err)
      }
      completed++
      if (this.onProgress) {
        this.onProgress({ completed, total, currentUrl: current.url })
      }
    }

    this.isRunning = false
    if (this.onComplete) this.onComplete(completed)
  }

  stop() {
    this.isRunning = false
  }
}
