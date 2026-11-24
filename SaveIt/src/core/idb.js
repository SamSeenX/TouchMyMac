// Native IndexedDB Promise wrapper for SaveIt

const DB_NAME = 'SaveItDB'
const DB_VERSION = 1

let dbInstance = null

export function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance)

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('bookmarks')) {
        const bmStore = db.createObjectStore('bookmarks', { keyPath: 'id' })
        bmStore.createIndex('url', 'url', { unique: false })
        bmStore.createIndex('folderId', 'folderId', { unique: false })
        bmStore.createIndex('createdAt', 'createdAt', { unique: false })
      }

      if (!db.objectStoreNames.contains('folders')) {
        const fStore = db.createObjectStore('folders', { keyPath: 'id' })
        fStore.createIndex('name', 'name', { unique: false })
        fStore.createIndex('parentId', 'parentId', { unique: false })
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' })
      }
    }

    request.onsuccess = (event) => {
      dbInstance = event.target.result
      resolve(dbInstance)
    }

    request.onerror = (event) => {
      reject(event.target.error)
    }
  })
}

export async function tx(storeName, mode, callback) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    let result = null

    transaction.oncomplete = () => resolve(result)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)

    try {
      result = callback(store)
    } catch (err) {
      reject(err)
    }
  })
}

export async function get(storeName, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).get(key)
    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function getAll(storeName) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly')
    const request = transaction.objectStore(storeName).getAll()
    request.onsuccess = () => resolve(request.result || [])
    request.onerror = () => reject(request.error)
  })
}

export async function put(storeName, item) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const request = transaction.objectStore(storeName).put(item)
    request.onsuccess = () => resolve(item)
    request.onerror = () => reject(request.error)
  })
}

export async function del(storeName, key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite')
    const request = transaction.objectStore(storeName).delete(key)
    request.onsuccess = () => resolve(true)
    request.onerror = () => reject(request.error)
  })
}
