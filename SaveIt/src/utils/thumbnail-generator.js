// 100% Local background window capture engine with zero 3rd-party services

import { compressThumbnail } from './capture.js'
import { updateBookmark } from '../core/bookmarks.js'

export async function captureSecretPage(url) {
  if (!url || !url.startsWith('http')) return null

  let winId = null
  try {
    const win = await chrome.windows.create({
      url,
      type: 'popup',
      focused: false,
      width: 1280,
      height: 720
    })

    winId = win.id
    const tabId = win.tabs && win.tabs[0] ? win.tabs[0].id : null

    if (tabId) {
      await waitForTabReady(tabId, 8000)
    }

    // Short pause for fonts and styles to render
    await new Promise(r => setTimeout(r, 600))

    const raw = await chrome.tabs.captureVisibleTab(winId, { format: 'jpeg', quality: 75 })
    if (raw) {
      return await compressThumbnail(raw, 480, 270)
    }
  } catch (err) {
    console.warn(`Background window capture failed for ${url}:`, err.message)
  } finally {
    if (winId !== null) {
      try {
        await chrome.windows.remove(winId)
      } catch {}
    }
  }

  // Fallback to direct OpenGraph header extraction if window capture fails
  return await fetchOgFallback(url)
}

function waitForTabReady(tabId, timeoutMs = 8000) {
  return new Promise((resolve) => {
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }, timeoutMs)

    function listener(id, change) {
      if (id === tabId && change.status === 'complete') {
        if (!resolved) {
          resolved = true
          clearTimeout(timer)
          chrome.tabs.onUpdated.removeListener(listener)
          resolve()
        }
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

async function fetchOgFallback(url) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4500)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timer)

    if (res.ok) {
      const html = await res.text()
      const match = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)
      if (match && match[1]) {
        const fullImgUrl = new URL(match[1], url).href
        const imgRes = await fetch(fullImgUrl)
        if (imgRes.ok) {
          const blob = await imgRes.blob()
          const dataUrl = await blobToData(blob)
          return await compressThumbnail(dataUrl, 480, 270)
        }
      }
    }
  } catch {}
  return null
}

function blobToData(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
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

    // Sequential (1 window at a time) to prevent background window clutter
    for (let i = 0; i < bookmarks.length && this.isRunning; i++) {
      const current = bookmarks[i]
      try {
        const thumbnail = await captureSecretPage(current.url)
        if (thumbnail) {
          await updateBookmark(current.id, { thumbnail })
        }
      } catch (err) {
        console.warn('Batch item failed:', err)
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

export const fetchExternalThumbnail = captureSecretPage
