import { openDB } from 'idb'

const DB_NAME = 'fitness-tracker'
const DB_VERSION = 1

let dbPromise = null

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const stores = ['exercises', 'weight', 'cardio', 'alcohol']
        for (const storeName of stores) {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' })
            store.createIndex('date', 'date')
            store.createIndex('synced', 'synced')
            store.createIndex('lastModified', 'lastModified')
          }
        }
      }
    })
  }
  return dbPromise
}

export async function dbGetAll(storeName) {
  const db = await getDB()
  return db.getAll(storeName)
}

export async function dbGet(storeName, id) {
  const db = await getDB()
  return db.get(storeName, id)
}

export async function dbPut(storeName, item) {
  const db = await getDB()
  return db.put(storeName, { ...item, lastModified: item.lastModified || Date.now() })
}

export async function dbPutMany(storeName, items) {
  const db = await getDB()
  const tx = db.transaction(storeName, 'readwrite')
  await Promise.all(items.map(item => tx.store.put({ ...item, lastModified: item.lastModified || Date.now() })))
  await tx.done
}

export async function dbDelete(storeName, id) {
  const db = await getDB()
  return db.delete(storeName, id)
}

export async function dbGetUnsynced(storeName) {
  const db = await getDB()
  const all = await db.getAllFromIndex(storeName, 'synced', false)
  return all
}

export async function dbMarkSynced(storeName, ids) {
  const db = await getDB()
  const tx = db.transaction(storeName, 'readwrite')
  for (const id of ids) {
    const item = await tx.store.get(id)
    if (item) await tx.store.put({ ...item, synced: true })
  }
  await tx.done
}

export async function dbClear(storeName) {
  const db = await getDB()
  return db.clear(storeName)
}

export async function dbGetByDate(storeName, date) {
  const db = await getDB()
  return db.getAllFromIndex(storeName, 'date', date)
}
