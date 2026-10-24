import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Authentication.
 *
 * With Supabase configured this delegates to supabase.auth (email + password).
 * Without it, a clearly-labelled demo session is used so you can walk the
 * account/orders/admin flows before creating a project. The demo session is
 * intentionally local-only and never grants real access.
 */

const AuthContext = createContext(null)

const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@footballtrix.com',
  full_name: 'Demo Customer',
  phone: '01700000000',
  role: 'customer',
}

const DEMO_SESSION_KEY = 'ftx.demo.session'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  /** Load the profile row (which carries `role`) for a given auth user. */
  const loadProfile = useCallback(async (authUser) => {
    if (!isSupabaseConfigured || !authUser) {
      setProfile(null)
      return null
    }
    const { data } = await supabase
      .from('profiles').select('*').eq('id', authUser.id).maybeSingle()
    setProfile(data)
    return data
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      try {
        if (localStorage.getItem(DEMO_SESSION_KEY) === '1') setUser(DEMO_USER)
      } catch { /* storage unavailable */ }
      setLoading(false)
      return
    }

    let active = true
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null).finally(() => active && setLoading(false))
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      loadProfile(session?.user ?? null)
    })

    return () => { active = false; sub.subscription.unsubscribe() }
  }, [loadProfile])

  const value = useMemo(() => {
    const role = profile?.role ?? user?.role ?? 'customer'

    const signIn = async ({ email, password }) => {
      if (!isSupabaseConfigured) {
        try { localStorage.setItem(DEMO_SESSION_KEY, '1') } catch { /* noop */ }
        setUser(DEMO_USER)
        return { ok: true, demo: true }
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    }

    const signUp = async ({ name, email, phone, password }) => {
      if (!isSupabaseConfigured) {
        try { localStorage.setItem(DEMO_SESSION_KEY, '1') } catch { /* noop */ }
        setUser({ ...DEMO_USER, email, full_name: name, phone })
        return { ok: true, demo: true }
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, phone },
          emailRedirectTo: `${window.location.origin}/my-account`,
        },
      })
      if (error) return { ok: false, error: error.message }
      // Supabase sends a confirmation email; no session means it is pending.
      if (!data.session) {
        return { ok: true, needsConfirmation: true }
      }
      return { ok: true }
    }

    const signOut = async () => {
      if (!isSupabaseConfigured) {
        try { localStorage.removeItem(DEMO_SESSION_KEY) } catch { /* noop */ }
        setUser(null)
        return
      }
      await supabase.auth.signOut()
    }

    const signInWithGoogle = async () => {
      if (!isSupabaseConfigured) {
        return { ok: false, error: 'Google sign-in needs Supabase to be connected.' }
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/my-account` },
      })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    }

    /**
     * Ask Supabase to send a real password-recovery email. The link in that
     * email points at `/reset-password`, where supabase-js exchanges the token
     * for a short-lived recovery session. No token is ever stored on our side.
     */
    const resetPassword = async (email) => {
      if (!isSupabaseConfigured) {
        return { ok: false, error: 'Supabase is not configured, so reset emails cannot be sent.' }
      }
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    }

    /** Apply a new password to the user of the current recovery session. */
    const updatePassword = async (password) => {
      if (!isSupabaseConfigured) {
        return { ok: false, error: 'Supabase is not configured.' }
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) return { ok: false, error: error.message }
      return { ok: true }
    }

    return {
      user,
      profile,
      role,
      isAdmin: role === 'admin',
      loading,
      isDemo: !isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      signInWithGoogle,
      resetPassword,
      updatePassword,
      refreshProfile: () => loadProfile(user),
    }
  }, [user, profile, loading, loadProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
