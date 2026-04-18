import { createContext, useContext, useEffect, useReducer, useState, useCallback } from 'react'
import { dbGetAll, dbPut, dbDelete, dbPutMany } from '../lib/db'
import { firebaseSignIn, firebaseGoogleSignIn, firebaseSignOut, onAuthUser, FIREBASE_CONFIGURED } from '../lib/firebase'
import { onSyncState, startSyncSchedule, syncNow } from '../lib/sync'
import { SEED_EXERCISES, SEED_WEIGHT, SEED_CARDIO, SEED_ALCOHOL } from '../data/seedData'

const AppContext = createContext(null)

const initialState = {
  exercises: [],
  weight: [],
  cardio: [],
  alcohol: [],
  loading: true,
  seeded: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_ALL':
      return { ...state, ...action.payload, loading: false }
    case 'ADD_EXERCISE':
      return { ...state, exercises: [action.payload, ...state.exercises.filter(e => e.id !== action.payload.id)] }
    case 'UPDATE_EXERCISE':
      return { ...state, exercises: state.exercises.map(e => e.id === action.payload.id ? action.payload : e) }
    case 'DELETE_EXERCISE':
      return { ...state, exercises: state.exercises.filter(e => e.id !== action.payload) }
    case 'ADD_WEIGHT':
      return { ...state, weight: [action.payload, ...state.weight.filter(e => e.id !== action.payload.id)] }
    case 'DELETE_WEIGHT':
      return { ...state, weight: state.weight.filter(e => e.id !== action.payload) }
    case 'ADD_CARDIO':
      return { ...state, cardio: [action.payload, ...state.cardio.filter(e => e.id !== action.payload.id)] }
    case 'DELETE_CARDIO':
      return { ...state, cardio: state.cardio.filter(e => e.id !== action.payload) }
    case 'ADD_ALCOHOL':
      return { ...state, alcohol: [action.payload, ...state.alcohol.filter(e => e.id !== action.payload.id)] }
    case 'DELETE_ALCOHOL':
      return { ...state, alcohol: state.alcohol.filter(e => e.id !== action.payload) }
    case 'RELOAD_STORE':
      return { ...state, [action.store]: action.payload }
    default:
      return state
  }
}

const SEEDED_KEY = 'fitness_seeded_v1'

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [syncState, setSyncState] = useState({ isSyncing: false, lastSyncTime: null, pendingCount: 0 })
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [settings, setSettingsState] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fitness_settings') || '{}') } catch { return {} }
  })

  const updateSettings = useCallback((updates) => {
    setSettingsState(prev => {
      const next = { ...prev, ...updates }
      localStorage.setItem('fitness_settings', JSON.stringify(next))
      return next
    })
  }, [])

  // Load all data from IndexedDB
  const loadAll = useCallback(async () => {
    const [exercises, weight, cardio, alcohol] = await Promise.all([
      dbGetAll('exercises'),
      dbGetAll('weight'),
      dbGetAll('cardio'),
      dbGetAll('alcohol'),
    ])
    dispatch({ type: 'LOAD_ALL', payload: { exercises, weight, cardio, alcohol } })
  }, [])

  // Seed initial data if never seeded
  const seedIfNeeded = useCallback(async () => {
    const seeded = localStorage.getItem(SEEDED_KEY)
    if (seeded) return
    await Promise.all([
      dbPutMany('exercises', SEED_EXERCISES),
      dbPutMany('weight', SEED_WEIGHT),
      dbPutMany('cardio', SEED_CARDIO),
      dbPutMany('alcohol', SEED_ALCOHOL),
    ])
    localStorage.setItem(SEEDED_KEY, '1')
  }, [])

  useEffect(() => {
    let stopSync = null
    let unsubSync = null
    let unsubAuth = null

    async function init() {
      await seedIfNeeded()
      await loadAll()
      if (FIREBASE_CONFIGURED) {
        await firebaseSignIn()
        stopSync = startSyncSchedule()
        unsubSync = onSyncState(setSyncState)
        unsubAuth = onAuthUser((user) => {
          setFirebaseUser(user)
        })
      }
    }

    init()
    return () => { stopSync?.(); unsubSync?.(); unsubAuth?.() }
  }, [])

  const googleSignIn = useCallback(async () => {
    const user = await firebaseGoogleSignIn()
    if (user) {
      setFirebaseUser(user)
      await syncNow()
      await loadAll()
    }
    return user
  }, [loadAll])

  const signOut = useCallback(async () => {
    await firebaseSignOut()
    setFirebaseUser(null)
  }, [])

  // Actions
  const addExercise = useCallback(async (item) => {
    await dbPut('exercises', item)
    dispatch({ type: 'ADD_EXERCISE', payload: item })
    if (FIREBASE_CONFIGURED) syncNow()
  }, [])

  const deleteExercise = useCallback(async (id) => {
    await dbDelete('exercises', id)
    dispatch({ type: 'DELETE_EXERCISE', payload: id })
  }, [])

  const addWeight = useCallback(async (item) => {
    await dbPut('weight', item)
    dispatch({ type: 'ADD_WEIGHT', payload: item })
    if (FIREBASE_CONFIGURED) syncNow()
  }, [])

  const deleteWeight = useCallback(async (id) => {
    await dbDelete('weight', id)
    dispatch({ type: 'DELETE_WEIGHT', payload: id })
  }, [])

  const addCardio = useCallback(async (item) => {
    await dbPut('cardio', item)
    dispatch({ type: 'ADD_CARDIO', payload: item })
    if (FIREBASE_CONFIGURED) syncNow()
  }, [])

  const deleteCardio = useCallback(async (id) => {
    await dbDelete('cardio', id)
    dispatch({ type: 'DELETE_CARDIO', payload: id })
  }, [])

  const addAlcohol = useCallback(async (item) => {
    await dbPut('alcohol', item)
    dispatch({ type: 'ADD_ALCOHOL', payload: item })
    if (FIREBASE_CONFIGURED) syncNow()
  }, [])

  const deleteAlcohol = useCallback(async (id) => {
    await dbDelete('alcohol', id)
    dispatch({ type: 'DELETE_ALCOHOL', payload: id })
  }, [])

  const reloadAll = useCallback(async () => {
    await loadAll()
  }, [loadAll])

  return (
    <AppContext.Provider value={{
      ...state,
      syncState,
      firebaseUser,
      googleSignIn,
      signOut,
      settings,
      updateSettings,
      addExercise,
      deleteExercise,
      addWeight,
      deleteWeight,
      addCardio,
      deleteCardio,
      addAlcohol,
      deleteAlcohol,
      reloadAll,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
