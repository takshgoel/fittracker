import { dbGetUnsynced, dbPutMany, dbMarkSynced, dbGetAll } from './db'
import { firebasePushItems, firebaseFetchAll, FIREBASE_CONFIGURED } from './firebase'

const STORES = ['exercises', 'weight', 'cardio', 'alcohol']
let syncTimer = null
let isSyncing = false
let syncListeners = []
let lastSyncTime = null
let pendingCount = 0

export function onSyncState(cb) {
  syncListeners.push(cb)
  return () => { syncListeners = syncListeners.filter(l => l !== cb) }
}

function emit(state) {
  syncListeners.forEach(cb => cb(state))
}

export function getSyncState() {
  return { isSyncing, lastSyncTime, pendingCount }
}

export async function countPending() {
  let count = 0
  for (const store of STORES) {
    const unsynced = await dbGetUnsynced(store)
    count += unsynced.length
  }
  pendingCount = count
  return count
}

export async function syncNow() {
  if (!FIREBASE_CONFIGURED || isSyncing) return
  isSyncing = true
  emit({ isSyncing: true, lastSyncTime, pendingCount })

  try {
    // Push unsynced local items
    for (const store of STORES) {
      const unsynced = await dbGetUnsynced(store)
      if (unsynced.length > 0) {
        await firebasePushItems(store, unsynced)
        await dbMarkSynced(store, unsynced.map(i => i.id))
      }
    }

    // Pull from Firebase and merge (last-write-wins)
    for (const store of STORES) {
      const cloudData = await firebaseFetchAll(store)
      const localData = await dbGetAll(store)
      const localMap = Object.fromEntries(localData.map(i => [i.id, i]))
      const merged = []

      for (const [id, cloudItem] of Object.entries(cloudData)) {
        const local = localMap[id]
        if (!local || cloudItem.lastModified > local.lastModified) {
          merged.push({ ...cloudItem, synced: true })
        }
      }
      if (merged.length > 0) await dbPutMany(store, merged)
    }

    lastSyncTime = Date.now()
    pendingCount = 0
    isSyncing = false
    emit({ isSyncing: false, lastSyncTime, pendingCount })
  } catch (err) {
    console.warn('Sync error:', err)
    isSyncing = false
    emit({ isSyncing: false, lastSyncTime, pendingCount, error: err.message })
  }
}

export function startSyncSchedule() {
  if (!FIREBASE_CONFIGURED) return
  clearInterval(syncTimer)
  syncNow()
  syncTimer = setInterval(syncNow, 30_000)

  window.addEventListener('online', syncNow)
  window.addEventListener('focus', syncNow)

  return () => {
    clearInterval(syncTimer)
    window.removeEventListener('online', syncNow)
    window.removeEventListener('focus', syncNow)
  }
}
