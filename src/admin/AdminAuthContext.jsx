import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

/**
 * Admin authentication.
 *
 * Deliberately separate from the storefront's `AuthContext`. The two differ in
 * one important way: the storefront can fall back to a clearly-labelled local
 * demo session so visitors can walk the checkout before Supabase exists. That
 * is fine for browsing a shop, and completely unacceptable for an admin panel,
 * because a local demo session is exactly the kind of frontend-only admin flag
 * that must not gate a protected area.
 *
 * So this context reads two things and nothing else:
 *
 *   1. the real Supabase auth session (`supabase.auth.getSession()`)
 *   2. the `role` column on that user's row in `public.profiles`
 *
 * It never writes an admin marker to storage, and it never grants access when
 * Supabase is not configured. `AdminGuard` turns on `isAdmin` from here.
 */

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

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
      setLoading(false)
      return undefined
    }

    let active = true
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!active) return
      setSession(s)
      loadProfile(s?.user ?? null).finally(() => { if (active) setLoading(false) })
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      loadProfile(s?.user ?? null)
    })

    // Browser back/forward can restore a page from the bfcache *without*
    // re-running React, so the guard never gets a chance to re-check. If the
    // session was cleared while we were in the background, the restored view
    // would still be showing admin data -- re-verify on every restore and send
    // it back to the login screen.
    const onPageShow = async (event) => {
      if (!event.persisted) return
      if (!window.location.pathname.startsWith('/admin')) return
      const { data: { session: s } } = await supabase.auth.getSession()
      if (!s) window.location.replace('/admin/login')
    }
    window.addEventListener('pageshow', onPageShow)

    return () => {
      active = false
      sub.subscription.unsubscribe()
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [loadProfile])

  const value = useMemo(() => {
    const user = session?.user ?? null
    const role = profile?.role ?? 'customer'

    return {
      user,
      session,
      profile,
      role,
      /** The only signal `AdminGuard` trusts. Sourced from the database. */
      isAdmin: role === 'admin',
      loading,
      isConfigured: isSupabaseConfigured,

      async signIn({ email, password }) {
        if (!isSupabaseConfigured) {
          return { ok: false, error: 'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local.' }
        }
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { ok: false, error: error.message }
        // Sign-in succeeded, but authenticate is not authorize: read the role
        // from profiles before returning so a customer is told immediately
        // instead of being bounced by the guard a moment later.
        const p = await loadProfile(data.user)
        if (p && p.role !== 'admin') {
          return { ok: false, error: 'This account does not have admin access.', notAdmin: true }
        }
        return { ok: true }
      },

      async sendResetLink(email) {
        if (!isSupabaseConfigured) return { ok: false, error: 'Supabase is not configured.' }
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/login`,
        })
        if (error) return { ok: false, error: error.message }
        return { ok: true }
      },

      async signOut() {
        if (!isSupabaseConfigured) return
        await supabase.auth.signOut()
        setSession(null)
        setProfile(null)
      },

      /** Admin profile edits. Never exposes a way to change another user. */
      async updateProfile(patch) {
        if (!user) return { ok: false, error: 'Not signed in.' }
        const { data, error } = await supabase
          .from('profiles').update(patch).eq('id', user.id).select().maybeSingle()
        if (error) return { ok: false, error: error.message }
        setProfile(data)
        return { ok: true, data }
      },

      /**
       * Password change goes through Supabase Auth, not the profiles table --
       * the password hash lives in auth.users and is not readable or writable
       * from here. The admin can only change their OWN password: Supabase
       * requires the current password unless the caller is a service role.
       */
      async changePassword(currentPassword, newPassword) {
        if (!user) return { ok: false, error: 'Not signed in.' }
        if (!currentPassword) return { ok: false, error: 'Enter your current password.' }
        if (!newPassword || newPassword.length < 8) {
          return { ok: false, error: 'New password must be at least 8 characters.' }
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email, password: currentPassword,
        })
        if (signInError) return { ok: false, error: 'Current password is incorrect.' }

        const { error } = await supabase.auth.updateUser({ password: newPassword })
        if (error) return { ok: false, error: error.message }
        return { ok: true }
      },

      refreshProfile: () => loadProfile(user),
    }
  }, [session, profile, loading, loadProfile])

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>')
  return ctx
}
