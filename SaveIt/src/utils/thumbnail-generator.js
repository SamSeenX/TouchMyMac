// 100% Local invisible thumbnail generator with Service Worker bridge and offscreen capture

import { compressThumbnail } from './capture.js'
import { updateBookmark } from '../core/bookmarks.js'

export async function captureSecretPage(url) {
  if (!url || !url.startsWith('http')) return null

  // 1. Silent Service Worker OpenGraph extraction (Zero windows opened)
  try {
    const swResult = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'extract_preview', url }, (res) => {
        resolve(res || null)
      })
    })

    if (swResult) {
      const compressed = await compressThumbnail(swResult, 480, 270)
      if (compressed) return compressed
    }
  } catch {}

  // 2. Offscreen Window Capture (rendered completely off-monitor at left: -20000)
  let winId = null
  try {
    const win = await chrome.windows.create({
      url,
      type: 'popup',
      focused: false,
      left: -20000,
      top: -20000,
      width: 1280,
      height: 720
    })

    winId = win.id
    const tabId = win.tabs && win.tabs[0] ? win.tabs[0].id : null

    if (tabId) {
      await waitForTabReady(tabId, 7000)
    }

    await new Promise(r => setTimeout(r, 500))

    const raw = await chrome.tabs.captureVisibleTab(winId, { format: 'jpeg', quality: 75 })
    if (raw) {
      return await compressThumbnail(raw, 480, 270)
    }
  } catch (err) {
    console.warn(`Offscreen capture fallback failed for ${url}:`, err.message)
  } finally {
    if (winId !== null) {
      try {
        await chrome.windows.remove(winId)
      } catch {}
    }
  }

  return null
}

function waitForTabReady(tabId, timeoutMs = 7000) {
  return new Promise((resolve) => {
    let done = false
    const timer = setTimeout(() => {
      if (!done) {
        done = true
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }, timeoutMs)

    function listener(id, change) {
      if (id === tabId && change.status === 'complete') {
        if (!done) {
          done = true
          clearTimeout(timer)
          chrome.tabs.onUpdated.removeListener(listener)
          resolve()
        }
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

export const fetchExternalThumbnail = captureSecretPage

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

    // Sequential queue to keep resource usage minimal and silent
    for (let i = 0; i < bookmarks.length && this.isRunning; i++) {
      const current = bookmarks[i]
      try {
        const thumbnail = await captureSecretPage(current.url)
        if (thumbnail) {
          await updateBookmark(current.id, { thumbnail })
        }
      } catch (err) {
        console.warn('Batch item skipped:', err)
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
