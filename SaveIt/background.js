// Manifest V3 Background Service Worker for SaveIt

import { saveBookmark } from './src/core/bookmarks.js'
import { getFaviconUrl } from './src/utils/capture.js'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveit_save_page',
    title: 'Save Page to SaveIt',
    contexts: ['page']
  })

  chrome.contextMenus.create({
    id: 'saveit_save_link',
    title: 'Save Link to SaveIt',
    contexts: ['link']
  })
})

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return

  try {
    if (info.menuItemId === 'saveit_save_page') {
      let thumbnail = null
      try {
        thumbnail = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'jpeg', quality: 75 })
      } catch {}

      await saveBookmark({
        url: tab.url,
        title: tab.title || tab.url,
        thumbnail,
        favicon: getFaviconUrl(tab.url, tab.favIconUrl),
        folderId: 'folder_general'
      })
      await flashBadge('OK', '#10b981')
    } else if (info.menuItemId === 'saveit_save_link') {
      const linkUrl = info.linkUrl
      if (!linkUrl) return

      await saveBookmark({
        url: linkUrl,
        title: info.selectionText || linkUrl,
        thumbnail: null,
        favicon: getFaviconUrl(linkUrl, null),
        folderId: 'folder_general'
      })
      await flashBadge('LINK', '#3b82f6')
    }
  } catch (err) {
    console.error('SaveIt context menu error:', err)
    await flashBadge('ERR', '#ef4444')
  }
})

// CORS-bypassing background metadata fetcher using service worker host_permissions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'extract_preview') {
    handleExtractPreview(message.url).then(sendResponse)
    return true
  }
})

async function handleExtractPreview(url) {
  if (!url || !url.startsWith('http')) return null
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 6000)
    const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'text/html' } })
    clearTimeout(timer)
    if (!res.ok) return null

    const html = await res.text()
    const match = html.match(/<meta[^>]+(?:property|name)=["'](?:og:image|twitter:image)["'][^>]+content=["']([^"']+)["']/i)
    if (!match || !match[1]) return null

    const imgUrl = new URL(match[1], url).href
    const imgRes = await fetch(imgUrl)
    if (!imgRes.ok) return null

    const blob = await imgRes.blob()
    const buffer = await blob.arrayBuffer()
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)
    const mime = blob.type || 'image/jpeg'
    return `data:${mime};base64,${base64}`
  } catch {
    return null
  }
}

async function flashBadge(text, color) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color })
    await chrome.action.setBadgeText({ text })
    setTimeout(async () => {
      try {
        await chrome.action.setBadgeText({ text: '' })
      } catch {}
    }, 1500)
  } catch {}
}
