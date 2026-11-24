// Controller managing batch thumbnail generation banner and progress

import { BatchThumbnailQueue } from '../utils/thumbnail-generator.js'

export function setupBatchController({ triggerBtn, bannerEl, textEl, barEl, cancelBtn, bookmarksProvider }) {
  let queue = null

  triggerBtn.addEventListener('click', async () => {
    const bookmarks = bookmarksProvider()
    const missing = bookmarks.filter(b => !b.thumbnail)

    if (missing.length === 0) {
      alert('All bookmarks already have thumbnails!')
      return
    }

    bannerEl.style.display = 'flex'
    barEl.style.width = '0%'
    textEl.textContent = `Generating thumbnails: 0/${missing.length}`

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

    await queue.start(bookmarks)
  })

  cancelBtn.addEventListener('click', () => {
    if (queue) queue.stop()
    bannerEl.style.display = 'none'
  })
}
