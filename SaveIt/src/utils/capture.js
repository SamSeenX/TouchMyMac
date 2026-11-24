// Viewport capture, downscaling, WebP compression, and two-tier tab capture engine

export async function compressThumbnail(dataUrl, targetWidth = 480, targetHeight = 270) {
  if (!dataUrl) return null

  return new Promise((resolve) => {
    const img = new Image()
    if (!dataUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous'
    }

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
      } catch {
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

// Attached on-demand post-load to avoid navigation detaches
async function captureViaDebugger(tabId) {
  let attached = false
  try {
    await chrome.debugger.attach({ tabId }, '1.3')
    attached = true
    await chrome.debugger.sendCommand({ tabId }, 'Page.enable')
    const res = await chrome.debugger.sendCommand({ tabId }, 'Page.captureScreenshot', {
      format: 'jpeg',
      quality: 80
    })
    if (res?.data) {
      return `data:image/jpeg;base64,${res.data}`
    }
  } catch (err) {
    console.warn('Debugger screenshot failed:', err)
  } finally {
    if (attached) {
      try { await chrome.debugger.detach({ tabId }) } catch {}
    }
  }
  return null
}

// Opens secret background tab (active: false), snapshots via debugger, and auto-closes
export async function captureViaBackgroundTab(url) {
  if (!chrome?.tabs?.create || !url || !url.startsWith('http')) return null
  let tabId = null
  try {
    const tab = await chrome.tabs.create({ url, active: false })
    tabId = tab.id
    await waitForTabComplete(tabId, 7500)
    await new Promise(r => setTimeout(r, 650))
    const rawData = await captureViaDebugger(tabId)
    if (rawData) return await compressThumbnail(rawData, 480, 270)
  } catch (err) {
    console.warn('Background tab error:', err)
  } finally {
    if (tabId) try { await chrome.tabs.remove(tabId) } catch {}
  }
  return null
}

// Opens interactive tab for user to bypass age/cookie gates with two-tier capture fallback
export async function captureInteractiveTab(url, delayMs = 2500) {
  if (!chrome?.tabs?.create || !url || !url.startsWith('http')) return null
  let tabId = null
  let originalTabId = null
  try {
    const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true })
    originalTabId = activeTabs[0]?.id || null

    const tab = await chrome.tabs.create({ url, active: true })
    tabId = tab.id
    const targetWinId = tab.windowId

    await waitForTabComplete(tabId, 8000)
    await new Promise(r => setTimeout(r, delayMs))

    // Tier 1: Instant native capture of active foreground tab
    let rawData = null
    try {
      rawData = await chrome.tabs.captureVisibleTab(targetWinId, { format: 'jpeg', quality: 80 })
    } catch (tabErr) {
      console.warn('captureVisibleTab fallback to debugger:', tabErr)
    }

    // Tier 2: Blink compositor screenshot via debugger attached post-load
    if (!rawData) {
      rawData = await captureViaDebugger(tabId)
    }

    if (rawData) {
      return await compressThumbnail(rawData, 480, 270)
    }
  } catch (err) {
    console.warn('Interactive tab error:', err)
  } finally {
    if (tabId) try { await chrome.tabs.remove(tabId) } catch {}
    if (originalTabId) try { await chrome.tabs.update(originalTabId, { active: true }) } catch {}
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
