import { initializeApp } from 'firebase/app'
import { getDatabase, ref, set, get, update, onValue, off } from 'firebase/database'
import { getAuth, signInAnonymously, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'

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
const googleProvider = new GoogleAuthProvider()

if (FIREBASE_CONFIGURED) {
  app = initializeApp(firebaseConfig)
  db = getDatabase(app)
  auth = getAuth(app)
}

export async function firebaseSignIn() {
  if (!FIREBASE_CONFIGURED || !auth) return null
  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub()
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

// Throws a Firebase auth error — callers must catch and inspect e.code
export async function firebaseGoogleSignIn() {
  if (!FIREBASE_CONFIGURED || !auth) throw new Error('Firebase not configured')
  const result = await signInWithPopup(auth, googleProvider)
  currentUser = result.user
  return result.user
}

// Used when popup is blocked (e.g. mobile browsers / installed PWA)
export async function firebaseGoogleSignInRedirect() {
  if (!FIREBASE_CONFIGURED || !auth) return
  await signInWithRedirect(auth, googleProvider)
}

// Call once on app start to collect the redirect result if present
export async function firebaseGetRedirectResult() {
  if (!FIREBASE_CONFIGURED || !auth) return null
  try {
    const result = await getRedirectResult(auth)
    if (result?.user) {
      currentUser = result.user
      return result.user
    }
    return null
  } catch (e) {
    console.warn('Redirect sign-in result error:', e.code, e.message)
    return null
  }
}

export async function firebaseSignOut() {
  if (!FIREBASE_CONFIGURED || !auth) return
  await signOut(auth)
  currentUser = null
}

export function onAuthUser(callback) {
  if (!FIREBASE_CONFIGURED || !auth) return () => {}
  return onAuthStateChanged(auth, (user) => {
    currentUser = user
    callback(user)
  })
}

export function getCurrentUser() {
  return currentUser
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
