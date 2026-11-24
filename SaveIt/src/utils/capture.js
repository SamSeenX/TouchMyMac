// Viewport capture, downscaling, WebP compression, and quick tab session capture

export async function compressThumbnail(dataUrl, targetWidth = 480, targetHeight = 270) {
  if (!dataUrl) return null

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d')

        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        const srcAspect = img.width / img.height
        const targetAspect = targetWidth / targetHeight
        let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height

        if (srcAspect > targetAspect) {
          sWidth = img.height * targetAspect
          sx = (img.width - sWidth) / 2
        } else {
          sHeight = img.width / targetAspect
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight)
        resolve(canvas.toDataURL('image/webp', 0.8))
      } catch (err) {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(null)
    img.src = dataUrl
  })
}

export function getFaviconUrl(pageUrl, existingFavicon) {
  if (existingFavicon && !existingFavicon.startsWith('chrome://')) {
    return existingFavicon
  }
  try {
    const parsed = new URL(pageUrl)
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`
  } catch {
    return null
  }
}

// Dedicated Blink compositor screenshot helper via Chrome Debugger API
async function snapshotTabWithDebugger({ url, active, delayMs = 600 }) {
  let tabId = null, originalTabId = null, attached = false
  try {
    if (active) {
      const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true })
      originalTabId = activeTabs[0]?.id || null
    }

    const tab = await chrome.tabs.create({ url, active })
    tabId = tab.id

    await chrome.debugger.attach({ tabId }, '1.3')
    attached = true
    await chrome.debugger.sendCommand({ tabId }, 'Page.enable')

    await waitForTabComplete(tabId, 8000)
    await new Promise(r => setTimeout(r, delayMs))

    const res = await chrome.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', {
      format: 'jpeg',
      quality: 80
    })

    if (res?.data) {
      return await compressThumbnail(`data:image/jpeg;base64,${res.data}`, 480, 270)
    }
  } catch (err) {
    console.warn('Debugger tab capture error:', err)
  } finally {
    if (attached && tabId) try { await chrome.debugger.detach({ tabId }) } catch {}
    if (tabId) try { await chrome.tabs.remove(tabId) } catch {}
    if (originalTabId) try { await chrome.tabs.update(originalTabId, { active: true }) } catch {}
  }
  return null
}

// Opens secret background tab (active: false), snapshots via debugger, and auto-closes
export async function captureViaBackgroundTab(url) {
  if (!chrome?.tabs?.create || !url || !url.startsWith('http')) return null
  try {
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const norm = (u) => String(u || '').replace(/#.*$/, '').replace(/\/$/, '').toLowerCase()
    const targetNorm = norm(url)
    const existing = activeTabs.find(t => t.url && norm(t.url) === targetNorm)
    if (existing?.windowId) {
      const snap = await chrome.tabs.captureVisibleTab(existing.windowId, { format: 'jpeg', quality: 80 })
      return await compressThumbnail(snap, 480, 270)
    }
  } catch {}
  return snapshotTabWithDebugger({ url, active: false, delayMs: 650 })
}

// Opens interactive tab for user to bypass age/cookie gates, then snapshots via compositor and auto-closes
export async function captureInteractiveTab(url, delayMs = 2500) {
  if (!chrome?.tabs?.create || !url || !url.startsWith('http')) return null
  return snapshotTabWithDebugger({ url, active: true, delayMs })
}

function waitForTabComplete(tabId, timeoutMs = 7500) {
  return new Promise((resolve) => {
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }, timeoutMs)

    function listener(id, changeInfo, tab) {
      if (id === tabId && changeInfo.status === 'complete') {
        const tabUrl = tab?.url || ''
        if (tabUrl.startsWith('http://') || tabUrl.startsWith('https://')) {
          if (!resolved) {
            resolved = true
            clearTimeout(timer)
            chrome.tabs.onUpdated.removeListener(listener)
            resolve()
          }
        }
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}
