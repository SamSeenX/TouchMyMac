// Controller managing batch thumbnail generation banner and progress

import { BatchThumbnailQueue } from '../utils/thumbnail-generator.js'

export function setupBatchController({ triggerBtn, bannerEl, textEl, barEl, cancelBtn, bookmarksProvider }) {
  let queue = null

  triggerBtn.addEventListener('click', async () => {
    const bookmarks = bookmarksProvider()
    if (!bookmarks || bookmarks.length === 0) {
      alert('No bookmarks to process.')
      return
    }

    const missing = bookmarks.filter(b => !b.thumbnail)
    let targets = missing

    if (missing.length === 0) {
      const forceAll = confirm(`All ${bookmarks.length} bookmarks have thumbnails. Would you like to force regenerate all of them?`)
      if (!forceAll) return
      targets = bookmarks
    } else if (missing.length < bookmarks.length) {
      const choice = confirm(`Found ${missing.length} bookmarks missing thumbnails (out of ${bookmarks.length}).\n\nClick OK to fetch only missing thumbnails.\nClick Cancel to regenerate ALL ${bookmarks.length} thumbnails.`)
      targets = choice ? missing : bookmarks
    }

    bannerEl.style.display = 'flex'
    barEl.style.width = '0%'
    textEl.textContent = `Generating thumbnails: 0/${targets.length}`

    queue = new BatchThumbnailQueue({
      onProgress: ({ completed, total }) => {
        textEl.textContent = `Generating thumbnails: ${completed}/${total}`
        barEl.style.width = `${Math.round((completed / total) * 100)}%`
      },
      onComplete: (count) => {
        textEl.textContent = `Finished generating ${count} thumbnails!`
        barEl.style.width = '100%'
        setTimeout(() => {
          bannerEl.style.display = 'none'
        }, 2500)
      }
    })

    await queue.start(targets)
  })

  cancelBtn.addEventListener('click', () => {
    if (queue) queue.stop()
    bannerEl.style.display = 'none'
  })
}
