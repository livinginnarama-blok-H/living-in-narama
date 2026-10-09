import { supabase } from '../lib/supabase'
import { AdminUser, AuthSession } from '../types/portal'

type AuthListener = (session: AuthSession) => void
const IDLE_TIMEOUT_MS = 60 * 60 * 1000
const ACTIVITY_STORAGE_KEY = 'narama_admin_last_activity'
const ACTIVITY_WRITE_THROTTLE_MS = 5_000

let idleCheckTimer: ReturnType<typeof setInterval> | null = null
let activityTrackingStarted = false
let lastActivityWrite = 0

function getLastActivity(): number {
  const stored = localStorage.getItem(ACTIVITY_STORAGE_KEY)
  const timestamp = stored ? Number(stored) : 0

  return Number.isFinite(timestamp) ? timestamp : 0
}

function recordActivity() {
  const now = Date.now()

  // Jangan menulis localStorage setiap event mousemove.
  if (now - lastActivityWrite < ACTIVITY_WRITE_THROTTLE_MS) {
    return
  }

  lastActivityWrite = now
  localStorage.setItem(ACTIVITY_STORAGE_KEY, String(now))
}

async function checkIdleTimeout() {
  if (!currentSession.isAuthenticated) {
    return
  }

  const lastActivity = getLastActivity()

  if (!lastActivity) {
    recordActivity()
    return
  }

  if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
    console.info('[AuthService] Session berakhir karena idle 1 jam.')
    stopIdleTracking()
    await supabase.auth.signOut()
  }
}

function startIdleTracking() {
  if (typeof window === 'undefined' || activityTrackingStarted) {
    return
  }

  activityTrackingStarted = true
  recordActivity()

  const activityEvents = [
    'click',
    'keydown',
    'mousemove',
    'scroll',
    'touchstart',
  ] as const

  activityEvents.forEach((eventName) => {
    window.addEventListener(eventName, recordActivity, {
      passive: true,
    })
  })

  idleCheckTimer = setInterval(() => {
    void checkIdleTimeout()
  }, 30_000)
}

function stopIdleTracking() {
  if (typeof window === 'undefined' || !activityTrackingStarted) {
    return
  }

  const activityEvents = [
    'click',
    'keydown',
    'mousemove',
    'scroll',
    'touchstart',
  ] as const

  activityEvents.forEach((eventName) => {
    window.removeEventListener(eventName, recordActivity)
  })

  

  if (idleCheckTimer) {
    clearInterval(idleCheckTimer)
    idleCheckTimer = null
  }

  activityTrackingStarted = false
}

const listeners: Set<AuthListener> = new Set()

let currentSession: AuthSession = {
  isAuthenticated: false,
  user: null,
  mode: 'supabase',
}

function notifyListeners(session: AuthSession) {
  currentSession = session

  listeners.forEach((listener) => {
    try {
      listener(session)
    } catch (error) {
      console.error('Error in auth listener:', error)
    }
  })
}

async function buildSession(): Promise<AuthSession> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return {
      isAuthenticated: false,
      user: null,
      mode: 'supabase',
    }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Profile pengguna tidak ditemukan:', profileError)

    return {
      isAuthenticated: false,
      user: null,
      mode: 'supabase',
    }
  }

  const adminUser: AdminUser = {
    id: user.id,
    username: user.email || '',
    name: profile.full_name || user.email || 'Pengguna',
    role: profile.role as AdminUser['role'],
    isDemo: false,
  }

  return {
    isAuthenticated: true,
    user: adminUser,
    mode: 'supabase',
  }
}

export const AuthService = {
  /**
   * Membaca session Supabase saat aplikasi pertama kali dibuka.
   */
  async initialize(): Promise<AuthSession> {
  const session = await buildSession()

  notifyListeners(session)

  if (session.isAuthenticated) {
    startIdleTracking()
  }

  return session
},

  /**
   * Mendapatkan session yang sedang aktif.
   */
  getCurrentSession(): AuthSession {
    return currentSession
  },

  /**
   * Login menggunakan Supabase Auth.
   */
  async login(
    email: string,
    password: string
  ): Promise<{
    success: boolean
    user?: AdminUser
    error?: string
  }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      console.error('Supabase login error:', error)

      return {
        success: false,
        error: error.message,
      }
    }

    if (!data.user) {
      return {
        success: false,
        error: 'Login gagal. Pengguna tidak ditemukan.',
      }
    }

    const session = await buildSession()

    if (!session.isAuthenticated || !session.user) {
      return {
        success: false,
        error:
          'Login berhasil, tetapi profil pengguna belum terdaftar.',
      }
    }

    notifyListeners(session)
    startIdleTracking()

    return {
      success: true,
      user: session.user,
    }
  },

  /**
   * Logout dari Supabase.
   */
  async logout(): Promise<void> {
  stopIdleTracking()

  const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Supabase logout error:', error)
    }

    notifyListeners({
      isAuthenticated: false,
      user: null,
      mode: 'supabase',
    })
  },

  /**
   * Mendengarkan perubahan session Supabase.
   */
  subscribe(listener: AuthListener): () => void {
    listeners.add(listener)

    listener(currentSession)

    return () => {
      listeners.delete(listener)
    }
  },

  /**
   * Listener session dari Supabase Auth.
   */
  setupAuthListener(): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED'
      ) {
        setTimeout(async () => {
        const session = await buildSession()

        if (session.isAuthenticated) {
          startIdleTracking()
        } else {
          stopIdleTracking()
        }

        notifyListeners(session)
      }, 0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  },
}