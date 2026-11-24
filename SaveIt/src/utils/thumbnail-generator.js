// Automated thumbnail fetcher and batch queue service with pre-warm retry

import { compressThumbnail } from './capture.js'
import { updateBookmark } from '../core/bookmarks.js'

export async function fetchExternalThumbnail(url) {
  if (!url || !url.startsWith('http')) return null

  let cleanUrl = url.replace(/#.*$/, '')
  try {
    const parsed = new URL(cleanUrl)
    if (!parsed.pathname || parsed.pathname === '') {
      parsed.pathname = '/'
    }
    cleanUrl = parsed.toString()
  } catch {
    if (!cleanUrl.includes('/', 8)) cleanUrl += '/'
  }

  const baseServiceUrl = `https://s0.wp.com/mshots/v1/${cleanUrl}?w=480&h=270`

  // Pre-warm request to trigger mshots headless browser rendering
  const prewarm = new Image()
  prewarm.src = `${baseServiceUrl}&_init=1`

  // Short pause to allow mshots screenshot worker to finish rendering
  await new Promise(resolve => setTimeout(resolve, 1800))

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

    img.src = `${baseServiceUrl}&_t=${Date.now()}`
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
    if (!bookmarks || bookmarks.length === 0) {
      if (this.onComplete) this.onComplete(0)
      return
    }

    this.isRunning = true
    this.isPaused = false
    const total = bookmarks.length
    let completed = 0

    // Concurrency limit: 2 simultaneous requests with spacing
    const concurrency = 2
    let index = 0

    const worker = async () => {
      while (index < bookmarks.length && this.isRunning && !this.isPaused) {
        const current = bookmarks[index++]
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
