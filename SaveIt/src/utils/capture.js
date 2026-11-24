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

        // Crop to center 16:9 aspect ratio
        const srcAspect = img.width / img.height
        const targetAspect = targetWidth / targetHeight
        let sx = 0
        let sy = 0
        let sWidth = img.width
        let sHeight = img.height

        if (srcAspect > targetAspect) {
          sWidth = img.height * targetAspect
          sx = (img.width - sWidth) / 2
        } else {
          sHeight = img.width / targetAspect
          sy = 0
        }

        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight)
        const webpDataUrl = canvas.toDataURL('image/webp', 0.8)
        resolve(webpDataUrl)
      } catch (err) {
        console.warn('Canvas WebP compression fallback:', err)
        resolve(dataUrl)
      }
    }

    img.onerror = () => {
      resolve(null)
    }

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

// Opens a brief tab with the user's active session, captures the view, and auto-closes
export async function captureViaQuickTab(url) {
  if (!chrome?.tabs?.create || !url || !url.startsWith('http')) return null

  let newTabId = null
  let originalTabId = null

  try {
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const norm = (u) => String(u || '').replace(/#.*$/, '').replace(/\/$/, '').toLowerCase()
    const targetNorm = norm(url)

    // If tab is already open and active, capture instantly without creating a tab
    const existingActive = activeTabs.find(t => t.url && norm(t.url) === targetNorm)
    if (existingActive && existingActive.windowId) {
      const snap = await chrome.tabs.captureVisibleTab(existingActive.windowId, { format: 'jpeg', quality: 80 })
      return await compressThumbnail(snap, 480, 270)
    }

    const currentTab = activeTabs[0]
    originalTabId = currentTab ? currentTab.id : null

    // Open temporary tab focused with user session/cookies
    const newTab = await chrome.tabs.create({ url, active: true })
    newTabId = newTab.id

    // Wait until DOM and content are complete
    await waitForTabComplete(newTabId, 6500)
    await new Promise(r => setTimeout(r, 450))

    const snap = await chrome.tabs.captureVisibleTab(newTab.windowId, { format: 'jpeg', quality: 80 })
    if (snap) {
      return await compressThumbnail(snap, 480, 270)
    }
  } catch (err) {
    console.warn('Quick tab session capture error:', err)
  } finally {
    if (newTabId !== null) {
      try {
        await chrome.tabs.remove(newTabId)
      } catch {}
    }
    if (originalTabId !== null) {
      try {
        await chrome.tabs.update(originalTabId, { active: true })
      } catch {}
    }
  }

  return null
}

function waitForTabComplete(tabId, timeoutMs = 6500) {
  return new Promise((resolve) => {
    let resolved = false
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true
        chrome.tabs.onUpdated.removeListener(listener)
        resolve()
      }
    }, timeoutMs)

    function listener(id, changeInfo) {
      if (id === tabId && changeInfo.status === 'complete') {
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
