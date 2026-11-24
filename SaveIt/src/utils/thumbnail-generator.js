// 100% Silent headless thumbnail generator with Service Worker bridge and local fallback

import { compressThumbnail } from './capture.js'
import { generateBrandedCard } from './branded-card.js'
import { updateBookmark } from '../core/bookmarks.js'

export async function generateSilentThumbnail(bookmark) {
  const url = bookmark.url
  if (!url || !url.startsWith('http')) return null

  // 1. Try silent background worker extraction for official site preview banners
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

  // 2. Headless local canvas branded preview card (Zero windows, zero network errors)
  return await generateBrandedCard(bookmark)
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

    // Process smoothly with micro-pauses
    for (let i = 0; i < bookmarks.length && this.isRunning; i++) {
      const current = bookmarks[i]
      try {
        const thumbnail = await generateSilentThumbnail(current)
        if (thumbnail) {
          await updateBookmark(current.id, { thumbnail })
        }
      } catch (err) {
        console.warn('Silent generation skipped:', err)
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
