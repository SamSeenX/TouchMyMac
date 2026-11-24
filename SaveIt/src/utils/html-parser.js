// Parser for standard Netscape Bookmark HTML files (Chrome, Safari, Firefox, Edge)

export function parseNetscapeHtml(htmlContent) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')

  const results = {
    folders: new Map(),
    bookmarks: []
  }

  function traverse(container, currentFolder = 'General') {
    const children = Array.from(container.children)

    for (let i = 0; i < children.length; i++) {
      const el = children[i]
      const tagName = el.tagName.toUpperCase()

      if (tagName === 'DT') {
        const h3 = el.querySelector(':scope > H3, :scope > h3')
        const a = el.querySelector(':scope > A, :scope > a')
        const dl = el.querySelector(':scope > DL, :scope > dl')

        if (h3) {
          const folderName = h3.textContent.trim() || 'Imported'
          results.folders.set(folderName, true)

          if (dl) {
            traverse(dl, folderName)
          } else if (i + 1 < children.length && children[i + 1].tagName.toUpperCase() === 'DL') {
            traverse(children[i + 1], folderName)
            i++
          }
        } else if (a) {
          const url = a.getAttribute('href')
          if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            const title = a.textContent.trim() || url
            const icon = a.getAttribute('icon') || a.getAttribute('ICON')
            const addDate = a.getAttribute('add_date') || a.getAttribute('ADD_DATE')

            results.bookmarks.push({
              url,
              title,
              favicon: icon || null,
              folderName: currentFolder,
              createdAt: addDate ? parseInt(addDate, 10) * 1000 : Date.now(),
              labels: ['imported']
            })
          }
        }
      } else if (tagName === 'DL') {
        traverse(el, currentFolder)
      }
    }
  }

  const rootDl = doc.querySelector('dl, DL')
  if (rootDl) {
    traverse(rootDl, 'General')
  } else {
    // Fallback: search all anchor tags directly
    const anchors = doc.querySelectorAll('a[href]')
    anchors.forEach(a => {
      const url = a.getAttribute('href')
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        results.bookmarks.push({
          url,
          title: a.textContent.trim() || url,
          favicon: a.getAttribute('icon') || null,
          folderName: 'General',
          createdAt: Date.now(),
          labels: ['imported']
        })
      }
    })
  }

  return {
    folderNames: Array.from(results.folders.keys()),
    bookmarks: results.bookmarks
  }
}
