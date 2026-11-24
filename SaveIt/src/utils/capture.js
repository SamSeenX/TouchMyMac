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

// Opens a secret background tab (active: false), snapshots via debugger, and auto-closes
export async function captureViaBackgroundTab(url) {
  if (!chrome?.tabs?.create || !url || !url.startsWith('http')) return null

  // If already open in an active tab, capture instantly without opening anything
  try {
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const norm = (u) => String(u || '').replace(/#.*$/, '').replace(/\/$/, '').toLowerCase()
    const targetNorm = norm(url)

    const existingActive = activeTabs.find(t => t.url && norm(t.url) === targetNorm)
    if (existingActive && existingActive.windowId) {
      const snap = await chrome.tabs.captureVisibleTab(existingActive.windowId, { format: 'jpeg', quality: 80 })
      return await compressThumbnail(snap, 480, 270)
    }
  } catch {}

  let tabId = null
  let attached = false

  try {
    // 1. Open strictly in background: active is FALSE (user stays on dashboard!)
    const tab = await chrome.tabs.create({ url, active: false })
    tabId = tab.id

    // 2. Attach debugger to the background tab
    await chrome.debugger.attach({ tabId }, '1.3')
    attached = true
    await chrome.debugger.sendCommand({ tabId }, 'Page.enable')

    // 3. Wait for real destination URL to complete loading
    await waitForTabComplete(tabId, 7500)
    await new Promise(r => setTimeout(r, 650))

    // 4. Capture screenshot directly from Blink compositor
    const res = await chrome.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', {
      format: 'jpeg',
      quality: 80
    })

    if (res && res.data) {
      const dataUrl = `data:image/jpeg;base64,${res.data}`
      return await compressThumbnail(dataUrl, 480, 270)
    }
  } catch (err) {
    console.warn('Background debugger capture:', err)
  } finally {
    if (attached && tabId !== null) {
      try {
        await chrome.debugger.detach({ tabId })
      } catch {}
    }
    if (tabId !== null) {
      try {
        await chrome.tabs.remove(tabId)
      } catch {}
    }
  }

  return null
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
