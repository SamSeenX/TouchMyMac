// Viewport capture, downscaling and WebP compression

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
