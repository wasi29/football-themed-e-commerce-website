import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { PageHeader, Toast } from './components/Page'
import { useAdminAuth } from './AdminAuthContext'
import { formatDateTime } from '../lib/format'

/**
 * The signed-in admin's own account.
 *
 * Deliberately scoped to `user.id`: `updateProfile` writes only to the caller's
 * row and `changePassword` re-authenticates with the current password first,
 * because Supabase refuses a password change without it outside of the
 * service-role path. There is no way from this screen to touch another user.
 */
export default function AdminProfile() {
  const { profile, user, updateProfile, changePassword, signOut } = useAdminAuth()
  const navigate = useNavigate()

  const [identity, setIdentity] = useState({ full_name: '', phone: '' })
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    document.title = 'Admin profile — FootballTrix Admin'
    setIdentity({
      full_name: profile?.full_name ?? '',
      phone: profile?.phone ?? '',
    })
  }, [profile])

  async function saveIdentity(event) {
    event.preventDefault()
    setBusy(true)
    const result = await updateProfile({
      full_name: identity.full_name.trim(),
      phone: identity.phone.trim() || null,
    })
    setBusy(false)
    setToast(result.ok
      ? { tone: 'ok', text: 'Your profile was updated.' }
      : { tone: 'error', text: result.error })
  }

  async function savePassword(event) {
    event.preventDefault()
    if (passwords.next !== passwords.confirm) {
      setToast({ tone: 'error', text: 'The new password and its confirmation do not match.' })
      return
    }
    setBusy(true)
    const result = await changePassword(passwords.current, passwords.next)
    setBusy(false)
    if (result.ok) {
      setPasswords({ current: '', next: '', confirm: '' })
      setToast({ tone: 'ok', text: 'Password changed. Use it the next time you sign in.' })
    } else {
      setToast({ tone: 'error', text: result.error })
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/admin/login', { replace: true })
  }

  const initials = (profile?.full_name || profile?.email || '?')
    .split(/[\s@._-]+/).filter(Boolean)
    .slice(0, 2).map((part) => part[0].toUpperCase()).join('')

  return (
    <>
      <PageHeader
        title="Admin profile"
        lede="Your own account details and password."
        actions={
          <button type="button" onClick={handleSignOut} className="adm-btn-outline">
            <Icon name="logout" size={16} />
            Logout
          </button>
        }
      />

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* -------------------------------------------------------- identity */}
        <section className="adm-card adm-card-pad">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-ink-950 font-display text-2xl font-extrabold text-lime-accent dark:bg-lime-accent dark:text-ink-950">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="truncate font-bold text-ink-950 dark:text-white">
                {profile?.full_name || 'Unnamed admin'}
              </p>
              <p className="truncate text-sm text-ink-600 dark:text-ink-400">{profile?.email}</p>
              <span className="mt-1.5 inline-block adm-badge adm-badge-accent">{profile?.role}</span>
            </div>
          </div>

          <dl className="adm-divider mt-5 space-y-3 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="adm-muted">Account created</dt>
              <dd className="text-right font-medium text-ink-800 dark:text-ink-200">
                {profile?.created_at ? formatDateTime(profile.created_at) : '—'}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="adm-muted">User ID</dt>
              <dd className="truncate font-mono text-[11px] text-ink-600 dark:text-ink-400">{user?.id}</dd>
            </div>
          </dl>
        </section>

        {/* ------------------------------------------------------ edit forms */}
        <div className="space-y-5 lg:col-span-2">
          <section className="adm-card adm-card-pad">
            <h2 className="adm-card-title">Your details</h2>
            <form onSubmit={saveIdentity} className="mt-4 space-y-4">
              <div>
                <label className="adm-label" htmlFor="pf-name">Full name</label>
                <input
                  id="pf-name"
                  className="adm-input"
                  value={identity.full_name}
                  onChange={(e) => setIdentity((s) => ({ ...s, full_name: e.target.value }))}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-phone">Phone</label>
                <input
                  id="pf-phone"
                  type="tel"
                  className="adm-input"
                  value={identity.phone}
                  onChange={(e) => setIdentity((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <button type="submit" disabled={busy} className="adm-btn-dark">
                Save details
              </button>
            </form>
          </section>

          <section className="adm-card adm-card-pad">
            <h2 className="adm-card-title">Change password</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-600 dark:text-ink-400">
              Your current password is required — Supabase will not change it otherwise. This
              affects your own account only.
            </p>

            <form onSubmit={savePassword} className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="adm-label" htmlFor="pf-current">Current</label>
                <input
                  id="pf-current"
                  type="password"
                  autoComplete="current-password"
                  className="adm-input"
                  value={passwords.current}
                  onChange={(e) => setPasswords((s) => ({ ...s, current: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-next">New password</label>
                <input
                  id="pf-next"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  className="adm-input"
                  value={passwords.next}
                  onChange={(e) => setPasswords((s) => ({ ...s, next: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="adm-label" htmlFor="pf-confirm">Confirm</label>
                <input
                  id="pf-confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  className="adm-input"
                  value={passwords.confirm}
                  onChange={(e) => setPasswords((s) => ({ ...s, confirm: e.target.value }))}
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <button type="submit" disabled={busy} className="adm-btn-dark">
                  <Icon name="key" size={16} />
                  Update password
                </button>
              </div>
            </form>
          </section>
        </div>
      </div>
    </>
  )
}
