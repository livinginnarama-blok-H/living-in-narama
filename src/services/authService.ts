import { supabase } from '../lib/supabase'
import { AdminUser, AuthSession } from '../types/portal'

type AuthListener = (session: AuthSession) => void

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

    return {
      success: true,
      user: session.user,
    }
  },

  /**
   * Logout dari Supabase.
   */
  async logout(): Promise<void> {
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
          notifyListeners(session)
        }, 0)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  },
}