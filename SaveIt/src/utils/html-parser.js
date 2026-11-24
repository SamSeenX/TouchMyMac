// Parser for Netscape Bookmark HTML files with full nested subfolder hierarchy support

export function parseNetscapeHtml(htmlContent) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')

  const folderTree = []
  const bookmarks = []
  let folderIdCounter = 1

  function traverse(dlElement, parentFolderId = null, path = []) {
    const children = Array.from(dlElement.children)

    for (let i = 0; i < children.length; i++) {
      const el = children[i]
      const tagName = el.tagName.toUpperCase()

      if (tagName === 'DT') {
        const h3 = el.querySelector(':scope > H3, :scope > h3')
        const a = el.querySelector(':scope > A, :scope > a')
        const nextDl = el.querySelector(':scope > DL, :scope > dl')

        if (h3) {
          const folderName = h3.textContent.trim() || 'Folder'
          const currentFolderId = `imp_f_${folderIdCounter++}`
          const currentPath = [...path, folderName]

          folderTree.push({
            tempId: currentFolderId,
            name: folderName,
            parentId: parentFolderId,
            pathKey: currentPath.join(' / ')
          })

          let targetDl = nextDl
          if (!targetDl && i + 1 < children.length && children[i + 1].tagName.toUpperCase() === 'DL') {
            targetDl = children[i + 1]
            i++
          }

          if (targetDl) {
            traverse(targetDl, currentFolderId, currentPath)
          }
        } else if (a) {
          const url = a.getAttribute('href')
          if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            const title = a.textContent.trim() || url
            const icon = a.getAttribute('icon') || a.getAttribute('ICON')
            const addDate = a.getAttribute('add_date') || a.getAttribute('ADD_DATE')

            bookmarks.push({
              url,
              title,
              favicon: icon || null,
              parentFolderTempId: parentFolderId,
              createdAt: addDate ? parseInt(addDate, 10) * 1000 : Date.now()
            })
          }
        }
      } else if (tagName === 'DL') {
        traverse(el, parentFolderId, path)
      }
    }
  }

  const rootDl = doc.querySelector('dl, DL')
  if (rootDl) {
    traverse(rootDl, null, [])
  } else {
    const anchors = doc.querySelectorAll('a[href]')
    anchors.forEach(a => {
      const url = a.getAttribute('href')
      if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        bookmarks.push({
          url,
          title: a.textContent.trim() || url,
          favicon: a.getAttribute('icon') || null,
          parentFolderTempId: null,
          createdAt: Date.now()
        })
      }
    })
  }

  return { folderTree, bookmarks }
}
