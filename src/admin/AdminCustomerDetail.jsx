import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import { ErrorState, LoadingState, PageHeader, Toast } from './components/Page'
import { useAdminAuth } from './AdminAuthContext'
import { adminCustomers } from '../lib/adminApi'
import { formatDateTime, formatPrice } from '../lib/format'
import { StatusBadge } from './AdminOrders'

/**
 * One customer's record: contact details, lifetime value and every order
 * they have placed.
 *
 * Role changes are allowed here because promotion is how an admin is made —
 * but the signed-in admin cannot change their own role, so a misclick can
 * never lock the panel behind them.
 */
export default function AdminCustomerDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, refreshProfile } = useAdminAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const result = await adminCustomers.byId(id)
    if (result.error) setError(result.error)
    else if (!result.data?.profile) setError({ message: 'That customer record does not exist.' })
    else setData(result.data)
    setLoading(false)
  }, [id])

  useEffect(() => {
    document.title = 'Customer — FootballTrix Admin'
    load()
  }, [load])

  async function changeRole(next) {
    if (next === data.profile.role) return
    setBusy(true)
    const result = await adminCustomers.setRole(id, next)
    setBusy(false)
    if (result.error) setToast({ tone: 'error', text: result.error.message })
    else {
      setToast({ tone: 'ok', text: `Role changed to ${next}.` })
      load()
      // If the admin just edited their own row, re-read it so the sidebar label
      // and the guard both see the new value.
      if (user?.id === id) refreshProfile()
    }
  }

  if (loading) return <LoadingState label="Loading customer…" />
  if (error) return <ErrorState error={error} onRetry={load} />
  if (!data) return null

  const { profile, orders, orderCount, totalSpent } = data
  const isSelf = user?.id === profile.id

  return (
    <>
      <div className="mb-5">
        <button type="button" onClick={() => navigate(-1)} className="adm-btn-outline">
          <Icon name="arrowLeft" size={16} />
          Back
        </button>
      </div>

      <Toast tone={toast?.tone} onDismiss={() => setToast(null)}>{toast?.text}</Toast>

      <PageHeader
        title={profile.full_name || 'Unnamed customer'}
        lede={profile.email}
        actions={
          <span className={`adm-badge ${profile.role === 'admin' ? 'adm-badge-accent' : 'adm-badge-neutral'}`}>
            {profile.role}
          </span>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* ---------------------------------------------------------- record */}
        <section className="adm-card adm-card-pad">
          <h2 className="adm-card-title">Account</h2>

          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="adm-muted">Full name</dt>
              <dd className="mt-0.5 font-semibold text-ink-950 dark:text-white">
                {profile.full_name || '—'}
              </dd>
            </div>
            <div>
              <dt className="adm-muted">Email</dt>
              <dd className="mt-0.5">
                {profile.email
                  ? <a href={`mailto:${profile.email}`} className="font-semibold text-ink-950 hover:underline dark:text-white">{profile.email}</a>
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="adm-muted">Phone</dt>
              <dd className="mt-0.5 tabular-nums">
                {profile.phone
                  ? <a href={`tel:${profile.phone}`} className="font-semibold text-ink-950 hover:underline dark:text-white">{profile.phone}</a>
                  : '—'}
              </dd>
            </div>
            <div>
              <dt className="adm-muted">Joined</dt>
              <dd className="mt-0.5">{formatDateTime(profile.created_at)}</dd>
            </div>
          </dl>

          <div className="adm-divider mt-5 pt-4">
            <label className="adm-label" htmlFor="customer-role">Role</label>
            <select
              id="customer-role"
              className="adm-select"
              value={profile.role}
              disabled={busy || isSelf}
              onChange={(e) => changeRole(e.target.value)}
            >
              <option value="customer">customer</option>
              <option value="admin">admin</option>
            </select>
            {isSelf && (
              <p className="mt-2 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                This is your own account — its role cannot be changed from here, so a misclick
                cannot revoke your access to the panel.
              </p>
            )}
          </div>
        </section>

        {/* --------------------------------------------------------- summary */}
        <section className="adm-card adm-card-pad lg:col-span-2">
          <h2 className="adm-card-title">Lifetime value</h2>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-ink-50 px-4 py-3.5 dark:bg-ink-800/60">
              <p className="adm-muted">Orders</p>
              <p className="mt-1 font-display text-3xl font-extrabold leading-none text-ink-950 dark:text-white">
                {orderCount}
              </p>
            </div>
            <div className="rounded-xl bg-ink-50 px-4 py-3.5 dark:bg-ink-800/60">
              <p className="adm-muted">Total spent</p>
              <p className="mt-1 font-display text-3xl font-extrabold leading-none text-ink-950 dark:text-white">
                {formatPrice(totalSpent)}
              </p>
            </div>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
            Cancelled orders are counted as orders but excluded from spend.
          </p>
        </section>
      </div>

      {/* ------------------------------------------------------------ orders */}
      <section className="adm-card mt-5 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="adm-card-title">Order history</h2>
          <span className="text-xs text-ink-500 dark:text-ink-400">{orderCount} total</span>
        </div>

        {orders.length === 0 ? (
          <div className="border-t border-ink-100 px-5 py-10 text-center dark:border-ink-800">
            <Icon name="cart" size={22} className="mx-auto text-ink-500" />
            <p className="mt-3 text-sm font-bold text-ink-950 dark:text-white">No orders yet</p>
            <p className="mt-1 text-sm text-ink-600 dark:text-ink-400">
              This account has not placed an order.
            </p>
          </div>
        ) : (
          <div className="adm-table-wrap border-t border-ink-100 dark:border-ink-800">
            <table className="adm-table">
              <thead>
                <tr>
                  <th className="adm-th">Order</th>
                  <th className="adm-th">Status</th>
                  <th className="adm-th">Payment</th>
                  <th className="adm-th text-right">Total</th>
                  <th className="adm-th">Placed</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="adm-tr-hover">
                    <td className="adm-td">
                      <Link
                        to={`/admin/orders/${order.id}`}
                        className="font-semibold text-ink-950 underline-offset-4 hover:underline dark:text-white"
                      >
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="adm-td"><StatusBadge status={order.status} /></td>
                    <td className="adm-td">
                      <span className={`adm-badge ${order.payment_status === 'paid' ? 'adm-badge-ok' : 'adm-badge-neutral'}`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="adm-td text-right font-semibold tabular-nums">
                      {formatPrice(order.total)}
                    </td>
                    <td className="adm-td whitespace-nowrap text-ink-600 dark:text-ink-400">
                      {formatDateTime(order.placed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
