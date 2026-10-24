import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True only when BOTH env vars are present and look real.
 *
 * The app falls back to bundled demo data when this is false, so you can run
 * and review the whole site before creating a Supabase project.
 */
export const isSupabaseConfigured = Boolean(
  url && anonKey && url.startsWith('http') && anonKey.length > 20,
)

/**
 * Supabase client, or null when unconfigured.
 *
 * Only ever constructed with the *anon* key. The service_role key must never
 * reach the browser — it bypasses Row Level Security and is handled through
 * Supabase Edge Function secrets instead (see .env.example).
 */
export const supabase = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null

/**
 * Console note explaining demo mode, so the developer is never confused about
 * why writes are not persisting.
 */
if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.info(
    '%cFootballTrix%c running in DEMO MODE — no Supabase keys found. ' +
      'Copy .env.example to .env, add your project URL and anon key, then restart the dev server.',
    'background:#C8FF3D;color:#0B1220;font-weight:700;border-radius:4px;padding:2px 6px',
    'color:#6b7280',
  )
}
