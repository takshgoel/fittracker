import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, update, onValue, off } from 'firebase/database'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Detect if Firebase is configured
export const FIREBASE_CONFIGURED = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_DATABASE_URL
)

let app = null
let db = null
let auth = null
let currentUser = null

if (FIREBASE_CONFIGURED) {
  app = initializeApp(firebaseConfig)
  db = getDatabase(app)
  auth = getAuth(app)
}

export async function firebaseSignIn() {
  if (!FIREBASE_CONFIGURED || !auth) return null
  return new Promise((resolve) => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        currentUser = user
        resolve(user)
      } else {
        try {
          const result = await signInAnonymously(auth)
          currentUser = result.user
          resolve(result.user)
        } catch (e) {
          console.warn('Firebase auth failed:', e.message)
          resolve(null)
        }
      }
    })
  })
}

export function getUserRef(path) {
  if (!db || !currentUser) return null
  return ref(db, `users/${currentUser.uid}/${path}`)
}

export async function firebasePushItems(storeName, items) {
  if (!db || !currentUser || items.length === 0) return
  const updates = {}
  for (const item of items) {
    updates[`users/${currentUser.uid}/${storeName}/${item.id}`] = { ...item, synced: true }
  }
  await update(ref(db), updates)
}

export async function firebaseFetchAll(storeName) {
  if (!db || !currentUser) return {}
  const snapshot = await get(ref(db, `users/${currentUser.uid}/${storeName}`))
  return snapshot.val() || {}
}

export function firebaseListenStore(storeName, callback) {
  if (!db || !currentUser) return () => {}
  const storeRef = ref(db, `users/${currentUser.uid}/${storeName}`)
  onValue(storeRef, (snapshot) => callback(snapshot.val() || {}))
  return () => off(storeRef)
}

export async function firebaseDeleteItem(storeName, id) {
  if (!db || !currentUser) return
  await set(ref(db, `users/${currentUser.uid}/${storeName}/${id}`), null)
}
