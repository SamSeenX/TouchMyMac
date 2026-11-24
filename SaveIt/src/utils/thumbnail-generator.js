// Automated thumbnail fetcher and batch queue service

import { compressThumbnail } from './capture.js'
import { updateBookmark } from '../core/bookmarks.js'

export async function fetchExternalThumbnail(url) {
  if (!url || !url.startsWith('http')) return null

  // WordPress mshots public screenshot service
  const serviceUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=480&h=270`

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const timeout = setTimeout(() => {
      img.src = ''
      resolve(null)
    }, 12000)

    img.onload = async () => {
      clearTimeout(timeout)
      try {
        const compressed = await compressThumbnail(img.src, 480, 270)
        resolve(compressed)
      } catch {
        resolve(null)
      }
    }

    img.onerror = () => {
      clearTimeout(timeout)
      resolve(null)
    }

    img.src = serviceUrl
  })
}

export class BatchThumbnailQueue {
  constructor({ onProgress, onComplete }) {
    this.onProgress = onProgress
    this.onComplete = onComplete
    this.isRunning = false
    this.isPaused = false
  }

  async start(bookmarks) {
    const missing = bookmarks.filter(b => !b.thumbnail)
    if (missing.length === 0) {
      if (this.onComplete) this.onComplete(0)
      return
    }

    this.isRunning = true
    this.isPaused = false
    const total = missing.length
    let completed = 0

    // Concurrency limit: 3 simultaneous requests
    const concurrency = 3
    let index = 0

    const worker = async () => {
      while (index < missing.length && this.isRunning && !this.isPaused) {
        const current = missing[index++]
        try {
          const thumbnail = await fetchExternalThumbnail(current.url)
          if (thumbnail) {
            await updateBookmark(current.id, { thumbnail })
          }
        } catch (err) {
          console.warn(`Failed thumbnail for ${current.url}:`, err)
        }
        completed++
        if (this.onProgress) {
          this.onProgress({ completed, total, currentUrl: current.url })
        }
      }
    }

    const workers = []
    for (let i = 0; i < Math.min(concurrency, missing.length); i++) {
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
