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
      } catch {
        // Tab capture might be restricted on chrome:// URLs
      }

      await saveBookmark({
        url: tab.url,
        title: tab.title || tab.url,
        thumbnail,
        favicon: getFaviconUrl(tab.url, tab.favIconUrl),
        folderId: 'folder_general',
        labels: ['quick-save']
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
        folderId: 'folder_general',
        labels: ['link-save']
      })
      await flashBadge('LINK', '#3b82f6')
    }
  } catch (err) {
    console.error('SaveIt context menu error:', err)
    await flashBadge('ERR', '#ef4444')
  }
})

async function flashBadge(text, color) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color })
    await chrome.action.setBadgeText({ text })
    setTimeout(async () => {
      try {
        await chrome.action.setBadgeText({ text: '' })
      } catch {
        // Service worker might suspend
      }
    }, 1500)
  } catch {
    // Ignore badge errors if action is inactive
  }
}
