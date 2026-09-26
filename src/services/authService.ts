/**
 * Authentication Service (Demo-Only)
 * 
 * ⚠️ ARCHITECTURAL NOTICE:
 * This is a DEMO-ONLY authentication simulation designed for testing
 * and interface demonstration purposes.
 * 
 * In production when deploying with Cloudflare Workers:
 * 1. Do NOT use hardcoded credentials or plain localStorage tokens.
 * 2. Replace this implementation with Cloudflare Zero Trust / Cloudflare Access,
 *    or a secure HTTP-Only cookie session backed by Cloudflare D1 + Web Crypto API (Argon2id/bcrypt).
 * 3. Never expose admin rights on the client without cryptographic server verification.
 */

import { AdminUser, DemoCredentials, AuthSession } from '../types/portal';

const DEMO_STORAGE_KEY = 'narama_blok_h_demo_auth_session';

export const DEMO_CREDENTIALS: DemoCredentials = {
  username: 'admin',
  password: 'narama2026',
};

export const DEMO_ADMIN_USER: AdminUser = {
  id: 'usr_demo_admin_h',
  username: 'admin',
  name: 'Pengurus Paguyuban Blok H',
  role: 'pengurus_rt',
  isDemo: true,
};

type AuthListener = (session: AuthSession) => void;
const listeners: Set<AuthListener> = new Set();

function notifyListeners(session: AuthSession) {
  listeners.forEach((listener) => {
    try {
      listener(session);
    } catch (e) {
      console.error('Error in auth listener:', e);
    }
  });
}

export const AuthService = {
  /**
   * Check if a demo session is currently active
   */
  isDemoAuthenticated(): boolean {
    try {
      return localStorage.getItem(DEMO_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  },

  /**
   * Retrieve current session metadata
   */
  getCurrentSession(): AuthSession {
    const isAuth = this.isDemoAuthenticated();
    return {
      isAuthenticated: isAuth,
      user: isAuth ? { ...DEMO_ADMIN_USER, lastLogin: new Date().toISOString() } : null,
      mode: 'demo',
    };
  },

  /**
   * Simulate demo login (asynchronous contract ready for future Worker fetch('/api/auth/login'))
   */
  async loginDemo(credentials: DemoCredentials): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
    // Artificial micro-delay to simulate API roundtrip
    await new Promise((resolve) => setTimeout(resolve, 150));

    if (
      credentials.username.trim() === DEMO_CREDENTIALS.username &&
      credentials.password === DEMO_CREDENTIALS.password
    ) {
      try {
        localStorage.setItem(DEMO_STORAGE_KEY, 'true');
      } catch (err) {
        console.warn('Storage unavailable for demo session:', err);
      }

      const session = this.getCurrentSession();
      notifyListeners(session);

      return {
        success: true,
        user: DEMO_ADMIN_USER,
      };
    }

    return {
      success: false,
      error: 'Username atau kata sandi tidak cocok. Gunakan kredensial demo (admin / narama2026).',
    };
  },

  /**
   * Clear demo session
   */
  logoutDemo(): void {
    try {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    } catch (err) {
      console.warn('Storage error on logout:', err);
    }

    notifyListeners({
      isAuthenticated: false,
      user: null,
      mode: 'demo',
    });
  },

  /**
   * Subscribe to auth session changes
   */
  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    // Provide current state immediately
    listener(this.getCurrentSession());
    return () => {
      listeners.delete(listener);
    };
  },
};
